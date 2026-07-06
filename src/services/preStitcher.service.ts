import { DBDataSource } from '@/databases';
import { PreStitcherAssignmentDto, PreStitchOptionsDto } from '@/dtos/prestitcher.dto';
import { DeliveryMemoEntity } from '@/entities/deliverymemo.entity';
import { DeliveryMemoItemEntity } from '@/entities/deliveryMemoItem.entity';
import { DeliveryMemoStageHistoryEntity } from '@/entities/deliveryMemoStageHistory.entity';
import { FabricEntity } from '@/entities/fabric.entity';
import { PreStitcherAssignmentEntity, PreStitcherAssignmentStatus } from '@/entities/preStitcher.entity';
import { PreStitchOptionsEntity } from '@/entities/prestitchOptions.entity';
import { UserEntity } from '@/entities/users.entity';
import { HttpException } from '@/exceptions/HttpException';
import DeliveryMemoStageHistoryService from './deliveryMemoStageHistory.service';
import { PreStitcherPartialCompletionEntity } from '@/entities/preStitcherPartialCompletion.entity';
import { In, IsNull } from 'typeorm';

class PreStitcherService {
  public users = DBDataSource.getRepository(UserEntity);
  public deliveryMemos = DBDataSource.getRepository(DeliveryMemoEntity);
  public deliveryMemoItems = DBDataSource.getRepository(DeliveryMemoItemEntity);
  public fabricEntity = DBDataSource.getRepository(FabricEntity);
  public assignments = DBDataSource.getRepository(PreStitcherAssignmentEntity);
  public options = DBDataSource.getRepository(PreStitchOptionsEntity);
  public stageHistory = DBDataSource.getRepository(DeliveryMemoStageHistoryEntity);
  public stageHistoryService = new DeliveryMemoStageHistoryService();
  public partialCompletions = DBDataSource.getRepository(PreStitcherPartialCompletionEntity);

  public async findAllPreStitcher(): Promise<UserEntity[]> {
    return this.users.find({
      where: { roleName: 'pre-stitcher', isActive: true },
      order: { firstName: 'ASC' },
    });
  }

public async assignMultiplePreStitchers(
  deliveryMemoId: string,
  assignmentsList: PreStitcherAssignmentDto[],
  performedBy: string,
): Promise<{
  memo: DeliveryMemoEntity;
  assignments: PreStitcherAssignmentEntity[];
}> {
  return DBDataSource.transaction(async manager => {
    const memoRepo       = manager.getRepository(DeliveryMemoEntity);
    const assignmentRepo = manager.getRepository(PreStitcherAssignmentEntity);
    const userRepo       = manager.getRepository(UserEntity);
    const itemRepo       = manager.getRepository(DeliveryMemoItemEntity);

    // ── 1. Validate memo ────────────────────────────────────────────────────
    const memo = await memoRepo.findOne({
      where: { _id: deliveryMemoId },
      relations: ['items'],
    });

    if (!memo) throw new HttpException(404, 'Delivery memo not found');

    const items = await itemRepo.find({ where: { deliveryMemoId } });
    const totalShirtQuantity = items.reduce((sum, item) => sum + (item.shirtQuantity || 0), 0);

    if (totalShirtQuantity === 0) {
      throw new HttpException(400, 'No shirts available in this delivery memo');
    }


    const deduplicatedAssignmentsList = assignmentsList.map(assignmentData => {
      const mergedOptions = new Map<string, number>();

      for (const opt of assignmentData.options) {
        const existing = mergedOptions.get(opt.option) || 0;
        mergedOptions.set(opt.option, existing + opt.quantity);
      }

      return {
        ...assignmentData,
        options: Array.from(mergedOptions.entries()).map(([option, quantity]) => ({
          option,
          quantity,
        })),
      };
    });

    // ── 3. Validate deduplicated totals don't exceed available shirts ────────
    const optionTotals = new Map<string, number>();
    deduplicatedAssignmentsList.forEach(assignment => {
      assignment.options.forEach(opt => {
        const current = optionTotals.get(opt.option) || 0;
        optionTotals.set(opt.option, current + opt.quantity);
      });
    });

    for (const [option, total] of optionTotals.entries()) {
      if (total > totalShirtQuantity) {
        throw new HttpException(
          400,
          `Total quantity for "${option}" (${total}) exceeds available shirts (${totalShirtQuantity})`,
        );
      }
    }

    // ── 4. Validate all pre-stitcher IDs exist ──────────────────────────────
    const preStitcherIds = deduplicatedAssignmentsList.map(a => a.preStitcherId);
    const preStitchers = await userRepo.find({
      where: preStitcherIds.map(id => ({ _id: id, roleName: 'pre-stitcher' })),
    });

    if (preStitchers.length !== preStitcherIds.length) {
      throw new HttpException(404, 'One or more pre-stitchers not found');
    }

    // ── 5. Load ALL existing assignments for this memo ──────────────────────
    //       Needed to carry forward already-completed quantities on re-assignment.
    const existingAssignments = await assignmentRepo.find({
      where: { deliveryMemoId },
    });

    // Mark every currently-active assignment UNASSIGNED (identical to original).
    await assignmentRepo.update(
      {
        deliveryMemoId,
        status: In([
          PreStitcherAssignmentStatus.ASSIGNED,
          PreStitcherAssignmentStatus.IN_PROGRESS,
        ]),
      },
      { status: PreStitcherAssignmentStatus.UNASSIGNED },
    );

    
    const createdAssignments: PreStitcherAssignmentEntity[] = [];

    for (const assignmentData of deduplicatedAssignmentsList) {

      // Find the most-recent existing record for this pre-stitcher + memo.
      // If multiple exist (historical), prefer the one with the most completed work.
      const existingForWorker = existingAssignments
        .filter(a => a.preStitcherId === assignmentData.preStitcherId)
        .sort((a, b) => {
          const completedA = (a.optionProgress || []).reduce((s, p) => s + p.completedQuantity, 0);
          const completedB = (b.optionProgress || []).reduce((s, p) => s + p.completedQuantity, 0);
          return completedB - completedA; // descending — most work done first
        })[0] ?? null;

      // Build new optionProgress, summing across any duplicate old entries
      // defensively (handles the case where the existing record itself had dupes).
      const newOptionProgress = assignmentData.options.map(opt => {
        const alreadyCompleted = existingForWorker
          ? (existingForWorker.optionProgress || [])
              .filter(p => p.option === opt.option)
              .reduce((s, p) => s + p.completedQuantity, 0)
          : 0;

        const newTotal      = opt.quantity + alreadyCompleted;
        const inProgressQty = newTotal - alreadyCompleted; // === opt.quantity

        return {
          option:             opt.option,
          totalQuantity:      newTotal,
          completedQuantity:  alreadyCompleted,
          inProgressQuantity: inProgressQty,
        };
      });

      // assignedOptions mirrors the same merged totals (for admin UI display).
      const newAssignedOptions = assignmentData.options.map(opt => {
        const alreadyCompleted = existingForWorker
          ? (existingForWorker.optionProgress || [])
              .filter(p => p.option === opt.option)
              .reduce((s, p) => s + p.completedQuantity, 0)
          : 0;
        return {
          option:   opt.option,
          quantity: opt.quantity + alreadyCompleted,
        };
      });

      if (existingForWorker) {
        // UPDATE in-place — same _id, all partialCompletion FKs stay valid
        existingForWorker.assignedOptions  = newAssignedOptions;
        existingForWorker.optionProgress   = newOptionProgress;
        existingForWorker.status           = PreStitcherAssignmentStatus.ASSIGNED;
        existingForWorker.completedAt      = null;

        const saved = await assignmentRepo.save(existingForWorker);
        createdAssignments.push(saved);
      } else {
        // CREATE — first time this worker is assigned to this memo
        const assignment = assignmentRepo.create({
          preStitcherId:   assignmentData.preStitcherId,
          deliveryMemoId,
          assignedOptions: newAssignedOptions,
          optionProgress:  newOptionProgress,
          status:          PreStitcherAssignmentStatus.ASSIGNED,
        });

        const saved = await assignmentRepo.save(assignment);
        createdAssignments.push(saved);
      }
    }

    // ── 7. Update memo stage (identical to original) ────────────────────────
    memo.stage                 = 'PRE_STITCHER_ASSIGNED';
    memo.assignedPreStitcherId = createdAssignments[0].preStitcherId;
    await memoRepo.save(memo);

    // ── 8. Stage history (identical to original) ────────────────────────────
    await this.stageHistoryService.createStageHistory({
      deliveryMemoId,
      stage:       'PRE_STITCHER_ASSIGNED',
      performedBy,
      metadata: {
        assignmentType:      'MULTIPLE_WITH_QUANTITIES',
        totalShirtQuantity,
        assignments: createdAssignments.map(a => ({
          assignmentId:   a._id,
          preStitcherId:  a.preStitcherId,
          options:        a.assignedOptions,
          optionProgress: a.optionProgress,
        })),
      },
    });

    return { memo, assignments: createdAssignments };
  });
}


