import { DBDataSource } from '@/databases';
import { DeliveryMemoEntity } from '@/entities/deliverymemo.entity';
import { PreStitcherAssignmentEntity, PreStitcherAssignmentStatus } from '@/entities/preStitcher.entity';
import { PreStitcherPartialCompletionEntity, PartialCompletionStatus } from '@/entities/preStitcherPartialCompletion.entity';
import { HttpException } from '@/exceptions/HttpException';
import { UserEntity } from '@/entities/users.entity';
import DeliveryMemoStageHistoryService from './deliveryMemoStageHistory.service';

interface CreatePartialCompletionDto {
  assignmentId: string;
  completedItems: Array<{
    option: string;
    completedQuantity: number;
  }>;
  recordedBy: string;
  notes?: string;
}

class PreStitcherPartialCompletionService {
  public assignments = DBDataSource.getRepository(PreStitcherAssignmentEntity);
  public memos = DBDataSource.getRepository(DeliveryMemoEntity);
  public partialCompletions = DBDataSource.getRepository(PreStitcherPartialCompletionEntity);
  public users = DBDataSource.getRepository(UserEntity);
  public stageHistoryService = new DeliveryMemoStageHistoryService();

  public async createPartialCompletion(dto: CreatePartialCompletionDto): Promise<any> {
    return DBDataSource.transaction(async manager => {
      const assignmentRepo = manager.getRepository(PreStitcherAssignmentEntity);
      const memoRepo = manager.getRepository(DeliveryMemoEntity);
      const partialCompletionRepo = manager.getRepository(PreStitcherPartialCompletionEntity);

      // 1. Get assignment with memo
      const assignment = await assignmentRepo.findOne({
        where: { _id: dto.assignmentId },
        relations: ['deliveryMemo', 'preStitcher'],
      });

      if (!assignment) {
        throw new HttpException(404, 'Assignment not found');
      }

      const memo = await memoRepo.findOne({
        where: { _id: assignment.deliveryMemoId },
      });

      if (!memo) {
        throw new HttpException(404, 'Memo not found');
      }

      // 2. Initialize optionProgress if needed
      if (!assignment.optionProgress || assignment.optionProgress.length === 0) {
        assignment.optionProgress = assignment.assignedOptions.map(opt => ({
          option: opt.option,
          totalQuantity: opt.quantity,
          completedQuantity: 0,
          inProgressQuantity: opt.quantity,
        }));
      }

      // Store previous progress for metadata
      const previousProgress = JSON.parse(JSON.stringify(assignment.optionProgress));

      // 3. Validate and update progress
      let totalShirtsHandedOver = 0;

      for (const item of dto.completedItems) {
        const progressIndex = assignment.optionProgress.findIndex(p => p.option === item.option);

        if (progressIndex === -1) {
          throw new HttpException(400, `Option "${item.option}" not assigned to this worker`);
        }

        const progress = assignment.optionProgress[progressIndex];
        const newCompleted = progress.completedQuantity + item.completedQuantity;

        if (newCompleted > progress.totalQuantity) {
          throw new HttpException(
            400,
            `Cannot hand over ${item.completedQuantity} for "${item.option}". Only ${progress.inProgressQuantity} remaining.`,
          );
        }

        // Update progress
        progress.completedQuantity = newCompleted;
        progress.inProgressQuantity = progress.totalQuantity - newCompleted;

        totalShirtsHandedOver += item.completedQuantity;
      }

      // 4. Create partial completion record
      const partialCompletion = partialCompletionRepo.create({
        assignmentId: assignment._id,
        deliveryMemoId: assignment.deliveryMemoId,
        preStitcherId: assignment.preStitcherId,
        completedItems: dto.completedItems,
        totalShirtsHandedOver,
        status: PartialCompletionStatus.HANDED_OVER,
        notes: dto.notes,
      });

      await partialCompletionRepo.save(partialCompletion);

      // 5. Update assignment status
      const hasRemainingWork = assignment.optionProgress.some(p => p.inProgressQuantity > 0);
      const previousStatus = assignment.status;

      if (hasRemainingWork) {
        assignment.status = PreStitcherAssignmentStatus.IN_PROGRESS;
      } else {
        assignment.status = PreStitcherAssignmentStatus.COMPLETED;
        assignment.completedAt = new Date();
      }

      await assignmentRepo.save(assignment);

      // 6. Check if ALL assignments for this memo are complete
      const allAssignments = await assignmentRepo.find({
        where: { deliveryMemoId: memo._id },
      });

      const allMemoAssignmentsCompleted = allAssignments.every(
        a => a.status === PreStitcherAssignmentStatus.COMPLETED || a.status === PreStitcherAssignmentStatus.UNASSIGNED,
      );

      const previousMemoStage = memo.stage;

      // 7. Update memo stage based on ALL assignments
      if (allMemoAssignmentsCompleted) {
        memo.stage = 'PRE_STITCHER_COMPLETED';
        memo.assignedPreStitcherId = null;
      } else {
        memo.stage = 'PRE_STITCHER_ASSIGNED';
      }

      await memoRepo.save(memo);

      // 8. ALWAYS Create stage history for partial handover
      if (allMemoAssignmentsCompleted) {
        // Final completion - create PRE_STITCHER_COMPLETED stage
        await this.stageHistoryService.createStageHistory({
          deliveryMemoId: memo._id,
          stage: 'PRE_STITCHER_COMPLETED',
          performedBy: dto.recordedBy,
          metadata: {
            action: 'FINAL_COMPLETION',
            partialCompletionId: partialCompletion._id,
            assignmentId: assignment._id,
            preStitcherId: assignment.preStitcherId,
            preStitcherName: assignment.preStitcher ? `${assignment.preStitcher.firstName} ${assignment.preStitcher.lastName}` : 'Unknown',
            completedItems: dto.completedItems,
            totalShirtsHandedOver,
            optionProgress: assignment.optionProgress,
            previousProgress: previousProgress,
            assignmentStatus: assignment.status,
            previousAssignmentStatus: previousStatus,
            allMemoAssignmentsCompleted: true,
            totalAssignments: allAssignments.length,
            completedAssignments: allAssignments.filter(a => a.status === PreStitcherAssignmentStatus.COMPLETED).length,
            notes: dto.notes,
            handoverType: 'FINAL',
            previousMemoStage: previousMemoStage,
          },
        });
      } else {
        // Partial handover - create PARTIAL_HANDOVER stage
        await this.stageHistoryService.createStageHistory({
          deliveryMemoId: memo._id,
          stage: 'PRE_STITCHER_PARTIAL_HANDOVER',
          performedBy: dto.recordedBy,
          metadata: {
            action: 'PARTIAL_HANDOVER',
            partialCompletionId: partialCompletion._id,
            assignmentId: assignment._id,
            preStitcherId: assignment.preStitcherId,
            preStitcherName: assignment.preStitcher ? `${assignment.preStitcher.firstName} ${assignment.preStitcher.lastName}` : 'Unknown',
            completedItems: dto.completedItems,
            totalShirtsHandedOver,
            optionProgress: assignment.optionProgress,
            previousProgress: previousProgress,
            assignmentStatus: assignment.status,
            previousAssignmentStatus: previousStatus,
            hasRemainingWork: hasRemainingWork,
            allMemoAssignmentsCompleted: false,
            totalAssignments: allAssignments.length,
            completedAssignments: allAssignments.filter(a => a.status === PreStitcherAssignmentStatus.COMPLETED).length,
            inProgressAssignments: allAssignments.filter(a => a.status === PreStitcherAssignmentStatus.IN_PROGRESS).length,
            notes: dto.notes,
            handoverType: 'PARTIAL',
            handoverNumber: (await this.getHandoverCount(assignment._id)) + 1,
          },
        });
      }

      return {
        partialCompletion,
        assignment: {
          _id: assignment._id,
          status: assignment.status,
          previousStatus: previousStatus,
          optionProgress: assignment.optionProgress,
        },
        memo: {
          _id: memo._id,
          stage: memo.stage,
          previousStage: previousMemoStage,
          allAssignmentsCompleted: allMemoAssignmentsCompleted,
        },
        allCompleted: allMemoAssignmentsCompleted,
      };
    });
  }



