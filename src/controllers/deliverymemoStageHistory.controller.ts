import { Request, Response, NextFunction } from 'express';
import DeliveryMemoStageHistoryService from '@/services/deliveryMemoStageHistory.service';

class DeliveryMemoStageHistoryController {
  public stageHistoryService = new DeliveryMemoStageHistoryService();


  public createStageHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { deliveryMemoId, stage, performedBy, metadata } = req.body;

      if (!deliveryMemoId || !stage) {
        res.status(400).json({ message: 'deliveryMemoId and stage are required' });
        return;
      }

      const stageEntry = await this.stageHistoryService.createStageHistory({
        deliveryMemoId,
        stage,
        performedBy,
        metadata,
      });

      res.status(201).json({ data: stageEntry, message: 'Stage history created successfully' });
    } catch (error) {
      next(error);
    }
  };


  public getHistoryByDeliveryMemoId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { deliveryMemoId } = req.params;

      if (!deliveryMemoId) {
        res.status(400).json({ message: 'deliveryMemoId is required' });
        return;
      }

      const history = await this.stageHistoryService.getHistoryByDeliveryMemoId(deliveryMemoId);

      res.status(200).json({ data: history, message: 'History retrieved successfully' });
    } catch (error) {
      next(error);
    }
  };

  
  public getAllStageHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const history = await this.stageHistoryService.getAllStageHistory();

      res.status(200).json({ data: history, message: 'All stage history retrieved successfully' });
    } catch (error) {
      next(error);
    }
  };
}

export default DeliveryMemoStageHistoryController;
