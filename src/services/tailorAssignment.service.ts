import { TailorAssignmentStatus as TailorMemoStatus, TailorReturnStatus } from '@/constants/tailorStatus.enum';
import { DeliveryMemoStageHistoryEntity } from '@/entities/deliveryMemoStageHistory.entity';
import { DBDataSource } from '@/databases';
import { AssignMultipleTailorsDto } from '@/dtos/tailorAssignment.dto';
import { DeliveryMemoEntity } from '@/entities/deliverymemo.entity';
import { DeliveryMemoItemEntity } from '@/entities/deliveryMemoItem.entity';
import { PreStitcherAssignmentEntity } from '@/entities/preStitcher.entity';
import { TailorAssignmentEntity, TailorAssignmentStatus } from '@/entities/tailorAssignment.entity';
import { TailorDetailsEntity } from '@/entities/TailorDetails.entity';
import { HttpException } from '@/exceptions/HttpException';
import { In } from 'typeorm';
import DeliveryMemoStageHistoryService from './deliveryMemoStageHistory.service';

class TailorAssignmentService {
  public deliveryMemos = DBDataSource.getRepository(DeliveryMemoEntity);
  public deliveryMemoItems = DBDataSource.getRepository(DeliveryMemoItemEntity);
  public tailors = DBDataSource.getRepository(TailorDetailsEntity);
  public assignments = DBDataSource.getRepository(TailorAssignmentEntity);
  public preStitcherAssignments = DBDataSource.getRepository(PreStitcherAssignmentEntity);
  public stageHistoryService = new DeliveryMemoStageHistoryService();

  public async assignMultipleTailors(
    dto: AssignMultipleTailorsDto,
    performedBy: string,
  ): Promise<{
    memo: DeliveryMemoEntity;
    assignments: TailorAssignmentEntity[];
  }> {
    const { deliveryMemoId, assignments: assignmentsList } = dto;

    return DBDataSource.transaction(async manager => {
      const memoRepo = manager.getRepository(DeliveryMemoEntity);
      const assignmentRepo = manager.getRepository(TailorAssignmentEntity);
      const tailorRepo = manager.getRepository(TailorDetailsEntity);
      const itemRepo = manager.getRepository(DeliveryMemoItemEntity);

      const memo = await memoRepo.findOne({
        where: { _id: deliveryMemoId },
        relations: ['items'],
      });

      if (!memo) {
        throw new HttpException(404, 'Delivery memo not found');
      }

      if (memo.stage !== 'ASSIGN_TAILOR') {
        throw new HttpException(400, `Memo must be in ASSIGN_TAILOR stage. Current stage: ${memo.stage}`);
      }

      const items = await itemRepo.find({
        where: { deliveryMemoId },
      });

      const totalShirtQuantity = items.reduce((sum, item) => sum + (item.shirtQuantity || 0), 0);

      if (totalShirtQuantity === 0) {
        throw new HttpException(400, 'No shirts available in this delivery memo');
      }

      // Check remaining quantities including spilled over pre-stitcher operations
      const remainingWork = await this.getRemainingWorkForMemo(deliveryMemoId);

      const optionTotals = new Map<string, number>();
      assignmentsList.forEach(assignment => {
        assignment.options.forEach(opt => {
          const currentTotal = optionTotals.get(opt.option) || 0;
          optionTotals.set(opt.option, currentTotal + opt.quantity);
        });
      });

      for (const [option, total] of optionTotals.entries()) {
        const available = remainingWork.get(option) || 0;
        if (total > available) {
          throw new HttpException(400, `Total quantity for "${option}" (${total}) exceeds available work (${available})`);
        }
      }


      const tailorIds = assignmentsList.map(a => a.tailorId);
      const uniqueTailorIds = [...new Set(tailorIds)];

      const tailors = await tailorRepo.find({
        where: uniqueTailorIds.map(id => ({ _id: id })),
      });

      if (tailors.length !== uniqueTailorIds.length) {
        throw new HttpException(404, 'One or more tailors not found');
      }


      await assignmentRepo.update(
        {
          deliveryMemoId,
          status: In([TailorAssignmentStatus.ASSIGNED, TailorAssignmentStatus.IN_PROGRESS]),
        },
        { status: TailorAssignmentStatus.UNASSIGNED },
      );


      const createdAssignments: TailorAssignmentEntity[] = [];

      for (const assignmentData of assignmentsList) {

        const optionProgress = assignmentData.options.map(opt => ({
          option: opt.option,
          totalQuantity: opt.quantity,
          completedQuantity: 0,
          inProgressQuantity: opt.quantity,
        }));

        const assignment = assignmentRepo.create({
          tailorId: assignmentData.tailorId,
          deliveryMemoId,
          assignedOptions: assignmentData.options,
          optionProgress: optionProgress,
          status: TailorAssignmentStatus.ASSIGNED,
          completedQuantity: 0,
        });

        const saved = await assignmentRepo.save(assignment);
        createdAssignments.push(saved);
      }


      memo.tailorAssignmentStatus = TailorAssignmentStatus.ASSIGNED;
      await memoRepo.save(memo);


      await this.stageHistoryService.createStageHistory({
        deliveryMemoId,
        stage: 'TAILOR_ASSIGNED_MULTIPLE',
        performedBy: performedBy || 'SYSTEM',
        metadata: {
          assignmentType: 'MULTIPLE_WITH_QUANTITIES',
          totalShirtQuantity,
          totalTailors: createdAssignments.length,
          assignments: createdAssignments.map(a => ({
            assignmentId: a._id,
            tailorId: a.tailorId,
            options: a.assignedOptions,
            optionProgress: a.optionProgress,
          })),
        },
      });

      return { memo, assignments: createdAssignments };
    });
  }