  private async getHandoverCount(assignmentId: string): Promise<number> {
    return this.partialCompletions.count({
      where: { assignmentId },
    });
  }

  public async receivePartialCompletion(completionId: string, receivedBy: string, notes?: string): Promise<any> {
    return DBDataSource.transaction(async manager => {
      const partialCompletionRepo = manager.getRepository(PreStitcherPartialCompletionEntity);

      const completion = await partialCompletionRepo.findOne({
        where: { _id: completionId },
        relations: ['assignment', 'deliveryMemo'],
      });

      if (!completion) {
        throw new HttpException(404, 'Partial completion not found');
      }

      if (completion.status === PartialCompletionStatus.RECEIVED_BY_NEXT_STAGE) {
        throw new HttpException(400, 'Completion already received');
      }

      completion.status = PartialCompletionStatus.RECEIVED_BY_NEXT_STAGE;
      completion.receivedAt = new Date();
      completion.receivedBy = receivedBy;
      if (notes) {
        completion.notes = completion.notes ? `${completion.notes}\n${notes}` : notes;
      }

      await partialCompletionRepo.save(completion);

      await this.stageHistoryService.createStageHistory({
        deliveryMemoId: completion.deliveryMemoId,
        stage: 'PRE_STITCHER_HANDOVER_RECEIVED',
        performedBy: receivedBy,
        metadata: {
          partialCompletionId: completion._id,
          assignmentId: completion.assignmentId,
          totalShirtsReceived: completion.totalShirtsHandedOver,
          notes,
        },
      });

      return completion;
    });
  }

