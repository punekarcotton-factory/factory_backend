import { DBDataSource } from '@/databases';
import { KanchButtonDetailsEntity } from '@/entities/KanchButtonDetails.entity';
import { DeliveryMemoEntity } from '@/entities/deliverymemo.entity';
import { KanchButtonAssignmentStatus, KanchButtonReturnStatus } from '@/constants/KanchButtonStatus.enum';
import { HttpException } from '@/exceptions/HttpException';
import StageHistoryService from './deliveryMemoStageHistory.service';

class KanchButtonAssignmentService {
    private kanchButtonDetails = DBDataSource.getRepository(KanchButtonDetailsEntity);
    private deliveryMemos = DBDataSource.getRepository(DeliveryMemoEntity);
    private stageHistoryService = new StageHistoryService();

    /**
     * Update progress for a Kanch Button worker
     */
    public async updateProgress(
        kanchButtonId: string,
        completedQuantity: number,
        performedBy: string,
        notes?: string
    ): Promise<any> {

        if (completedQuantity <= 0) {
            throw new HttpException(400, 'Completed quantity must be greater than 0');
        }


        const kanchButton = await this.kanchButtonDetails.findOne({
            where: { _id: kanchButtonId },
        });

        if (!kanchButton) {
            throw new HttpException(404, 'Kanch Button worker not found');
        }


        const newCompletedTotal = kanchButton.completedShirts + completedQuantity;

        if (newCompletedTotal > kanchButton.totalShirts) {
            throw new HttpException(
                400,
                `Cannot complete ${completedQuantity} shirts. Only ${kanchButton.totalShirts - kanchButton.completedShirts} shirts remaining.`
            );
        }

        kanchButton.completedShirts = newCompletedTotal;

        const progressEntry = {
            completedQuantity,
            performedBy,
            notes: notes || '',
            timestamp: new Date().toISOString(),
        };

        if (!kanchButton.progressEntries) {
            kanchButton.progressEntries = [];
        }
        kanchButton.progressEntries.push(progressEntry);

        if (notes) {
            kanchButton.notes = notes;
        }

        const allCompleted = newCompletedTotal === kanchButton.totalShirts;
        if (allCompleted) {
            kanchButton.status = KanchButtonAssignmentStatus.COMPLETED;
            kanchButton.returnStatus = KanchButtonReturnStatus.COMPLETED;
        } else if (newCompletedTotal > 0) {
            kanchButton.status = KanchButtonAssignmentStatus.ASSIGNED;
        }

        await this.kanchButtonDetails.save(kanchButton);

        const memo = await this.deliveryMemos.findOne({
            where: { KanchButtonDetailsId: kanchButtonId },
        });

        if (memo) {

            if (allCompleted) {
                memo.kanchButtonAssignmentStatus = KanchButtonAssignmentStatus.COMPLETED;
                memo.kanchButtonReturnStatus = KanchButtonReturnStatus.COMPLETED;
                await this.deliveryMemos.save(memo);
            }

            await this.stageHistoryService.createStageHistory({
                deliveryMemoId: memo._id,
                stage: allCompleted ? 'KANCH_BUTTON_COMPLETED' : 'KANCH_BUTTON_PROGRESS_UPDATE',
                performedBy,
                metadata: {
                    action: allCompleted ? 'KANCH_BUTTON_COMPLETED' : 'PROGRESS_UPDATE',
                    kanchButtonId,
                    workerName: kanchButton.name,
                    completedQuantity,
                    totalCompleted: newCompletedTotal,
                    totalShirts: kanchButton.totalShirts,
                    notes: notes || '',
                    timestamp: new Date().toISOString(),
                },
            });
        }

        return {
            success: true,
            allCompleted,
            kanchButton: {
                _id: kanchButton._id,
                name: kanchButton.name,
                phoneNumber: kanchButton.phoneNumber,
                completedShirts: kanchButton.completedShirts,
                totalShirts: kanchButton.totalShirts,
                status: kanchButton.status,
                returnStatus: kanchButton.returnStatus,
            },
        };
    }

    /**
     * Get Kanch Button worker details with progress
     */
    public async getKanchButtonDetails(kanchButtonId: string): Promise<any> {
        const kanchButton = await this.kanchButtonDetails.findOne({
            where: { _id: kanchButtonId },
        });

        if (!kanchButton) {
            throw new HttpException(404, 'Kanch Button worker not found');
        }

        const progressPercentage =
            kanchButton.totalShirts > 0
                ? Math.round((kanchButton.completedShirts / kanchButton.totalShirts) * 100)
                : 0;

        return {
            _id: kanchButton._id,
            name: kanchButton.name,
            phoneNumber: kanchButton.phoneNumber,
            completedShirts: kanchButton.completedShirts,
            totalShirts: kanchButton.totalShirts,
            remainingShirts: kanchButton.totalShirts - kanchButton.completedShirts,
            progressPercentage,
            status: kanchButton.status,
            returnStatus: kanchButton.returnStatus,
            progressEntries: kanchButton.progressEntries || [],
            createdAt: kanchButton.createdAt,
            updatedAt: kanchButton.updatedAt,
        };
    }
}

export default KanchButtonAssignmentService;
