import { TailorAssignmentStatus, TailorReturnStatus } from '@/constants/tailorStatus.enum';
import { DBDataSource } from '@/databases';
import { DeliveryMemoEntity } from '@/entities/deliverymemo.entity';
import { FabricEntity } from '@/entities/fabric.entity';
import { TailorDetailsEntity } from '@/entities/TailorDetails.entity';
import { HttpException } from '@/exceptions/HttpException';
import DeliveryMemoStageHistoryService from './deliveryMemoStageHistory.service';
import { TailorAssignmentEntity } from '@/entities/tailorAssignment.entity';
import { UserEntity } from '@/entities/users.entity';
import { RolesEntity } from '@/entities/roles.entity';
import { In, ILike } from 'typeorm';

class AssignTailorService {
  public deliveryMemos = DBDataSource.getRepository(DeliveryMemoEntity);
  public fabricEntity = DBDataSource.getRepository(FabricEntity);
  public tailors = DBDataSource.getRepository(TailorDetailsEntity);
  public users = DBDataSource.getRepository(UserEntity);
  public roles = DBDataSource.getRepository(RolesEntity);
  public stageHistoryService = new DeliveryMemoStageHistoryService();

  public async moveToAssignTailor(memoId: string, performedBy: string) {
    const memo = await this.deliveryMemos.findOne({
      where: { _id: memoId },
    });

    if (!memo) {
      throw new HttpException(404, 'Delivery memo not found');
    }

    if (memo.stage !== 'PRE_STITCHER_COMPLETED') {
      throw new HttpException(400, `Memo is not ready to move. Current stage: ${memo.stage}. Must be PRE_STITCHER_COMPLETED`);
    }

    memo.stage = 'ASSIGN_TAILOR';
    memo.tailorAssignmentStatus = TailorAssignmentStatus.NOT_ASSIGNED;
    memo.tailorReturnStatus = TailorReturnStatus.NOT_COMPLETED;

    await this.deliveryMemos.save(memo);

    await this.stageHistoryService.createStageHistory({
      deliveryMemoId: memo._id,
      stage: 'ASSIGN_TAILOR',
      performedBy,
      metadata: {
        action: 'MOVE_TO_ASSIGN_TAILOR',
        previousStage: 'PRE_STITCHER_COMPLETED',
      },
    });

    return {
      _id: memo._id,
      stage: memo.stage,
      message: 'Memo moved to Assign Tailor stage',
    };
  }

  public async getMemosInAssignTailorStage(): Promise<any[]> {
    const memos = await this.deliveryMemos.find({
      where: { stage: 'ASSIGN_TAILOR' },
      relations: ['items', 'tailorDetails'],
      order: { updatedAt: 'DESC' },
    });

    const enrichedMemos = await Promise.all(
      memos.map(async memo => {
        const enrichedItems = await Promise.all(
          (memo.items || []).map(async item => {
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
          }),
        );

        return {
          _id: memo._id,
          deliveryMemoId: memo._id,
          stage: memo.stage,
          createdAt: memo.createdAt,
          updatedAt: memo.updatedAt,
          createdBy: memo.createdBy,
          totalDhapFold: memo.totalDhapFold,
          items: enrichedItems,
          itemCount: enrichedItems.length,
          tailorAssignmentStatus: memo.tailorAssignmentStatus || 'NOT_ASSIGNED',
          tailorReturnStatus: memo.tailorReturnStatus || 'NOT_COMPLETED',
          tailorDetails: memo.tailorDetails
            ? {
              _id: memo.tailorDetails._id,
              name: memo.tailorDetails.name,
              phoneNumber: memo.tailorDetails.phoneNumber,
              cuff: memo.tailorDetails.cuff,
              ghera: memo.tailorDetails.ghera,
              collar: memo.tailorDetails.collar,
              status: memo.tailorAssignmentStatus,
              returnStatus: memo.tailorReturnStatus,
            }
            : null,
        };
      }),
    );

    return enrichedMemos;
  }