  public async getPartialCompletionsByAssignment(assignmentId: string): Promise<PreStitcherPartialCompletionEntity[]> {
    return this.partialCompletions.find({
      where: { assignmentId },
      order: { createdAt: 'DESC' },
    });
  }

  public async getPartialCompletionsByMemo(deliveryMemoId: string): Promise<PreStitcherPartialCompletionEntity[]> {
    return this.partialCompletions.find({
      where: { deliveryMemoId },
      relations: ['assignment', 'preStitcher'],
      order: { createdAt: 'DESC' },
    });
  }

  public async getMemoPartialCompletionSummary(deliveryMemoId: string): Promise<any> {
    const completions = await this.partialCompletions.find({
      where: { deliveryMemoId },
      relations: ['assignment', 'preStitcher'],
    });

    const memo = await this.memos.findOne({
      where: { _id: deliveryMemoId },
    });

    if (!memo) {
      throw new HttpException(404, 'Memo not found');
    }

    const totalHandedOver = completions.reduce((sum, c) => sum + c.totalShirtsHandedOver, 0);

    const receivedCompletions = completions.filter(c => c.status === PartialCompletionStatus.RECEIVED_BY_NEXT_STAGE);
    const totalReceived = receivedCompletions.reduce((sum, c) => sum + c.totalShirtsHandedOver, 0);

    const pendingCompletions = completions.filter(c => c.status === PartialCompletionStatus.HANDED_OVER);
    const totalPending = pendingCompletions.reduce((sum, c) => sum + c.totalShirtsHandedOver, 0);

    const optionSummary = new Map<string, { handedOver: number; received: number }>();

    completions.forEach(completion => {
      completion.completedItems.forEach(item => {
        const current = optionSummary.get(item.option) || { handedOver: 0, received: 0 };
        current.handedOver += item.completedQuantity;
        if (completion.status === PartialCompletionStatus.RECEIVED_BY_NEXT_STAGE) {
          current.received += item.completedQuantity;
        }
        optionSummary.set(item.option, current);
      });
    });

    return {
      deliveryMemoId,
      totalHandedOver,
      totalReceived,
      totalPending,
      completionCount: completions.length,
      optionSummary: Array.from(optionSummary.entries()).map(([option, data]) => ({
        option,
        ...data,
        pending: data.handedOver - data.received,
      })),
      recentCompletions: completions.slice(0, 10).map(c => ({
        _id: c._id,
        preStitcher: c.preStitcher
          ? {
              id: c.preStitcher._id,
              name: `${c.preStitcher.firstName} ${c.preStitcher.lastName}`,
            }
          : null,
        completedItems: c.completedItems,
        totalShirtsHandedOver: c.totalShirtsHandedOver,
        status: c.status,
        createdAt: c.createdAt,
        receivedAt: c.receivedAt,
      })),
    };
  }