  public async completeAssignment(assignmentId: string, completedBy: string, notes?: string): Promise<any> {
    return DBDataSource.transaction(async manager => {
      const assignmentRepo = manager.getRepository(PreStitcherAssignmentEntity);
      const memoRepo = manager.getRepository(DeliveryMemoEntity);

      const assignment = await assignmentRepo.findOne({
        where: { _id: assignmentId },
        relations: ['deliveryMemo', 'preStitcher'],
      });

      if (!assignment) {
        throw new HttpException(404, 'Assignment not found');
      }

      if (assignment.status === PreStitcherAssignmentStatus.COMPLETED) {
        throw new HttpException(400, 'Assignment already completed');
      }

      assignment.status = PreStitcherAssignmentStatus.COMPLETED;
      assignment.completedAt = new Date();
      await assignmentRepo.save(assignment);

      const memo = await memoRepo.findOne({
        where: { _id: assignment.deliveryMemoId },
      });

      if (!memo) {
        throw new HttpException(404, 'Memo not found');
      }

      const allAssignments = await assignmentRepo.find({
        where: { deliveryMemoId: memo._id },
      });

      const allCompleted = allAssignments.every(
        a => a.status === PreStitcherAssignmentStatus.COMPLETED || a.status === PreStitcherAssignmentStatus.UNASSIGNED,
      );

      if (allCompleted) {
        memo.stage = 'ASSIGN_TAILOR';
        memo.assignedPreStitcherId = null;
      }

      if (allCompleted) {
        memo.stage = 'PRE_STITCHER_COMPLETED';
        memo.assignedPreStitcherId = null;

        await memoRepo.save(memo);

        await this.stageHistoryService.createStageHistory({
          deliveryMemoId: memo._id,
          stage: 'PRE_STITCHER_COMPLETED',
          performedBy: completedBy,
          metadata: {
            assignmentId: assignment._id,
            reason: 'Pre-stitcher handover completed',
          },
        });
      } else {
        await this.stageHistoryService.createStageHistory({
          deliveryMemoId: memo._id,
          stage: 'PRE_STITCHER_IN_PROGRESS',
          performedBy: completedBy,
          metadata: {
            assignmentId: assignment._id,
            notes,
          },
        });
      }

      return {
        assignment,
        memo,
        allCompleted,
      };
    });
  }

  public async getAssignmentSummary(deliveryMemoId: string): Promise<any> {
    const assignments = await this.assignments.find({
      where: { deliveryMemoId },
      relations: ['preStitcher'],
    });

    const items = await this.deliveryMemoItems.find({
      where: { deliveryMemoId },
    });

    const totalShirtQuantity = items.reduce((sum, item) => sum + (item.shirtQuantity || 0), 0);

    const optionSummary = new Map<string, { assigned: number; completed: number }>();

    assignments
      .filter(a => a.status !== PreStitcherAssignmentStatus.UNASSIGNED)
      .forEach(assignment => {
        assignment.assignedOptions.forEach(opt => {
          const current = optionSummary.get(opt.option) || { assigned: 0, completed: 0 };
          current.assigned += opt.quantity;
          if (assignment.status === PreStitcherAssignmentStatus.COMPLETED) {
            current.completed += assignment.completedQuantity;
          }
          optionSummary.set(opt.option, current);
        });
      });

    return {
      totalShirtQuantity,
      assignments: assignments.map(a => ({
        _id: a._id,
        preStitcher: {
          id: a.preStitcher._id,
          name: `${a.preStitcher.firstName} ${a.preStitcher.lastName}`,
        },
        options: a.assignedOptions,
        status: a.status,
        completedQuantity: a.completedQuantity,
        createdAt: a.createdAt,
      })),
      optionSummary: Array.from(optionSummary.entries()).map(([option, data]) => ({
        option,
        ...data,
        remaining: data.assigned - data.completed,
      })),
    };
  }


  public async getAssignmentsByMemoId(deliveryMemoId: string): Promise<any[]> {
    const assignments = await this.assignments.find({
      where: { deliveryMemoId },
      relations: ['preStitcher'],
      order: { createdAt: 'DESC' },
    });

    const partialCompletions = await this.partialCompletions.find({
      where: { deliveryMemoId },
      order: { createdAt: 'DESC' },
    });

    return assignments.map(assignment => ({
      _id: assignment._id,
      preStitcherId: assignment.preStitcherId,
      preStitcherName: assignment.preStitcher ? `${assignment.preStitcher.firstName} ${assignment.preStitcher.lastName}` : 'Unknown',
      preStitcherEmail: assignment.preStitcher?.email || null,
      assignedOptions: assignment.assignedOptions || [],
      optionProgress: assignment.optionProgress || [],
      status: assignment.status,
      completedQuantity: assignment.completedQuantity || 0,
      completedAt: assignment.completedAt,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
      notes: assignment.notes,
      partialCompletions: partialCompletions.filter(pc => pc.assignmentId === assignment._id),
    }));
  }

