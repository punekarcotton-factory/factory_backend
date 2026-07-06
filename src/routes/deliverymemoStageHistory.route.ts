import { Router } from 'express';

import { CreateStageHistoryDto } from '@dtos/deliveryMemoStageHistory.dto';
import { Routes } from '@interfaces/routes.interface';
import validationMiddleware from '@middlewares/validation.middleware';
import DeliveryMemoStageHistoryController from '@/controllers/deliverymemoStageHistory.controller';
import authMiddleware from '@/middlewares/auth.middleware';

class DeliveryMemoStageHistoryRoute implements Routes {
  public path = '/delivery-memo-stage-history';
  public router = Router();
  public stageHistoryController = new DeliveryMemoStageHistoryController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.use(this.path, authMiddleware);

    this.router.get(`${this.path}`, this.stageHistoryController.getAllStageHistory);
    this.router.get(`${this.path}/:deliveryMemoId`, this.stageHistoryController.getHistoryByDeliveryMemoId);
    this.router.post(`${this.path}`, validationMiddleware(CreateStageHistoryDto, 'body'), this.stageHistoryController.createStageHistory);
  }
}

export default DeliveryMemoStageHistoryRoute;