  public async getPartialCompletions(filters: {
    assignmentId?: string;
    deliveryMemoId?: string;
    preStitcherId?: string;
    status?: PartialCompletionStatus;
    startDate?: Date;
    endDate?: Date;
  }): Promise<PreStitcherPartialCompletionEntity[]> {
    const queryBuilder = this.partialCompletions
      .createQueryBuilder('completion')
      .leftJoinAndSelect('completion.assignment', 'assignment')
      .leftJoinAndSelect('completion.preStitcher', 'preStitcher')
      .leftJoinAndSelect('completion.deliveryMemo', 'deliveryMemo');

    if (filters.assignmentId) {
      queryBuilder.andWhere('completion.assignmentId = :assignmentId', {
        assignmentId: filters.assignmentId,
      });
    }

    if (filters.deliveryMemoId) {
      queryBuilder.andWhere('completion.deliveryMemoId = :deliveryMemoId', {
        deliveryMemoId: filters.deliveryMemoId,
      });
    }

    if (filters.preStitcherId) {
      queryBuilder.andWhere('completion.preStitcherId = :preStitcherId', {
        preStitcherId: filters.preStitcherId,
      });
    }

    if (filters.status) {
      queryBuilder.andWhere('completion.status = :status', { status: filters.status });
    }

    if (filters.startDate) {
      queryBuilder.andWhere('completion.createdAt >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters.endDate) {
      queryBuilder.andWhere('completion.createdAt <= :endDate', {
        endDate: filters.endDate,
      });
    }

    queryBuilder.orderBy('completion.createdAt', 'DESC');

    return queryBuilder.getMany();
  }

  public async cancelPartialCompletion(completionId: string, cancelledBy: string, reason: string): Promise<any> {
    return DBDataSource.transaction(async manager => {
      const partialCompletionRepo = manager.getRepository(PreStitcherPartialCompletionEntity);
      const assignmentRepo = manager.getRepository(PreStitcherAssignmentEntity);

      const completion = await partialCompletionRepo.findOne({
        where: { _id: completionId },
      });

      if (!completion) {
        throw new HttpException(404, 'Partial completion not found');
      }

      if (completion.status === PartialCompletionStatus.RECEIVED_BY_NEXT_STAGE) {
        throw new HttpException(400, 'Cannot cancel a completion that has already been received');
      }

      const assignment = await assignmentRepo.findOne({
        where: { _id: completion.assignmentId },
      });

      if (!assignment) {
        throw new HttpException(404, 'Assignment not found');
      }

      // Revert the progress
      for (const item of completion.completedItems) {
        const progressIndex = assignment.optionProgress.findIndex(p => p.option === item.option);
        if (progressIndex !== -1) {
          const progress = assignment.optionProgress[progressIndex];
          progress.completedQuantity -= item.completedQuantity;
          progress.inProgressQuantity += item.completedQuantity;
        }
      }

      completion.status = PartialCompletionStatus.CANCELLED;
      completion.notes = completion.notes ? `${completion.notes}\nCancelled: ${reason}` : `Cancelled: ${reason}`;

      await partialCompletionRepo.save(completion);
      await assignmentRepo.save(assignment);

      await this.stageHistoryService.createStageHistory({
        deliveryMemoId: completion.deliveryMemoId,
        stage: 'PRE_STITCHER_HANDOVER_CANCELLED',
        performedBy: cancelledBy,
        metadata: {
          partialCompletionId: completion._id,
          assignmentId: completion.assignmentId,
          reason,
        },
      });

      return completion;
    });
  }
}

export default PreStitcherPartialCompletionService;