  public async assignPreStitcherToMemo(
    preStitcherId: string,
    deliveryMemoId: string,
    optionsDto?: PreStitchOptionsDto,
  ): Promise<{ assignment: PreStitcherAssignmentEntity; options: PreStitchOptionsEntity | null }> {
    return DBDataSource.transaction(async manager => {
      const userRepo = manager.getRepository(UserEntity);
      const memoRepo = manager.getRepository(DeliveryMemoEntity);
      const assignmentRepo = manager.getRepository(PreStitcherAssignmentEntity);
      const optionsRepo = manager.getRepository(PreStitchOptionsEntity);

      const user = await userRepo.findOne({
        where: { _id: preStitcherId, roleName: 'pre-stitcher' },
      });
      if (!user) {
        throw new HttpException(404, 'pre-stitcher not found or invalid role');
      }

      const memo = await memoRepo.findOne({
        where: { _id: deliveryMemoId },
        relations: ['items'],
      });
      if (!memo) {
        throw new HttpException(404, 'Delivery memo not found');
      }

      await assignmentRepo.update(
        { deliveryMemoId, status: PreStitcherAssignmentStatus.ASSIGNED },
        { status: PreStitcherAssignmentStatus.UNASSIGNED },
      );

      const assignment = assignmentRepo.create({
        preStitcherId,
        deliveryMemoId,
        status: PreStitcherAssignmentStatus.ASSIGNED,
      });

      await assignmentRepo.save(assignment);

      let savedOptions: PreStitchOptionsEntity | null = null;
      if (optionsDto) {
        const optionsEntity = optionsRepo.create({
          assignmentId: assignment._id,
          label: optionsDto.label ?? false,
          flacket: optionsDto.flacket ?? false,
          covering: optionsDto.covering ?? false,
          pocket: optionsDto.pocket ?? false,
          shoulder: optionsDto.shoulder ?? false,
          chockPatti: optionsDto.chockPatti ?? false,
        });

        savedOptions = await optionsRepo.save(optionsEntity);
      }

      memo.assignedPreStitcherId = preStitcherId;
      memo.stage = 'PRE_STITCHER_ASSIGNED';
      await memoRepo.save(memo);

      await this.stageHistoryService.createStageHistory({
        deliveryMemoId,
        stage: 'PRE_STITCHER_ASSIGNED',
        performedBy: user._id,
        metadata: {
          assignmentId: assignment._id,
          preStitcherId,
          options: savedOptions,
        },
      });

      return { assignment, options: savedOptions };
    });
  }

  public async completeMemo(deliveryMemoId: string, completedBy: string, notes?: string): Promise<any> {
    return DBDataSource.transaction(async manager => {
      const memoRepo = manager.getRepository(DeliveryMemoEntity);
      const assignmentRepo = manager.getRepository(PreStitcherAssignmentEntity);

      const memo = await memoRepo.findOne({
        where: { _id: deliveryMemoId },
        relations: ['items', 'stageHistory'],
      });

      if (!memo) {
        throw new HttpException(404, 'Delivery memo not found');
      }

      if (memo.stage !== 'PRE_STITCHER_ASSIGNED') {
        throw new HttpException(400, `Cannot complete memo in stage: ${memo.stage}`);
      }

      memo.stage = 'ASSIGN_TAILOR';
      memo.assignedPreStitcherId = null;
      await memoRepo.save(memo);

      await this.stageHistoryService.createStageHistory({
        deliveryMemoId,
        stage: 'ASSIGN_TAILOR',
        performedBy: completedBy,
        metadata: {
          notes,
          previousStage: 'PRE_STITCHER_ASSIGNED',
          completedAt: new Date(),
        },
      });

      return {
        deliveryMemoId: memo._id,
        stage: memo.stage,
        message: 'Pre-stitching completed successfully',
      };
    });
  }

