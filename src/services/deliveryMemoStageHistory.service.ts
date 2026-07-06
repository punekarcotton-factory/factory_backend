import { DBDataSource } from '@/databases';
import { DeliveryMemoStageHistory, DeliveryMemoStageHistoryEntity } from '@/entities/deliveryMemoStageHistory.entity';

interface CreateStageHistoryDto {
  deliveryMemoId: string;
  stage: string;
  performedBy?: string;
  metadata?: Record<string, any>;
}

class DeliveryMemoStageHistoryService {
  public stageHistory = DBDataSource.getRepository(DeliveryMemoStageHistoryEntity);

  private async getUserNameOrEmail(userId: string): Promise<string> {
    if (!userId) return 'Unknown';

    if (userId === 'ADMIN') return 'Admin';

    try {
      const UserEntity = require('@/entities/users.entity').UserEntity;
      const userRepo = DBDataSource.getRepository(UserEntity);

      const user = await userRepo.findOne({ where: { _id: userId } });

      if (user) {
        return user.name || user.email || 'User';
      }

      return 'Unknown User';
    } catch (error) {
      console.error('Error fetching user details:', error);
      return 'Unknown';
    }
  }

  // Create stage history
  public async createStageHistory(data: CreateStageHistoryDto): Promise<DeliveryMemoStageHistory> {
    const stageEntry = await this.stageHistory.save({
      deliveryMemoId: data.deliveryMemoId,
      stage: data.stage,
      enteredAt: new Date(),
      performedBy: data.performedBy,
      metadata: data.metadata,
    });

    return stageEntry;
  }

  // Get all history by deliveryMemoId
  public async getHistoryByDeliveryMemoId(deliveryMemoId: string): Promise<any[]> {
    const history = await this.stageHistory.find({
      where: { deliveryMemoId },
      order: { enteredAt: 'DESC' },
    });

    const enrichedHistory = await Promise.all(
      history.map(async (entry) => {
        const performedByName = await this.getUserNameOrEmail(entry.performedBy);

        return {
          ...entry,
          performedByName,
        };
      })
    );

    return enrichedHistory;
  }


  public async getAllStageHistory(): Promise<any[]> {
    const history = await this.stageHistory.find({
      order: { enteredAt: 'DESC' },
      relations: ['deliveryMemo', 'deliveryMemo.items'],
    });

    const enrichedHistory = await Promise.all(
      history.map(async entry => {
        const deliveryMemoId = entry.deliveryMemoId;

        const assignmentRepo = DBDataSource.getRepository(require('@/entities/preStitcher.entity').PreStitcherAssignmentEntity);
        const optionsRepo = DBDataSource.getRepository(require('@/entities/prestitchOptions.entity').PreStitchOptionsEntity);

        const assignment = await assignmentRepo.findOne({
          where: {
            deliveryMemoId,
            status: 'ASSIGNED',
          },
          relations: ['preStitcher'],
        });

        let options = null;
        if (assignment) {
          options = await optionsRepo.findOne({
            where: { assignmentId: assignment._id },
          });
        }

        const performedByName = await this.getUserNameOrEmail(entry.performedBy);

        return {
          ...entry,
          performedByName,
          assignment,
          options,
        };
      }),
    );

    return enrichedHistory;
  }

  public async getEnrichedHistoryByMemoId(deliveryMemoId: string): Promise<any[]> {
    const history = await this.stageHistory.find({
      where: { deliveryMemoId },
      order: { enteredAt: 'ASC' },
    });

    const now = new Date();
    const enrichedHistory = await Promise.all(
      history.map(async (entry, index) => {
        const start = entry.enteredAt;
        const end = history[index + 1]?.enteredAt || now;
        const durationMs = end.getTime() - start.getTime();
        const durationHours = durationMs / (1000 * 60 * 60);

        const performedByName = await this.getUserNameOrEmail(entry.performedBy);

        return {
          _id: entry._id,
          deliveryMemoId: entry.deliveryMemoId,
          stage: entry.stage,
          enteredAt: entry.enteredAt,
          performedBy: entry.performedBy,
          performedByName,
          metadata: entry.metadata,
          durationMs,
          durationHours: Number(durationHours.toFixed(2)),
        };
      })
    );

    return enrichedHistory;
  }
}

export default DeliveryMemoStageHistoryService;