  public async assignTailorToMemo(
    memoId: string,
    tailorName: string,
    tailorPhoneNumber: string,
    cuff: boolean = false,
    ghera: boolean = false,
    collar: boolean = false,
  ): Promise<any> {
    const memo = await this.deliveryMemos.findOne({
      where: { _id: memoId },
      relations: ['tailorDetails'],
    });

    if (!memo) {
      throw new HttpException(404, 'Delivery memo not found');
    }

    if (memo.stage !== 'ASSIGN_TAILOR') {
      throw new HttpException(400, 'Memo is not in ASSIGN_TAILOR stage');
    }

    let tailor = await this.tailors.findOne({
      where: { phoneNumber: tailorPhoneNumber },
    });

    if (!tailor) {
      tailor = this.tailors.create({
        name: tailorName,
        phoneNumber: tailorPhoneNumber,
        status: TailorAssignmentStatus.ASSIGNED,
        returnStatus: TailorReturnStatus.NOT_COMPLETED,
        cuff,
        ghera,
        collar,
      });
      await this.tailors.save(tailor);
    } else {
      tailor.name = tailorName;
      tailor.cuff = cuff;
      tailor.ghera = ghera;
      tailor.collar = collar;
      await this.tailors.save(tailor);
    }

    memo.tailorDetails = tailor;
    memo.tailorAssignmentStatus = TailorAssignmentStatus.ASSIGNED;
    memo.tailorReturnStatus = TailorReturnStatus.NOT_COMPLETED;

    await this.deliveryMemos.save(memo);

    await this.stageHistoryService.createStageHistory({
      deliveryMemoId: memo._id,
      stage: 'ASSIGN_TAILOR',
      performedBy: memo.createdBy,
      metadata: {
        action: 'TAILOR_ASSIGNED',
        tailorId: tailor._id,
        tailorName: tailor.name,
        tailorPhone: tailor.phoneNumber,
        cuff,
        ghera,
        collar,
      },
    });

    return {
      success: true,
      memo: {
        _id: memo._id,
        stage: memo.stage,
        tailorAssigned: true,
        tailorAssignmentStatus: memo.tailorAssignmentStatus,
      },
      tailor: {
        _id: tailor._id,
        name: tailor.name,
        phoneNumber: tailor.phoneNumber,
        cuff: tailor.cuff,
        ghera: tailor.ghera,
        collar: tailor.collar,
      },
    };
  }

  public async completeTailorAssignment(memoId: string, performedBy?: string): Promise<any> {
    const memo = await this.deliveryMemos.findOne({
      where: { _id: memoId },
      relations: ['tailorDetails', 'items'],
    });

    if (!memo) {
      throw new HttpException(404, 'Delivery memo not found');
    }

    const assignmentRepo = DBDataSource.getRepository(TailorAssignmentEntity);

    const multipleAssignments = await assignmentRepo.find({
      where: {
        deliveryMemoId: memoId,
        status: In(['ASSIGNED', 'IN_PROGRESS', 'COMPLETED']),
      },
      relations: ['tailor'],
    });

    if (!memo.tailorDetails && multipleAssignments.length === 0) {
      throw new HttpException(400, 'No tailor assigned to this memo');
    }

    if (memo.tailorAssignmentStatus === TailorAssignmentStatus.COMPLETED) {
      throw new HttpException(400, 'Tailor assignment already completed');
    }

    if (multipleAssignments.length > 0) {
      for (const assignment of multipleAssignments) {
        if (assignment.status !== 'COMPLETED') {
          if (assignment.optionProgress && assignment.optionProgress.length > 0) {
            assignment.optionProgress = assignment.optionProgress.map(progress => ({
              ...progress,
              completedQuantity: progress.totalQuantity,
              inProgressQuantity: 0,
            }));
          }

          assignment.status = 'COMPLETED' as any;
          assignment.completedAt = new Date();
          await assignmentRepo.save(assignment);
        }
      }
    }

    // Update memo status
    memo.tailorAssignmentStatus = TailorAssignmentStatus.COMPLETED;
    memo.tailorReturnStatus = TailorReturnStatus.COMPLETED;
    await this.deliveryMemos.save(memo);

    // Create stage history entry
    await this.stageHistoryService.createStageHistory({
      deliveryMemoId: memo._id,
      stage: 'TAILOR_WORK_COMPLETED',
      performedBy: performedBy || memo.createdBy,
      metadata: {
        action: 'TAILOR_ASSIGNMENT_COMPLETED',
        assignmentType: multipleAssignments.length > 0 ? 'MULTIPLE' : 'SINGLE',
        totalAssignments: multipleAssignments.length,
        tailorId: memo.tailorDetails?._id || null,
        tailorName: memo.tailorDetails?.name || 'Multiple Tailors',
        itemCount: memo.items?.length || 0,
        totalDhapFold: memo.totalDhapFold,
        completedAt: new Date().toISOString(),
      },
    });

    return {
      success: true,
      memo: {
        _id: memo._id,
        stage: memo.stage,
        tailorAssignmentStatus: memo.tailorAssignmentStatus,
        tailorReturnStatus: memo.tailorReturnStatus,
      },
      tailor: memo.tailorDetails
        ? {
          _id: memo.tailorDetails._id,
          name: memo.tailorDetails.name,
          phoneNumber: memo.tailorDetails.phoneNumber,
        }
        : {
          name: 'Multiple Tailors',
          count: multipleAssignments.length,
        },
    };
  }

