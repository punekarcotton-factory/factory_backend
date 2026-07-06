import { MemoStatus } from '@/constants/MemoStatus.enum';
import { KanchButtonAssignmentStatus, KanchButtonReturnStatus } from './../constants/KanchButtonStatus.enum';
import { KanchButtonDetails, KanchButtonDetailsEntity } from './../entities/KanchButtonDetails.entity';
import { DBDataSource } from '@/databases';
import { DeliveryMemoEntity } from '@/entities/deliverymemo.entity';
import { FabricEntity } from '@/entities/fabric.entity';
import { UserEntity } from '@/entities/users.entity';

class KanchButtonService {
  public deliveryMemos = DBDataSource.getRepository(DeliveryMemoEntity);
  public fabricEntity = DBDataSource.getRepository(FabricEntity);
  public kanchButtonDetails = DBDataSource.getRepository(KanchButtonDetailsEntity);
  public users = DBDataSource.getRepository(UserEntity);

  public async getMemosInKanchButtonStage(): Promise<any[]> {
    const memos = await this.deliveryMemos.find({
      where: { stage: 'KANCH_BUTTON', status: MemoStatus.ACTIVE },
      relations: ['items', 'KanchButtonDetails'],
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
          status: memo.status,
          createdAt: memo.createdAt,
          updatedAt: memo.updatedAt,
          createdBy: memo.createdBy,
          totalDhapFold: memo.totalDhapFold,
          items: enrichedItems,
          itemCount: enrichedItems.length,
          kanchButtonAssigned: !!memo.KanchButtonDetails,
          kanchButtonStatus: memo.kanchButtonAssignmentStatus || 'NOT_ASSIGNED',
          kanchButtonDetails: memo.KanchButtonDetails
            ? {
              _id: memo.KanchButtonDetails._id,
              name: memo.KanchButtonDetails.name,
              phoneNumber: memo.KanchButtonDetails.phoneNumber,
              status: memo.kanchButtonAssignmentStatus,
              returnStatus: memo.kanchButtonReturnStatus,
              completedShirts: memo.KanchButtonDetails.completedShirts || 0,
              totalShirts: memo.KanchButtonDetails.totalShirts || 0,
              progressEntries: memo.KanchButtonDetails.progressEntries || [],

              notes: memo.KanchButtonDetails.notes || null,
            }
            : null,
        };
      }),
    );

    return enrichedMemos;
  }

  public async assignKanchButtonToMemo(memoId: string, kanchButtonName: string, kanchButtonPhoneNumber: string, notes?: string): Promise<any> {
    const memo = await this.deliveryMemos.findOne({
      where: { _id: memoId },
      relations: ['KanchButtonDetails', 'items'],
    });

    if (!memo) {
      throw new Error('Delivery memo not found');
    }

    if (memo.stage !== 'KANCH_BUTTON') {
      throw new Error('Memo is not in KANCH_BUTTON stage');
    }
    if (memo.status === MemoStatus.CLOSED) {
      throw new Error('Cannot assign kanch button to a closed memo');
    }


    const totalShirts = (memo.items || []).reduce((sum, item) => sum + (item.shirtQuantity || 0), 0);

    let kanchButton = await this.kanchButtonDetails.findOne({
      where: {
        phoneNumber: kanchButtonPhoneNumber,
        name: kanchButtonName,
      },
    });

    if (!kanchButton) {

      kanchButton = this.kanchButtonDetails.create({
        name: kanchButtonName,
        phoneNumber: kanchButtonPhoneNumber,
        status: KanchButtonAssignmentStatus.ASSIGNED,
        returnStatus: KanchButtonReturnStatus.NOT_COMPLETED,
        totalShirts,
        completedShirts: 0,
        progressEntries: [],
        notes: notes || null,
      });
      await this.kanchButtonDetails.save(kanchButton);
    } else {

      kanchButton = this.kanchButtonDetails.create({
        name: kanchButtonName,
        phoneNumber: kanchButtonPhoneNumber,
        status: KanchButtonAssignmentStatus.ASSIGNED,
        returnStatus: KanchButtonReturnStatus.NOT_COMPLETED,
        totalShirts,
        completedShirts: 0,
        progressEntries: [],
        notes: notes || null,
      });
      await this.kanchButtonDetails.save(kanchButton);
    }

    memo.KanchButtonDetails = kanchButton;
    memo.kanchButtonAssignmentStatus = KanchButtonAssignmentStatus.ASSIGNED;
    memo.kanchButtonReturnStatus = KanchButtonReturnStatus.NOT_COMPLETED;
    await this.deliveryMemos.save(memo);

    return {
      memo,
      kanchButton,
    };
  }

  public async updateKanchButtonProgress(kanchButtonId: string, completedQuantity: number, performedBy: string, notes?: string): Promise<any> {
    const kanchButton = await this.kanchButtonDetails.findOne({
      where: { _id: kanchButtonId },
    });

    if (!kanchButton) {
      throw new Error('Kanch button assignment not found');
    }

    const remaining = kanchButton.totalShirts - kanchButton.completedShirts;

    if (completedQuantity <= 0) {
      throw new Error('Completed quantity must be greater than 0');
    }

    if (completedQuantity > remaining) {
      throw new Error(`Cannot complete more than remaining shirts (${remaining})`);
    }

    kanchButton.completedShirts = kanchButton.completedShirts + completedQuantity;


    const progressEntry = {
      completedQuantity: completedQuantity,
      performedBy,
      notes: notes || null,
      timestamp: new Date().toISOString(),
    };

    kanchButton.progressEntries = [...(kanchButton.progressEntries || []), progressEntry];

    await this.kanchButtonDetails.save(kanchButton);

    return kanchButton;
  }

  public async completeKanchButtonAssignment(memoId: string, userId: string, notes?: string): Promise<any> {
    const memo = await this.deliveryMemos.findOne({
      where: { _id: memoId },
      relations: ['KanchButtonDetails'],
    });

    if (!memo) {
      throw new Error('Delivery memo not found');
    }

    if (!memo.KanchButtonDetails) {
      throw new Error('No kanch button assigned to this memo');
    }

    if (memo.status === MemoStatus.CLOSED) {
      throw new Error('Memo is already closed');
    }

    if (memo.kanchButtonAssignmentStatus === KanchButtonAssignmentStatus.COMPLETED) {
      throw new Error('Kanch button assignment already completed');
    }
    if (!memo.KanchButtonDetails.completedShirts || memo.KanchButtonDetails.completedShirts <= 0) {
      throw new Error('Progress must be updated before completing the assignment');
    }
    memo.kanchButtonAssignmentStatus = KanchButtonAssignmentStatus.COMPLETED;
    memo.kanchButtonReturnStatus = KanchButtonReturnStatus.COMPLETED;


    memo.status = MemoStatus.CLOSED;
    memo.stage = 'COMPLETED';
    memo.closedAt = new Date();
    memo.closedBy = userId;
    memo.notes = notes || null;

    await this.deliveryMemos.save(memo);

    return memo;
  }

  public async getMemoHistory(statusFilter: string = 'All'): Promise<any[]> {
    let whereCondition: any = {};

    if (statusFilter === 'Active') {
      whereCondition.status = MemoStatus.ACTIVE;
    } else if (statusFilter === 'Closed') {
      whereCondition.status = MemoStatus.CLOSED;
    }

    const memos = await this.deliveryMemos.find({
      where: whereCondition,
      relations: ['items', 'KanchButtonDetails'],
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
          status: memo.status,
          createdAt: memo.createdAt,
          updatedAt: memo.updatedAt,
          createdBy: memo.createdBy,
          closedAt: memo.closedAt,
          closedBy: memo.closedBy,
          notes: memo.notes,
          totalDhapFold: memo.totalDhapFold,
          items: enrichedItems,
          itemCount: enrichedItems.length,
          kanchButtonAssigned: !!memo.KanchButtonDetails,
          kanchButtonStatus: memo.kanchButtonAssignmentStatus || 'NOT_ASSIGNED',
          kanchButtonDetails: memo.KanchButtonDetails
            ? {
              _id: memo.KanchButtonDetails._id,
              name: memo.KanchButtonDetails.name,
              phoneNumber: memo.KanchButtonDetails.phoneNumber,
              status: memo.kanchButtonAssignmentStatus,
              returnStatus: memo.kanchButtonReturnStatus,
              progressEntries: memo.KanchButtonDetails.progressEntries || [],
              notes: memo.KanchButtonDetails.notes || null,
            }
            : null,
        };
      }),
    );

    return enrichedMemos;
  }

  public async getClosedMemos(): Promise<any[]> {
    return this.getMemoHistory('Closed');
  }

  public async getActiveMemos(): Promise<any[]> {
    return this.getMemoHistory('Active');
  }

  public async getAllKanchButtonWithStats(): Promise<any[]> {
    const kanchButtons = await this.kanchButtonDetails.find({
      order: { createdAt: 'DESC' },
    });

    const kanchButtonStats = await Promise.all(
      kanchButtons.map(async kanchButton => {
        const allMemos = await this.deliveryMemos
          .createQueryBuilder('memo')
          .leftJoinAndSelect('memo.KanchButtonDetails', 'kanchButton')
          .where('memo.kanchButtonId = :kanchButtonId', { kanchButtonId: kanchButton._id })
          .getMany();

        const totalTasks = allMemos.length;
        const completedTasks = allMemos.filter(memo => memo.kanchButtonAssignmentStatus === KanchButtonAssignmentStatus.COMPLETED).length;
        const assignedTasks = allMemos.filter(memo => memo.kanchButtonAssignmentStatus === KanchButtonAssignmentStatus.ASSIGNED).length;
        const pendingTasks = totalTasks - completedTasks;
        const returnCompleted = allMemos.filter(memo => memo.kanchButtonReturnStatus === KanchButtonReturnStatus.COMPLETED).length;
        const returnNotCompleted = allMemos.filter(memo => memo.kanchButtonReturnStatus === KanchButtonReturnStatus.NOT_COMPLETED).length;
        const closedMemos = allMemos.filter(memo => memo.status === MemoStatus.CLOSED).length;
        const activeMemos = allMemos.filter(memo => memo.status === MemoStatus.ACTIVE).length;


        const allNotes = allMemos.flatMap(memo => {
          const notes = [];
          if (memo.KanchButtonDetails?.notes) {
            notes.push({
              label: 'Assignment Note',
              text: memo.KanchButtonDetails.notes,
              date: memo.createdAt,
              memoId: memo._id,
            });
          }
          if (memo.notes) {
            notes.push({
              label: 'Completion Note',
              text: memo.notes,
              date: memo.closedAt || memo.updatedAt,
              memoId: memo._id,
            });
          }
          (memo.KanchButtonDetails?.progressEntries || []).forEach(entry => {
            if (entry.notes) {
              notes.push({
                label: 'Progress Note',
                text: entry.notes,
                date: entry.timestamp,
                memoId: memo._id,
              });
            }
          });
          return notes;
        });

        const user = await this.users.findOne({ where: { phone: kanchButton.phoneNumber } });

        return {
          _id: kanchButton._id,
          name: kanchButton.name,
          phoneNumber: kanchButton.phoneNumber,
          isActive: user ? user.isActive : true,
          status: kanchButton.status,
          returnStatus: kanchButton.returnStatus,
          createdAt: kanchButton.createdAt,
          updatedAt: kanchButton.updatedAt,
          notes: allNotes,
          taskStats: {
            totalTasks,
            completedTasks,
            assignedTasks,
            pendingTasks,
            returnCompleted,
            returnNotCompleted,
            closedMemos,
            activeMemos,
            completionRate: totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(2) : '0',
          },
        };
      }),
    );

    return kanchButtonStats;
  }
}

export default KanchButtonService;