  public async updateAssignmentProgress(
    assignmentId: string,
    optionUpdates: { option: string; completedQuantity: number }[],
    performedBy: string,
    notes?: string,
  ): Promise<any> {
    return DBDataSource.transaction(async manager => {
      const assignmentRepo = manager.getRepository(TailorAssignmentEntity);
      const memoRepo = manager.getRepository(DeliveryMemoEntity);

      const assignment = await assignmentRepo.findOne({
        where: { _id: assignmentId },
        relations: ['deliveryMemo'],
      });

      if (!assignment) {
        throw new HttpException(404, 'Assignment not found');
      }

      if (!assignment.optionProgress || assignment.optionProgress.length === 0) {
        assignment.optionProgress = assignment.assignedOptions.map(opt => ({
          option: opt.option,
          totalQuantity: opt.quantity,
          completedQuantity: 0,
          inProgressQuantity: opt.quantity,
        }));
      }

      for (const update of optionUpdates) {
        const progress = assignment.optionProgress.find(p => p.option === update.option);
        if (progress) {
          const newCompleted = progress.completedQuantity + update.completedQuantity;
          const completed = Math.min(newCompleted, progress.totalQuantity);

          progress.completedQuantity = completed;
          progress.inProgressQuantity = progress.totalQuantity - completed;
        }
      }

      // Fix: Check ALL operations, not just the ones in this update payload
      const allCompleted = assignment.optionProgress.every(p => p.inProgressQuantity === 0);

      if (allCompleted) {
        assignment.status = TailorAssignmentStatus.COMPLETED;
        assignment.completedAt = new Date();
      } else {
        assignment.status = TailorAssignmentStatus.IN_PROGRESS;
      }

      // Update overall completed quantity for reported progress
      assignment.completedQuantity = assignment.optionProgress.reduce((sum, p) => sum + p.completedQuantity, 0);

      if (notes) {
        assignment.notes = notes;
      }


      if (!assignment.progressEntries) {
        assignment.progressEntries = [];
      }

      assignment.progressEntries.push({
        completedQuantity: optionUpdates.reduce((sum, u) => sum + u.completedQuantity, 0),
        optionUpdates,
        performedBy,
        notes: notes || '',
        timestamp: new Date().toISOString(),
      });

      await assignmentRepo.save(assignment);

      const allAssignments = await assignmentRepo.find({
        where: { deliveryMemoId: assignment.deliveryMemoId },
      });

      const allMemoAssignmentsCompleted = allAssignments.every(
        a => a.status === TailorAssignmentStatus.COMPLETED || a.status === TailorAssignmentStatus.UNASSIGNED,
      );

      if (allMemoAssignmentsCompleted) {
        const memo = await memoRepo.findOne({
          where: { _id: assignment.deliveryMemoId },
        });

        if (memo) {
          memo.tailorAssignmentStatus = TailorMemoStatus.COMPLETED;

          await memoRepo.save(memo);

          await this.stageHistoryService.createStageHistory({
            deliveryMemoId: memo._id,
            stage: 'TAILOR_WORK_COMPLETED',
            performedBy,
            metadata: {
              reason: 'All tailor assignments completed',
              assignmentId: assignment._id,
            },
          });
        }
      } else {
        await this.stageHistoryService.createStageHistory({
          deliveryMemoId: assignment.deliveryMemoId,
          stage: 'TAILOR_IN_PROGRESS',
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

  public async getAssignmentsByMemoId(deliveryMemoId: string): Promise<any[]> {
    const assignments = await this.assignments.find({
      where: { deliveryMemoId },
      relations: ['tailor'],
      order: { createdAt: 'DESC' },
    });

    return assignments.map(assignment => ({
      _id: assignment._id,
      tailorId: assignment.tailorId,
      tailorName: assignment.tailor ? `${assignment.tailor.name}` : 'Unknown',
      tailorPhoneNumber: assignment.tailor?.phoneNumber || null,
      assignedOptions: assignment.assignedOptions || [],
      optionProgress: assignment.optionProgress || [],
      status: assignment.status,
      completedQuantity: assignment.completedQuantity || 0,
      completedAt: assignment.completedAt,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
      notes: assignment.notes,
      progressEntries: assignment.progressEntries || [],
    }));
  }

  public async getAssignmentsByTailorId(tailorId: string): Promise<any[]> {
    const assignments = await this.assignments.find({
      where: { tailorId },
      relations: ['deliveryMemo', 'deliveryMemo.items'],
      order: { createdAt: 'DESC' },
    });

    return assignments;
  }


  public async getAssignmentSummary(deliveryMemoId: string): Promise<any> {
    const assignments = await this.assignments.find({
      where: { deliveryMemoId },
      relations: ['tailor'],
    });

    const items = await this.deliveryMemoItems.find({
      where: { deliveryMemoId },
    });

    const totalShirtQuantity = items.reduce((sum, item) => sum + (item.shirtQuantity || 0), 0);

    const optionSummary = new Map<string, { assigned: number; completed: number }>();

    assignments
      .filter(a => a.status !== TailorAssignmentStatus.UNASSIGNED)
      .forEach(assignment => {
        assignment.assignedOptions.forEach(opt => {
          const current = optionSummary.get(opt.option) || { assigned: 0, completed: 0 };
          current.assigned += opt.quantity;

          const progress = assignment.optionProgress?.find(p => p.option === opt.option);
          if (progress) {
            current.completed += progress.completedQuantity;
          }

          optionSummary.set(opt.option, current);
        });
      });

    return {
      totalShirtQuantity,
      assignments: assignments.map(a => ({
        _id: a._id,
        tailor: {
          id: a.tailor._id,
          name: a.tailor.name,
          phoneNumber: a.tailor.phoneNumber,
        },
        options: a.assignedOptions,
        optionProgress: a.optionProgress,
        status: a.status,
        completedQuantity: a.completedQuantity,
        progressEntries: a.progressEntries || [],
        createdAt: a.createdAt,
      })),
      optionSummary: Array.from(optionSummary.entries()).map(([option, data]) => ({
        option,
        ...data,
        remaining: data.assigned - data.completed,
      })),
    };
  }

  public async getAvailableOptionsWithRemaining(deliveryMemoId: string): Promise<Array<{ key: string; label: string; remaining: number; total: number }>> {
    const remainingWork = await this.getRemainingWorkForMemo(deliveryMemoId);
    const items = await this.deliveryMemoItems.find({ where: { deliveryMemoId } });
    const totalShirts = items.reduce((sum, item) => sum + (item.shirtQuantity || 0), 0);

    const labels: Record<string, string> = {
      cuff: 'Cuff',
      ghera: 'Ghera',
      collar: 'Collar',
      label: 'Label',
      flacket: 'Flacket',
      covering: 'Covering',
      pocket: 'Pocket',
      shoulder: 'Shoulder',
      chockPatti: 'Chock Patti',
    };

    const options = Array.from(remainingWork.entries())
      .map(([key, remaining]) => ({
        key,
        label: labels[key] || key.charAt(0).toUpperCase() + key.slice(1),
        remaining,
        total: totalShirts,
      }))
      .filter(opt => opt.remaining > 0);

    return options;
  }

  private async getRemainingWorkForMemo(deliveryMemoId: string): Promise<Map<string, number>> {
    const items = await this.deliveryMemoItems.find({ where: { deliveryMemoId } });
    const totalShirts = items.reduce((sum, item) => sum + (item.shirtQuantity || 0), 0);

    const remainingWork = new Map<string, number>();

    // Initial tailor-only options
    remainingWork.set('cuff', totalShirts);
    remainingWork.set('ghera', totalShirts);
    remainingWork.set('collar', totalShirts);

    // Add pre-stitcher options that could spill over
    const preStitcherOptions = ['label', 'flacket', 'covering', 'pocket', 'shoulder', 'chockPatti'];
    preStitcherOptions.forEach(opt => remainingWork.set(opt, totalShirts));

    // Subtract completed pre-stitcher work
    const psAssignments = await this.preStitcherAssignments.find({
      where: { deliveryMemoId },
    });

    for (const assignment of psAssignments) {
      if (assignment.optionProgress) {
        assignment.optionProgress.forEach(progress => {
          const current = remainingWork.get(progress.option) || 0;
          remainingWork.set(progress.option, current - progress.completedQuantity);
        });
      }
    }

    // Subtract already assigned tailor work
    const tailorAssignments = await this.assignments.find({
      where: { deliveryMemoId, status: In([TailorAssignmentStatus.ASSIGNED, TailorAssignmentStatus.IN_PROGRESS]) },
    });

    for (const assignment of tailorAssignments) {
      if (assignment.assignedOptions) {
        assignment.assignedOptions.forEach(opt => {
          const current = remainingWork.get(opt.option) || 0;
          remainingWork.set(opt.option, Math.max(0, current - opt.quantity));
        });
      }
    }

    return remainingWork;
  }
 
  public getAvailableOptions(): Array<{ key: string; label: string }> {
    return [
      { key: 'cuff', label: 'Cuff' },
      { key: 'ghera', label: 'Ghera' },
      { key: 'collar', label: 'Collar' },
    ];
  }

  /**
   * Splits a memo in ASSIGN_TAILOR stage, creates a child memo with
   * the assigned quantities, assigns tailors to the child, and keeps
   * the parent with remaining quantities — all in a single DB transaction.
   */
  public async partialAssignAndAssign(
    memoId: string,
    payloadItems: Array<{ itemId: string; partialShirtSKUs: Array<{ sku: string; quantity: number }> }>,
    assignmentsList: any[],
    performedBy: string,
  ): Promise<{
    childMemoId: string;
    parentMemoId: string;
    assignments: TailorAssignmentEntity[];
  }> {
    return DBDataSource.transaction(async manager => {
      const memoRepo = manager.getRepository(DeliveryMemoEntity);
      const itemRepo = manager.getRepository(DeliveryMemoItemEntity);
      const assignmentRepo = manager.getRepository(TailorAssignmentEntity);
      const stageHistoryRepo = manager.getRepository(DeliveryMemoStageHistoryEntity);

      // 1. Validate parent memo
      const parentMemo = await memoRepo.findOne({
        where: { _id: memoId },
        relations: ['items'],
      });

      if (!parentMemo) throw new HttpException(404, 'Delivery memo not found');
      if (parentMemo.stage !== 'ASSIGN_TAILOR') {
        throw new HttpException(400, `Memo is not in ASSIGN_TAILOR stage (current: ${parentMemo.stage})`);
      }

      // 2. Create child memo
      const childMemo = await memoRepo.save(
        memoRepo.create({
          createdBy: performedBy,
          stage: 'ASSIGN_TAILOR',
          totalDhapFold: 0,
          tailorAssignmentStatus: TailorMemoStatus.NOT_ASSIGNED,
          tailorReturnStatus: TailorReturnStatus.NOT_COMPLETED,
        }),
      );

      let childTotalDhapFold = 0;
      let parentTotalDhapFold = Number(parentMemo.totalDhapFold || 0);

      // 3. Split items
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

        // Child item
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

      // 4. Update totals
      parentMemo.totalDhapFold = Number(parentTotalDhapFold.toFixed(2));
      childMemo.totalDhapFold = Number(childTotalDhapFold.toFixed(2));
      await memoRepo.save(parentMemo);
      await memoRepo.save(childMemo);

      // 5. Log split on parent
      const refreshedParentItems = await itemRepo.find({ where: { deliveryMemoId: parentMemo._id } });
      
      await stageHistoryRepo.save(
        stageHistoryRepo.create({
          deliveryMemoId: parentMemo._id,
          stage: 'ASSIGN_TAILOR',
          performedBy,
          metadata: {
            action: 'PARTIAL_ASSIGNMENT_SPLIT',
            childMemoId: childMemo._id,
            remainingShirts: refreshedParentItems.reduce((sum, i) => sum + (i.shirtQuantity ?? 0), 0),
          },
        }),
      );

      // 6. Log creation on child and then assign tailors
      await stageHistoryRepo.save(
        stageHistoryRepo.create({
          deliveryMemoId: childMemo._id,
          stage: 'ASSIGN_TAILOR',
          performedBy,
          metadata: {
            action: 'PARTIAL_ASSIGNMENT_CREATED',
            parentMemoId: parentMemo._id,
          },
        }),
      );

      // 7. Validate total quantities against child memo shirts
      const childItems = await itemRepo.find({ where: { deliveryMemoId: childMemo._id } });
      const childTotalShirts = childItems.reduce((sum, item) => sum + (item.shirtQuantity || 0), 0);

      if (childTotalShirts === 0) {
        throw new HttpException(400, 'No shirts available in child memo after split');
      }

      // 8. Create assignments on child memo
      const createdAssignments: TailorAssignmentEntity[] = [];

      for (const assignmentData of assignmentsList) {
        const optionProgress = assignmentData.options.map((opt: { option: string; quantity: number }) => ({
          option: opt.option,
          totalQuantity: opt.quantity,
          completedQuantity: 0,
          inProgressQuantity: opt.quantity,
        }));

        const assignment = assignmentRepo.create({
          tailorId: assignmentData.tailorId,
          deliveryMemoId: childMemo._id,
          assignedOptions: assignmentData.options,
          optionProgress,
          status: TailorAssignmentStatus.ASSIGNED,
          completedQuantity: 0,
        });

        const saved = await assignmentRepo.save(assignment);
        createdAssignments.push(saved);
      }

      // 9. Advance child memo to ASSIGNED
      childMemo.tailorAssignmentStatus = TailorMemoStatus.ASSIGNED;
      await memoRepo.save(childMemo);

      await stageHistoryRepo.save(
        stageHistoryRepo.create({
          deliveryMemoId: childMemo._id,
          stage: 'TAILOR_ASSIGNED_MULTIPLE',
          performedBy,
          metadata: {
            assignmentType: 'PARTIAL_SPLIT_ASSIGNMENT',
            parentMemoId: parentMemo._id,
            totalShirtQuantity: childTotalShirts,
            totalTailors: createdAssignments.length,
            assignments: createdAssignments.map(a => ({
              assignmentId: a._id,
              tailorId: a.tailorId,
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

export default TailorAssignmentService;