  public async getPreStitcherReport(preStitcherId: string, fromDate?: Date, toDate?: Date, searchQuery?: string): Promise<any> {
    try {
      console.log('[REPORT] Starting report generation for:', preStitcherId);
      console.log('[REPORT] Date range:', fromDate, 'to', toDate);
      console.log('[REPORT] Search query:', searchQuery);

      const user = await this.users.findOne({
        where: { _id: preStitcherId, roleName: 'pre-stitcher' },
      });

      if (!user) {
        throw new HttpException(404, 'Pre-stitcher not found');
      }

      const effectiveToDate = toDate || new Date();
      const effectiveFromDate = fromDate || new Date(effectiveToDate.getTime() - 30 * 24 * 60 * 60 * 1000);

      console.log('[REPORT] Effective date range:', effectiveFromDate, 'to', effectiveToDate);

      const allAssignments = await this.assignments.find({
        where: { preStitcherId },
        relations: ['deliveryMemo', 'deliveryMemo.items'],
        order: { createdAt: 'DESC' },
      });

      console.log(`[REPORT] Found ${allAssignments.length} total assignments`);

      const assigned = allAssignments.filter(a => a.status === PreStitcherAssignmentStatus.ASSIGNED);
      const inProgress = allAssignments.filter(a => a.status === PreStitcherAssignmentStatus.IN_PROGRESS);
      const completed = allAssignments.filter(a => a.status === PreStitcherAssignmentStatus.COMPLETED);
      const unassigned = allAssignments.filter(a => a.status === PreStitcherAssignmentStatus.UNASSIGNED);

      const pendingTasks = assigned.length + inProgress.length;


      const partialCompletionsQuery = this.partialCompletions
        .createQueryBuilder('pc')
        .where('pc.preStitcherId = :preStitcherId', { preStitcherId })
        .andWhere('pc.createdAt >= :fromDate', { fromDate: effectiveFromDate })
        .andWhere('pc.createdAt <= :toDate', { toDate: effectiveToDate })
        .orderBy('pc.createdAt', 'DESC');

      const partialCompletions = await partialCompletionsQuery.getMany();

      console.log(`[REPORT] Found ${partialCompletions.length} partial completions in date range`);


      const totalShirtsHandedOver = partialCompletions.reduce((sum, pc) => sum + (pc.totalShirtsHandedOver || 0), 0);

      const receivedHandovers = partialCompletions.filter(pc => pc.status === 'RECEIVED_BY_NEXT_STAGE');

      const totalShirtsReceived = receivedHandovers.reduce((sum, pc) => sum + (pc.totalShirtsHandedOver || 0), 0);

      const pendingHandovers = partialCompletions.filter(pc => pc.status === 'HANDED_OVER');

      const totalShirtsPending = pendingHandovers.reduce((sum, pc) => sum + (pc.totalShirtsHandedOver || 0), 0);


      let totalShirtsAssigned = 0;
      let totalShirtsCompleted = 0;
      let totalShirtsInProgress = 0;

      allAssignments.forEach(assignment => {
        if (assignment.optionProgress && Array.isArray(assignment.optionProgress)) {
          assignment.optionProgress.forEach(progress => {
            totalShirtsAssigned += progress.totalQuantity || 0;
            totalShirtsCompleted += progress.completedQuantity || 0;
            totalShirtsInProgress += progress.inProgressQuantity || 0;
          });
        }
      });


      const completedMemoIds = new Set(
        completed
          .filter(a => {
            if (!a.completedAt) return false;
            return a.completedAt >= effectiveFromDate && a.completedAt <= effectiveToDate;
          })
          .map(a => a.deliveryMemoId)
          .filter(id => id),
      );

      const completedMemosDetails = await Promise.all(
        Array.from(completedMemoIds).map(async memoId => {
          try {
            const memo = await this.deliveryMemos.findOne({
              where: { _id: memoId },
              relations: ['items'],
            });

            if (!memo) return null;


            const itemsWithFabrics = await Promise.all(
              (memo.items || []).map(async item => {
                try {
                  const fabric = await this.fabricEntity.findOne({
                    where: { sku: item.fabricSKU, isDeleted: false },
                  });

                  return {
                    fabricSKU: item.fabricSKU,
                    fabricTitle: fabric?.title || 'Unknown',
                    fabricColor: fabric?.color || 'Unknown',
                    shirtSKUs: item.shirtSKUs || [],
                    shirtQuantity: item.shirtQuantity || 0,
                  };
                } catch {
                  return {
                    fabricSKU: item.fabricSKU,
                    fabricTitle: 'Unknown',
                    fabricColor: 'Unknown',
                    shirtSKUs: item.shirtSKUs || [],
                    shirtQuantity: item.shirtQuantity || 0,
                  };
                }
              }),
            );

            const fabricTitles = Array.from(new Set(itemsWithFabrics.map(i => i.fabricTitle)));


            if (searchQuery) {
              const searchLower = searchQuery.toLowerCase();
              const matchesFabric = fabricTitles.some(title => title.toLowerCase().includes(searchLower));
              const matchesMemoId = memo._id.toLowerCase().includes(searchLower);

              if (!matchesFabric && !matchesMemoId) {
                return null;
              }
            }

            const completedAssignment = completed.find(a => a.deliveryMemoId === memoId);

            return {
              deliveryMemoId: memo._id,
              completedAt: completedAssignment?.completedAt || memo.updatedAt,
              itemCount: memo.items?.length || 0,
              items: itemsWithFabrics,
              fabricTitles,
              totalShirtsProduced: itemsWithFabrics.reduce((sum, i) => sum + i.shirtQuantity, 0),
            };
          } catch (error) {
            console.error('[REPORT] Error processing completed memo:', error);
            return null;
          }
        }),
      );

      const validCompletedMemos = completedMemosDetails.filter(m => m !== null);


      const inProgressMemoIds = new Set(
        [...assigned, ...inProgress]
          .filter(a => {
            if (!a.createdAt) return false;
            return a.createdAt >= effectiveFromDate && a.createdAt <= effectiveToDate;
          })
          .map(a => a.deliveryMemoId)
          .filter(id => id),
      );

      const inProgressMemosDetails = await Promise.all(
        Array.from(inProgressMemoIds).map(async memoId => {
          try {
            const memo = await this.deliveryMemos.findOne({
              where: { _id: memoId },
              relations: ['items'],
            });

            if (!memo) return null;

            const assignment = allAssignments.find(a => a.deliveryMemoId === memoId);

            const itemsWithFabrics = await Promise.all(
              (memo.items || []).map(async item => {
                try {
                  const fabric = await this.fabricEntity.findOne({
                    where: { sku: item.fabricSKU, isDeleted: false },
                  });

                  return {
                    fabricSKU: item.fabricSKU,
                    fabricTitle: fabric?.title || 'Unknown',
                    fabricColor: fabric?.color || 'Unknown',
                    shirtSKUs: item.shirtSKUs || [],
                    shirtQuantity: item.shirtQuantity || 0,
                  };
                } catch {
                  return {
                    fabricSKU: item.fabricSKU,
                    fabricTitle: 'Unknown',
                    fabricColor: 'Unknown',
                    shirtSKUs: item.shirtSKUs || [],
                    shirtQuantity: item.shirtQuantity || 0,
                  };
                }
              }),
            );

            const fabricTitles = Array.from(new Set(itemsWithFabrics.map(i => i.fabricTitle)));


            if (searchQuery) {
              const searchLower = searchQuery.toLowerCase();
              const matchesFabric = fabricTitles.some(title => title.toLowerCase().includes(searchLower));
              const matchesMemoId = memo._id.toLowerCase().includes(searchLower);

              if (!matchesFabric && !matchesMemoId) {
                return null;
              }
            }

            return {
              deliveryMemoId: memo._id,
              assignedAt: assignment?.createdAt || memo.createdAt,
              status: assignment?.status || 'ASSIGNED',
              itemCount: memo.items?.length || 0,
              items: itemsWithFabrics,
              fabricTitles,
              optionProgress: assignment?.optionProgress || [],
              totalShirtsAssigned: itemsWithFabrics.reduce((sum, i) => sum + i.shirtQuantity, 0),
            };
          } catch (error) {
            console.error('[REPORT] Error processing in-progress memo:', error);
            return null;
          }
        }),
      );

      const validInProgressMemos = inProgressMemosDetails.filter(m => m !== null);


      const completionRate = totalShirtsAssigned > 0 ? parseFloat(((totalShirtsCompleted / totalShirtsAssigned) * 100).toFixed(2)) : 0.0;


      let totalCompletionTime = 0;
      let completedCount = 0;

      for (const assignment of completed) {
        if (assignment.completedAt && assignment.createdAt) {
          const duration = new Date(assignment.completedAt).getTime() - new Date(assignment.createdAt).getTime();
          totalCompletionTime += duration;
          completedCount++;
        }
      }

      const averageCompletionTimeHours = completedCount > 0 ? parseFloat((totalCompletionTime / completedCount / (1000 * 60 * 60)).toFixed(2)) : 0.0;


      const report = {
        preStitcher: {
          id: user._id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          roleName: user.roleName,
        },
        filters: {
          fromDate: effectiveFromDate,
          toDate: effectiveToDate,
          searchQuery: searchQuery || null,
        },
        statistics: {
          totalAssignments: allAssignments.length,
          assignedTasks: assigned.length,
          inProgressTasks: pendingTasks,
          completedTasks: completed.length,
          unassignedTasks: unassigned.length,
          totalShirtsAssigned,
          totalShirtsCompleted,
          totalShirtsInProgress,
          completionRate,
          totalHandovers: partialCompletions.length,
          totalShirtsHandedOver,
          totalShirtsReceived,
          totalShirtsPending,
          pendingHandovers: pendingHandovers.length,
          receivedHandovers: receivedHandovers.length,
          averageCompletionTimeHours,
        },
        completedMemos: validCompletedMemos || [],
        inProgressMemos: validInProgressMemos || [],
        recentHandovers:
          partialCompletions.slice(0, 50).map(pc => ({
            _id: pc._id,
            deliveryMemoId: pc.deliveryMemoId,
            completedItems: pc.completedItems || [],
            totalShirtsHandedOver: pc.totalShirtsHandedOver || 0,
            status: pc.status,
            createdAt: pc.createdAt,
            receivedAt: pc.receivedAt,
            notes: pc.notes,
          })) || [],
      };

      console.log('[REPORT] Report generated successfully');
      console.log('- Completed memos (filtered):', validCompletedMemos.length);
      console.log('- In progress memos (filtered):', validInProgressMemos.length);
      console.log('- Handovers (filtered):', partialCompletions.length);

      return report;
    } catch (error) {
      console.error('[REPORT] Error generating report:', error);
      throw error;
    }
  }