  public async assignToKanchButton(memoId: string, performedBy?: string): Promise<any> {
    const memo = await this.deliveryMemos.findOne({
      where: { _id: memoId },
      relations: ['tailorDetails', 'items'],
    });

    if (!memo) {
      throw new HttpException(404, 'Delivery memo not found');
    }

    const assignmentRepo = DBDataSource.getRepository(TailorAssignmentEntity);
    const multipleAssignments = await assignmentRepo.find({
      where: {
        deliveryMemoId: memoId,
        status: In(['ASSIGNED', 'IN_PROGRESS', 'COMPLETED']),
      },
      relations: ['tailor'],
    });

    if (!memo.tailorDetails && multipleAssignments.length === 0) {
      throw new HttpException(400, 'No tailor assigned to this memo');
    }

    if (memo.tailorAssignmentStatus !== TailorAssignmentStatus.COMPLETED) {
      throw new HttpException(400, 'Tailor assignment must be completed before moving to Kanch Button stage');
    }

    const previousStage = memo.stage;

    memo.stage = 'KANCH_BUTTON';
    await this.deliveryMemos.save(memo);

    const metadata: any = {
      action: 'MOVE_TO_KANCH_BUTTON',
      previousStage: previousStage,
      itemCount: memo.items?.length || 0,
      totalDhapFold: memo.totalDhapFold,
      movedAt: new Date().toISOString(),
    };

    if (memo.tailorDetails) {
      metadata.assignmentType = 'SINGLE';
      metadata.tailorId = memo.tailorDetails._id;
      metadata.tailorName = memo.tailorDetails.name;
      metadata.tailorPhone = memo.tailorDetails.phoneNumber;
      metadata.tailorWork = {
        cuff: memo.tailorDetails.cuff,
        ghera: memo.tailorDetails.ghera,
        collar: memo.tailorDetails.collar,
      };
    } else if (multipleAssignments.length > 0) {
      metadata.assignmentType = 'MULTIPLE';
      metadata.totalTailors = multipleAssignments.length;
      metadata.tailors = multipleAssignments.map(assignment => ({
        tailorId: assignment.tailor?._id,
        tailorName: assignment.tailor?.name || 'Unknown',
        tailorPhone: assignment.tailor?.phoneNumber,
        assignedOptions: assignment.assignedOptions,
        optionProgress: assignment.optionProgress,
        status: assignment.status,
      }));
    }

    // Create stage history entry
    await this.stageHistoryService.createStageHistory({
      deliveryMemoId: memo._id,
      stage: 'KANCH_BUTTON',
      performedBy: performedBy || memo.createdBy,
      metadata,
    });

    return {
      success: true,
      memo: {
        _id: memo._id,
        stage: memo.stage,
        previousStage: previousStage,
      },
    };
  }

  public async getAllTailorsWithStats(): Promise<any[]> {

    const role = await this.roles.findOne({ where: { roleName: ILike('tailor') } });
    if (role) {
      const users = await this.users.find({ where: { roleId: role._id } });
      for (const user of users) {
        if (!user.phone) continue;

        let tailorDetail = await this.tailors.findOne({ where: { phoneNumber: user.phone } });
        if (!tailorDetail) {
          tailorDetail = this.tailors.create({
            name: `${user.firstName} ${user.lastName}`.trim(),
            phoneNumber: user.phone,
            status: TailorAssignmentStatus.ASSIGNED,
            returnStatus: TailorReturnStatus.NOT_COMPLETED,
          });
          await this.tailors.save(tailorDetail);
        }
      }
    }

    const tailors = await this.tailors.find({
      order: { createdAt: 'DESC' },
    });

    console.log('Found tailors after sync:', tailors.length);

    const tailorStats = await Promise.all(
      tailors.map(async tailor => {

        const singleMemos = await this.deliveryMemos
          .createQueryBuilder('memo')
          .where('memo.tailorDetailsId = :tailorId', { tailorId: tailor._id })
          .getMany();


        const assignmentRepo = DBDataSource.getRepository(TailorAssignmentEntity);
        const multipleAssignments = await assignmentRepo.find({
          where: { tailorId: tailor._id },
        });

        console.log(`Tailor ${tailor._id}: ${singleMemos.length} single, ${multipleAssignments.length} multiple assignments`);


        const totalTasks = singleMemos.length + multipleAssignments.length;

        const completedSingle = singleMemos.filter(memo => memo.tailorAssignmentStatus === TailorAssignmentStatus.COMPLETED).length;
        const completedMultiple = multipleAssignments.filter(a => a.status === 'COMPLETED').length;
        const completedTasks = completedSingle + completedMultiple;

        const assignedSingle = singleMemos.filter(memo => memo.tailorAssignmentStatus === TailorAssignmentStatus.ASSIGNED).length;
        const assignedMultiple = multipleAssignments.filter(a => a.status === 'ASSIGNED' || a.status === 'IN_PROGRESS').length;
        const assignedTasks = assignedSingle + assignedMultiple;

        const user = await this.users.findOne({ where: { phone: tailor.phoneNumber } });

        return {
          _id: tailor._id,
          name: tailor.name,
          phoneNumber: tailor.phoneNumber,
          isActive: user ? user.isActive : true, // Default to true if no user record found
          status: tailor.status,
          returnStatus: tailor.returnStatus,
          tailorIdentifierId: user?.tailorIdentifierId,
          createdAt: tailor.createdAt,
          updatedAt: tailor.updatedAt,
          taskStats: {
            totalTasks,
            completedTasks,
            assignedTasks,
            completionRate: totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(2) : '0',
          },
        };
      }),
    );

    return tailorStats;
  }
}

export default AssignTailorService;