  private async calculateCompletionStats(preStitcherId: string): Promise<{
    completionRate: number;
    averageTimeHours: number;
  }> {
    const assignedHistory = await this.stageHistory.find({
      where: {
        stage: 'PRE_STITCHER_ASSIGNED',
        metadata: { preStitcherId } as any,
      },
    });

    const completedHistory = await this.stageHistory.find({
      where: {
        stage: 'ASSIGN_TAILOR',
        performedBy: preStitcherId,
      },
    });

    const totalAssigned = assignedHistory.length;
    const totalCompleted = completedHistory.length;
    const completionRate = totalAssigned > 0 ? (totalCompleted / totalAssigned) * 100 : 0;

    let totalDurationMs = 0;
    let completionsWithTime = 0;

    for (const completed of completedHistory) {
      const assigned = assignedHistory.find(a => a.deliveryMemoId === completed.deliveryMemoId);
      if (assigned) {
        const durationMs = new Date(completed.enteredAt).getTime() - new Date(assigned.enteredAt).getTime();
        totalDurationMs += durationMs;
        completionsWithTime++;
      }
    }

    const averageTimeHours = completionsWithTime > 0 ? totalDurationMs / completionsWithTime / (1000 * 60 * 60) : 0;

    return {
      completionRate: Number(completionRate.toFixed(2)),
      averageTimeHours: Number(averageTimeHours.toFixed(2)),
    };
  }

  public async getAssignmentWithOptions(assignmentId: string): Promise<{
    assignment: PreStitcherAssignmentEntity;
    options: PreStitchOptionsEntity | null;
  }> {
    const assignment = await this.assignments.findOne({
      where: { _id: assignmentId },
      relations: ['preStitcher', 'deliveryMemo'],
    });

    if (!assignment) {
      throw new HttpException(404, 'Assignment not found');
    }

    const options = await this.options.findOne({
      where: { assignmentId },
    });

    return { assignment, options };
  }

  public async getAssignmentByMemoId(deliveryMemoId: string): Promise<{
    assignment: PreStitcherAssignmentEntity;
    options: PreStitchOptionsEntity | null;
  } | null> {
    const assignment = await this.assignments.findOne({
      where: {
        deliveryMemoId,
        status: PreStitcherAssignmentStatus.ASSIGNED,
      },
      relations: ['preStitcher', 'deliveryMemo'],
    });

    if (!assignment) {
      return null;
    }

    const options = await this.options.findOne({
      where: { assignmentId: assignment._id },
    });

    return { assignment, options };
  }

  public async getAllMemos(preStitcherId: string): Promise<any[]> {
    const assignments = await this.assignments.find({
      where: {
        preStitcherId,
      },
      relations: ['deliveryMemo', 'deliveryMemo.items'],
      order: { createdAt: 'DESC' },
    });

    if (assignments.length === 0) {
      return [];
    }

    const uniqueMemos = new Map<string, any>();

    for (const assignment of assignments) {
      const memo = assignment.deliveryMemo;

      if (!memo) {
        continue;
      }

      const partialCompletions = await this.partialCompletions.find({
        where: { assignmentId: assignment._id },
        order: { createdAt: 'DESC' },
      });

      if (uniqueMemos.has(memo._id)) {
        const existingMemo = uniqueMemos.get(memo._id);
        existingMemo.assignments.push({
          _id: assignment._id,
          options: assignment.assignedOptions || [],
          optionProgress: assignment.optionProgress || [],
          status: assignment.status,
          completedQuantity: assignment.completedQuantity || 0,
          partialCompletions: partialCompletions.map(pc => ({
            _id: pc._id,
            completedItems: pc.completedItems,
            totalShirtsHandedOver: pc.totalShirtsHandedOver,
            status: pc.status,
            createdAt: pc.createdAt,
            receivedAt: pc.receivedAt,
            notes: pc.notes,
          })),
        });
        continue;
      }

      const enrichedItems = await Promise.all(
        (memo.items || []).map(async item => {
          try {
            const fabric = await this.fabricEntity.findOne({
              where: { sku: item.fabricSKU, isDeleted: false },
            });

            return {
              _id: item._id,
              fabricSKU: item.fabricSKU,
              dhap: item.dhap,
              fold: item.fold,
              totalDhapFold: item.totalDhapFold,
              damagedQuantity: item.damagedQuantity || 0,
              returnedQuantity: item.returnedQuantity || 0,
              shirtSKUs: item.shirtSKUs || [],
              shirtQuantity: item.shirtQuantity || null,
              fabricTitle: fabric?.title || 'Unknown',
              fabricColor: fabric?.color || 'Unknown',
              imageUrl: fabric?.imageUrl || null,
            };
          } catch (error) {
            return {
              _id: item._id,
              fabricSKU: item.fabricSKU,
              dhap: item.dhap,
              fold: item.fold,
              totalDhapFold: item.totalDhapFold,
              damagedQuantity: item.damagedQuantity || 0,
              returnedQuantity: item.returnedQuantity || 0,
              shirtSKUs: item.shirtSKUs || [],
              shirtQuantity: item.shirtQuantity || null,
              fabricTitle: 'Unknown',
              fabricColor: 'Unknown',
              imageUrl: null,
            };
          }
        }),
      );

      const memoData = {
        _id: memo._id,
        deliveryMemoId: memo._id,
        stage: memo.stage,
        assignedPreStitcherId: preStitcherId,
        createdAt: memo.createdAt,
        updatedAt: memo.updatedAt,
        createdBy: memo.createdBy,
        totalDhapFold: memo.totalDhapFold,
        items: enrichedItems,
        itemCount: enrichedItems.length,
        isDone: memo.stage === 'PRE_STITCHER_COMPLETED',
        assignments: [
          {
            _id: assignment._id,
            options: assignment.assignedOptions || [],
            optionProgress: assignment.optionProgress || [],
            status: assignment.status,
            completedQuantity: assignment.completedQuantity || 0,
            partialCompletions: partialCompletions.map(pc => ({
              _id: pc._id,
              completedItems: pc.completedItems,
              totalShirtsHandedOver: pc.totalShirtsHandedOver,
              status: pc.status,
              createdAt: pc.createdAt,
              receivedAt: pc.receivedAt,
              notes: pc.notes,
            })),
          },
        ],
      };

      uniqueMemos.set(memo._id, memoData);
    }

    return Array.from(uniqueMemos.values());
  }

  public async getAssignedMemos(preStitcherId: string): Promise<any[]> {
    const assignments = await this.assignments.find({
      where: {
        preStitcherId,
        status: In([PreStitcherAssignmentStatus.ASSIGNED, PreStitcherAssignmentStatus.IN_PROGRESS]),
      },
      relations: ['deliveryMemo', 'deliveryMemo.items'],
      order: { createdAt: 'DESC' },
    });

    if (assignments.length === 0) {
      return [];
    }

    const uniqueMemos = new Map<string, any>();

    for (const assignment of assignments) {
      const memo = assignment.deliveryMemo;

      if (!memo) {
        continue;
      }

      const partialCompletions = await this.partialCompletions.find({
        where: { assignmentId: assignment._id },
        order: { createdAt: 'DESC' },
      });

      if (uniqueMemos.has(memo._id)) {
        const existingMemo = uniqueMemos.get(memo._id);
        existingMemo.assignments.push({
          _id: assignment._id,
          options: assignment.assignedOptions || [],
          optionProgress: assignment.optionProgress || [],
          status: assignment.status,
          completedQuantity: assignment.completedQuantity || 0,
          partialCompletions: partialCompletions.map(pc => ({
            _id: pc._id,
            completedItems: pc.completedItems,
            totalShirtsHandedOver: pc.totalShirtsHandedOver,
            status: pc.status,
            createdAt: pc.createdAt,
            receivedAt: pc.receivedAt,
            notes: pc.notes,
          })),
        });
        continue;
      }

      const enrichedItems = await Promise.all(
        (memo.items || []).map(async item => {
          try {
            const fabric = await this.fabricEntity.findOne({
              where: { sku: item.fabricSKU, isDeleted: false },
            });

            return {
              _id: item._id,
              fabricSKU: item.fabricSKU,
              dhap: item.dhap,
              fold: item.fold,
              totalDhapFold: item.totalDhapFold,
              damagedQuantity: item.damagedQuantity || 0,
              returnedQuantity: item.returnedQuantity || 0,
              shirtSKUs: item.shirtSKUs || [],
              shirtQuantity: item.shirtQuantity || null,
              fabricTitle: fabric?.title || 'Unknown',
              fabricColor: fabric?.color || 'Unknown',
              imageUrl: fabric?.imageUrl || null,
            };
          } catch (error) {
            return {
              _id: item._id,
              fabricSKU: item.fabricSKU,
              dhap: item.dhap,
              fold: item.fold,
              totalDhapFold: item.totalDhapFold,
              damagedQuantity: item.damagedQuantity || 0,
              returnedQuantity: item.returnedQuantity || 0,
              shirtSKUs: item.shirtSKUs || [],
              shirtQuantity: item.shirtQuantity || null,
              fabricTitle: 'Unknown',
              fabricColor: 'Unknown',
              imageUrl: null,
            };
          }
        }),
      );

      const memoData = {
        _id: memo._id,
        deliveryMemoId: memo._id,
        stage: memo.stage,
        assignedPreStitcherId: preStitcherId,
        createdAt: memo.createdAt,
        updatedAt: memo.updatedAt,
        createdBy: memo.createdBy,
        totalDhapFold: memo.totalDhapFold,
        items: enrichedItems,
        itemCount: enrichedItems.length,
        assignments: [
          {
            _id: assignment._id,
            options: assignment.assignedOptions || [],
            optionProgress: assignment.optionProgress || [],
            status: assignment.status,
            completedQuantity: assignment.completedQuantity || 0,
            partialCompletions: partialCompletions.map(pc => ({
              _id: pc._id,
              completedItems: pc.completedItems,
              totalShirtsHandedOver: pc.totalShirtsHandedOver,
              status: pc.status,
              createdAt: pc.createdAt,
              receivedAt: pc.receivedAt,
              notes: pc.notes,
            })),
          },
        ],
      };

      uniqueMemos.set(memo._id, memoData);
    }

    return Array.from(uniqueMemos.values());
  }

  public async updateAssignmentProgress(
    assignmentId: string,
    optionUpdates: { option: string; completedQuantity: number }[],
    performedBy: string,
    notes?: string,
  ): Promise<any> {
    return DBDataSource.transaction(async manager => {
      const assignmentRepo = manager.getRepository(PreStitcherAssignmentEntity);
      const memoRepo = manager.getRepository(DeliveryMemoEntity);

      const assignment = await assignmentRepo.findOne({
        where: { _id: assignmentId },
        relations: ['deliveryMemo'],
      });

      if (!assignment) {
        throw new HttpException(404, 'Assignment not found');
      }

      // 🔹 Ensure optionProgress exists
      if (!assignment.optionProgress || assignment.optionProgress.length === 0) {
        assignment.optionProgress = assignment.assignedOptions.map(opt => ({
          option: opt.option,
          totalQuantity: opt.quantity,
          completedQuantity: 0,
          inProgressQuantity: opt.quantity,
        }));
      }

      let allCompleted = true;

      for (const update of optionUpdates) {
        const progress = assignment.optionProgress.find(p => p.option === update.option);
        if (progress) {
          const newCompleted = progress.completedQuantity + update.completedQuantity;
          const completed = Math.min(newCompleted, progress.totalQuantity);

          progress.completedQuantity = completed;
          progress.inProgressQuantity = progress.totalQuantity - completed;

          if (progress.inProgressQuantity > 0) {
            allCompleted = false;
          }
        }
      }

      if (allCompleted) {
        assignment.status = PreStitcherAssignmentStatus.COMPLETED;
        assignment.completedAt = new Date();
      } else {
        assignment.status = PreStitcherAssignmentStatus.IN_PROGRESS;
      }

      if (notes) {
        assignment.notes = notes;
      }

      await assignmentRepo.save(assignment);

      //  Check if ALL assignments for memo are completed
      const allAssignments = await assignmentRepo.find({
        where: { deliveryMemoId: assignment.deliveryMemoId },
      });

      const allMemoAssignmentsCompleted = allAssignments.every(
        a => a.status === PreStitcherAssignmentStatus.COMPLETED || a.status === PreStitcherAssignmentStatus.UNASSIGNED,
      );

      if (allMemoAssignmentsCompleted) {
        const memo = await memoRepo.findOne({
          where: { _id: assignment.deliveryMemoId },
        });

        if (memo) {
          memo.stage = 'PRE_STITCHER_COMPLETED';
          memo.assignedPreStitcherId = null;

          await memoRepo.save(memo);

          await this.stageHistoryService.createStageHistory({
            deliveryMemoId: memo._id,
            stage: 'PRE_STITCHER_COMPLETED',
            performedBy,
            metadata: {
              reason: 'Pre-stitcher work completed',
              assignmentId: assignment._id,
            },
          });
        }
      } else {
        await this.stageHistoryService.createStageHistory({
          deliveryMemoId: assignment.deliveryMemoId,
          stage: 'PRE_STITCHER_IN_PROGRESS',
          performedBy,
          metadata: {
            assignmentId: assignment._id,
            notes,
          },
        });
      }

      return {
        assignment,
        optionProgress: assignment.optionProgress,
        allCompleted,
        allMemoAssignmentsCompleted,
      };
    });
  }

  public async getUnassignedMemos(): Promise<DeliveryMemoEntity[]> {
    return this.deliveryMemos.find({
      where: { assignedPreStitcherId: IsNull() },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
  }

  public async getPreStitcherPartialCompletionHistory(preStitcherId: string): Promise<any> {
    const completions = await this.partialCompletions.find({
      where: { preStitcherId },
      relations: ['deliveryMemo', 'assignment'],
      order: { createdAt: 'DESC' },
    });

    const memoGroups = new Map<string, any>();

    completions.forEach(completion => {
      const memoId = completion.deliveryMemoId;
      if (!memoGroups.has(memoId)) {
        memoGroups.set(memoId, {
          deliveryMemoId: memoId,
          completions: [],
          totalShirtsHandedOver: 0,
          totalShirtsReceived: 0,
        });
      }

      const group = memoGroups.get(memoId);
      group.completions.push({
        _id: completion._id,
        completedItems: completion.completedItems,
        totalShirtsHandedOver: completion.totalShirtsHandedOver,
        status: completion.status,
        createdAt: completion.createdAt,
        receivedAt: completion.receivedAt,
        notes: completion.notes,
      });
      group.totalShirtsHandedOver += completion.totalShirtsHandedOver;
      if (completion.status === 'RECEIVED_BY_NEXT_STAGE') {
        group.totalShirtsReceived += completion.totalShirtsHandedOver;
      }
    });

    return {
      totalCompletions: completions.length,
      totalShirtsHandedOver: completions.reduce((sum, c) => sum + c.totalShirtsHandedOver, 0),
      totalShirtsReceived: completions.filter(c => c.status === 'RECEIVED_BY_NEXT_STAGE').reduce((sum, c) => sum + c.totalShirtsHandedOver, 0),
      memoGroups: Array.from(memoGroups.values()),
      recentCompletions: completions.slice(0, 20).map(c => ({
        _id: c._id,
        deliveryMemoId: c.deliveryMemoId,
        completedItems: c.completedItems,
        totalShirtsHandedOver: c.totalShirtsHandedOver,
        status: c.status,
        createdAt: c.createdAt,
        receivedAt: c.receivedAt,
        notes: c.notes,
      })),
    };
  }

  public getAvailableOptions(): Array<{ key: string; label: string }> {
    return [
      { key: 'label', label: 'Label' },
      { key: 'flacket', label: 'Flacket' },
      { key: 'covering', label: 'Covering' },
      { key: 'pocket', label: 'Pocket' },
      { key: 'shoulder', label: 'Shoulder' },
      { key: 'chockPatti', label: 'Chock Patti' },
    ];
  }


  public async getAllMemosForPreStitcher(preStitcherId: string): Promise<any[]> {
    const assignments = await this.assignments.find({
      where: { preStitcherId },
      relations: ['deliveryMemo', 'deliveryMemo.items', 'deliveryMemo.stageHistory'],
      order: { createdAt: 'DESC' },
    });

    if (assignments.length === 0) return [];

    const uniqueMemos = new Map<string, any>();

    for (const assignment of assignments) {
      const memo = assignment.deliveryMemo;
      if (!memo) continue;

      // Determine if this memo is "done" from prestitcher's perspective
      const isDone =
        assignment.status === PreStitcherAssignmentStatus.COMPLETED ||
        assignment.status === PreStitcherAssignmentStatus.UNASSIGNED ||
        memo.stage === 'PRE_STITCHER_COMPLETED' ||
        memo.stage === 'ASSIGN_TAILOR' ||
        memo.stage === 'TAILOR_ASSIGNED' ||
        memo.stage === 'COMPLETED';

      if (uniqueMemos.has(memo._id)) {
        const existing = uniqueMemos.get(memo._id);
        existing.assignments.push({
          _id: assignment._id,
          status: assignment.status,
          assignedOptions: assignment.assignedOptions || [],
          optionProgress: assignment.optionProgress || [],
          completedQuantity: assignment.completedQuantity || 0,
          completedAt: assignment.completedAt,
          createdAt: assignment.createdAt,
        });
        continue;
      }

      const enrichedItems = await Promise.all(
        (memo.items || []).map(async item => {
          try {
            const fabric = await this.fabricEntity.findOne({
              where: { sku: item.fabricSKU, isDeleted: false },
            });
            return {
              _id: item._id,
              fabricSKU: item.fabricSKU,
              fabricTitle: fabric?.title || 'Unknown',
              fabricColor: fabric?.color || 'Unknown',
              shirtSKUs: item.shirtSKUs || [],
              shirtQuantity: item.shirtQuantity || null,
              dhap: item.dhap,
              fold: item.fold,
              totalDhapFold: item.totalDhapFold,
            };
          } catch {
            return {
              _id: item._id,
              fabricSKU: item.fabricSKU,
              fabricTitle: 'Unknown',
              fabricColor: 'Unknown',
              shirtSKUs: item.shirtSKUs || [],
              shirtQuantity: item.shirtQuantity || null,
              dhap: item.dhap,
              fold: item.fold,
              totalDhapFold: item.totalDhapFold,
            };
          }
        }),
      );

      uniqueMemos.set(memo._id, {
        _id: memo._id,
        deliveryMemoId: memo._id,
        stage: memo.stage,
        isDone,                          // <-- key field for frontend
        totalDhapFold: memo.totalDhapFold,
        createdAt: memo.createdAt,
        updatedAt: memo.updatedAt,
        items: enrichedItems,
        itemCount: enrichedItems.length,
        stageHistory: memo.stageHistory || [],

        assignments: [
          {
            _id: assignment._id,
            status: assignment.status,
            assignedOptions: assignment.assignedOptions || [],
            optionProgress: assignment.optionProgress || [],
            completedQuantity: assignment.completedQuantity || 0,
            completedAt: assignment.completedAt,
            createdAt: assignment.createdAt,
          },
        ],
      });
    }

    return Array.from(uniqueMemos.values());
  }

  /**
   * Splits a memo in ASSIGN_PRE_STITCHER stage, creates a child memo with
   * the assigned quantities, assigns pre-stitchers to the child, and keeps
   * the parent with remaining quantities — all in a single DB transaction.
   */
  public async partialAssignAndAssign(
    memoId: string,
    payloadItems: Array<{ itemId: string; partialShirtSKUs: Array<{ sku: string; quantity: number }> }>,
    assignmentsList: PreStitcherAssignmentDto[],
    performedBy: string,
  ): Promise<{
    childMemoId: string;
    parentMemoId: string;
    assignments: PreStitcherAssignmentEntity[];
  }> {
    return DBDataSource.transaction(async manager => {
      const memoRepo = manager.getRepository(DeliveryMemoEntity);
      const itemRepo = manager.getRepository(DeliveryMemoItemEntity);
      const assignmentRepo = manager.getRepository(PreStitcherAssignmentEntity);
      const userRepo = manager.getRepository(UserEntity);
      const stageHistoryRepo = manager.getRepository(DeliveryMemoStageHistoryEntity);

      // ── 1. Validate parent memo ─────────────────────────────────────────
      const parentMemo = await memoRepo.findOne({
        where: { _id: memoId },
        relations: ['items'],
      });

      if (!parentMemo) throw new HttpException(404, 'Delivery memo not found');
      if (parentMemo.stage !== 'ASSIGN_PRE_STITCHER') {
        throw new HttpException(400, `Memo is not in ASSIGN_PRE_STITCHER stage (current: ${parentMemo.stage})`);
      }

      // ── 2. Validate all pre-stitcher IDs ───────────────────────────────
      const preStitcherIds = assignmentsList.map(a => a.preStitcherId);
      const preStitchers = await userRepo.find({
        where: preStitcherIds.map(id => ({ _id: id, roleName: 'pre-stitcher' })),
      });
      if (preStitchers.length !== preStitcherIds.length) {
        throw new HttpException(404, 'One or more pre-stitchers not found');
      }

      // ── 3. Create child memo ────────────────────────────────────────────
      const childMemo = await memoRepo.save(
        memoRepo.create({
          createdBy: performedBy,
          stage: 'ASSIGN_PRE_STITCHER',
          totalDhapFold: 0,
        }),
      );

      let childTotalDhapFold = 0;
      let parentTotalDhapFold = Number(parentMemo.totalDhapFold || 0);

      // ── 4. Split items ─────────────────────────────────────────────────
      for (const payloadItem of payloadItems) {
        const parentItem = parentMemo.items.find(i => i._id === payloadItem.itemId);
        if (!parentItem) throw new HttpException(404, `Item ${payloadItem.itemId} not found in memo`);

        const partialSKUs = payloadItem.partialShirtSKUs;
        let partialQuantity = 0;
        if (partialSKUs && Array.isArray(partialSKUs)) {
          for (const sku of partialSKUs) partialQuantity += Number(sku.quantity) || 0;
        }

        if (partialQuantity <= 0) continue;

        const parentTotalShirts = parentItem.shirtQuantity || 0;
        if (partialQuantity > parentTotalShirts) {
          throw new HttpException(400, `Requested partial quantity ${partialQuantity} exceeds available ${parentTotalShirts}`);
        }

        const ratio = parentTotalShirts > 0 ? partialQuantity / parentTotalShirts : 0;
        const partialTotalDhapFold = Number((Number(parentItem.totalDhapFold || 0) * ratio).toFixed(2));
        const newParentTotalDhapFold = Number((Number(parentItem.totalDhapFold || 0) - partialTotalDhapFold).toFixed(2));
        const newParentQuantity = parentTotalShirts - partialQuantity;

        // Child item — with assigned SKUs
        await itemRepo.save(
          itemRepo.create({
            deliveryMemoId: childMemo._id,
            fabricSKU: parentItem.fabricSKU,
            dhap: parentItem.dhap,
            fold: parentItem.fold,
            totalDhapFold: partialTotalDhapFold,
            shirtSKUs: partialSKUs,
            shirtQuantity: partialQuantity,
          } as any),
        );

        // Deduct from parent item
        const originalSKUs = parentItem.shirtSKUs || [];
        const newParentSKUs = originalSKUs
          .map((o: { sku: string; quantity: number }) => {
            const p = partialSKUs.find((s: { sku: string; quantity: number }) => s.sku === o.sku);
            return p ? { sku: o.sku, quantity: Math.max(0, o.quantity - p.quantity) } : o;
          })
          .filter((o: { sku: string; quantity: number }) => o.quantity > 0);

        parentItem.shirtQuantity = newParentQuantity;
        parentItem.shirtSKUs = newParentSKUs;
        parentItem.totalDhapFold = newParentTotalDhapFold;
        await itemRepo.save(parentItem);

        childTotalDhapFold += partialTotalDhapFold;
        parentTotalDhapFold -= partialTotalDhapFold;
      }

      // ── 5. Update totals ───────────────────────────────────────────────
      parentMemo.totalDhapFold = Number(parentTotalDhapFold.toFixed(2));
      childMemo.totalDhapFold = Number(childTotalDhapFold.toFixed(2));
      await memoRepo.save(parentMemo);
      await memoRepo.save(childMemo);

      // ── 6. Log split on parent ─────────────────────────────────────────
      const refreshedParentItems = await itemRepo.find({ where: { deliveryMemoId: parentMemo._id } });
      const parentStillHasContent = refreshedParentItems.some(i => (i.shirtQuantity ?? 0) > 0);

      await stageHistoryRepo.save(
        stageHistoryRepo.create({
          deliveryMemoId: parentMemo._id,
          stage: 'ASSIGN_PRE_STITCHER',
          performedBy,
          metadata: {
            action: 'PARTIAL_ASSIGNMENT_SPLIT',
            childMemoId: childMemo._id,
            remainingShirts: refreshedParentItems.reduce((sum, i) => sum + (i.shirtQuantity ?? 0), 0),
          },
        }),
      );

      if (!parentStillHasContent) {
        // Edge-case: all shirts moved — parent has no remaining content
        // Keep it at ASSIGN_PRE_STITCHER but note this in history (it will be a zero-shirt memo)
        await stageHistoryRepo.save(
          stageHistoryRepo.create({
            deliveryMemoId: parentMemo._id,
            stage: 'ASSIGN_PRE_STITCHER',
            performedBy,
            metadata: {
              action: 'ALL_SHIRTS_MOVED_TO_CHILD',
              childMemoId: childMemo._id,
              note: 'All shirts moved to child memo',
            },
          }),
        );
      }

      // ── 7. Log creation on child and then assign pre-stitchers ─────────
      await stageHistoryRepo.save(
        stageHistoryRepo.create({
          deliveryMemoId: childMemo._id,
          stage: 'ASSIGN_PRE_STITCHER',
          performedBy,
          metadata: {
            action: 'PARTIAL_ASSIGNMENT_CREATED',
            parentMemoId: parentMemo._id,
          },
        }),
      );

      // ── 8. Validate total quantities against child memo shirts ──────────
      const childItems = await itemRepo.find({ where: { deliveryMemoId: childMemo._id } });
      const childTotalShirts = childItems.reduce((sum, item) => sum + (item.shirtQuantity || 0), 0);

      if (childTotalShirts === 0) {
        throw new HttpException(400, 'No shirts available in child memo after split');
      }

      const optionTotals = new Map<string, number>();
      assignmentsList.forEach(assignment => {
        assignment.options.forEach(opt => {
          const currentTotal = optionTotals.get(opt.option) || 0;
          optionTotals.set(opt.option, currentTotal + opt.quantity);
        });
      });

      for (const [option, total] of optionTotals.entries()) {
        if (total > childTotalShirts) {
          throw new HttpException(400, `Total quantity for "${option}" (${total}) exceeds available shirts in child memo (${childTotalShirts})`);
        }
      }

      // ── 9. Create assignments on child memo ─────────────────────────────
      const createdAssignments: PreStitcherAssignmentEntity[] = [];

      for (const assignmentData of assignmentsList) {
        const optionProgress = assignmentData.options.map(opt => ({
          option: opt.option,
          totalQuantity: opt.quantity,
          completedQuantity: 0,
          inProgressQuantity: opt.quantity,
        }));

        const assignment = assignmentRepo.create({
          preStitcherId: assignmentData.preStitcherId,
          deliveryMemoId: childMemo._id,
          assignedOptions: assignmentData.options,
          optionProgress,
          status: PreStitcherAssignmentStatus.ASSIGNED,
        });

        const saved = await assignmentRepo.save(assignment);
        createdAssignments.push(saved);
      }

      // ── 10. Advance child memo to PRE_STITCHER_ASSIGNED ─────────────────
      childMemo.stage = 'PRE_STITCHER_ASSIGNED';
      childMemo.assignedPreStitcherId = createdAssignments[0].preStitcherId;
      await memoRepo.save(childMemo);

      await stageHistoryRepo.save(
        stageHistoryRepo.create({
          deliveryMemoId: childMemo._id,
          stage: 'PRE_STITCHER_ASSIGNED',
          performedBy,
          metadata: {
            assignmentType: 'PARTIAL_SPLIT_ASSIGNMENT',
            parentMemoId: parentMemo._id,
            totalShirtQuantity: childTotalShirts,
            assignments: createdAssignments.map(a => ({
              assignmentId: a._id,
              preStitcherId: a.preStitcherId,
              options: a.assignedOptions,
              optionProgress: a.optionProgress,
            })),
          },
        }),
      );

      return {
        childMemoId: childMemo._id,
        parentMemoId: parentMemo._id,
        assignments: createdAssignments,
      };
    });
  }
}

export default PreStitcherService;
