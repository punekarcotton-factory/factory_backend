import { Router } from 'express';
import DeliveryMemoController from '@controllers/deliverymemo.controller';
import { CreateDeliveryMemoDto, UpdateDeliveryMemoDto, UpdateDeliveryMemoStageDto } from '@dtos/deliverymemo.dto';
import { Routes } from '@interfaces/routes.interface';
import validationMiddleware from '@middlewares/validation.middleware';
import authMiddleware from '@/middlewares/auth.middleware';

class DeliveryMemoRoute implements Routes {
  public path = '/delivery-memos';
  public router = Router();
  public deliveryMemoController = new DeliveryMemoController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.use(this.path, authMiddleware);

    // ========================================
    // STATIC ROUTES
    // ========================================
    this.router.get(`${this.path}/fabrics/available`, this.deliveryMemoController.getFabricSKUWithQuantity);
    this.router.get(`${this.path}/fabrics/skus`, this.deliveryMemoController.getFabricSKU);
    this.router.get(`${this.path}/by-stage`, this.deliveryMemoController.getMemosByStage);
    this.router.get(`${this.path}/search`, this.deliveryMemoController.searchDeliveryMemos);
    this.router.get(`${this.path}/damage-history`, this.deliveryMemoController.getDamageHistory);
    this.router.get(`${this.path}/stats/summary`, this.deliveryMemoController.getMemoStats);
    this.router.get(`${this.path}/cutting/summary`, this.deliveryMemoController.getCuttingSummary);
    this.router.get(`${this.path}/job-work/summary`, this.deliveryMemoController.getJobWorkSummary);

    // ========================================
    // NESTED RESOURCE ROUTES
    // ========================================
    this.router.get(`${this.path}/items/:itemId/damage-history`, this.deliveryMemoController.getItemSpecificDamageHistory);
    this.router.patch(`${this.path}/items/:itemId`, this.deliveryMemoController.updateMemoItemShirtFields);
    this.router.patch(`${this.path}/items/:itemId/damage`, this.deliveryMemoController.markItemDamage);

    // ========================================
    // COLLECTION ROUTES
    // ========================================
    this.router.get(`${this.path}`, this.deliveryMemoController.getDeliveryMemos);
    this.router.post(`${this.path}`, validationMiddleware(CreateDeliveryMemoDto, 'body'), this.deliveryMemoController.createDeliveryMemo);

    // ========================================
    // PARAMETERIZED ROUTES 
    // ========================================
    this.router.get(`${this.path}/:id`, this.deliveryMemoController.getDeliveryMemoById);
    this.router.put(`${this.path}/:id`, validationMiddleware(UpdateDeliveryMemoDto, 'body', true), this.deliveryMemoController.updateDeliveryMemo);
    this.router.delete(`${this.path}/:id`, this.deliveryMemoController.deleteDeliveryMemo);
    this.router.patch(
      `${this.path}/:id/stage`,
      validationMiddleware(UpdateDeliveryMemoStageDto, 'body'),
      this.deliveryMemoController.updateDeliveryMemoStage,
    );
    this.router.patch(
      `${this.path}/:id/job-work-status`,
      this.deliveryMemoController.updateJobWorkStatus,
    );
    this.router.post(
      `${this.path}/:id/assign-job-worker`,
      this.deliveryMemoController.assignJobWorker,
    );
    this.router.post(
      `${this.path}/:id/partial-assign`,
      this.deliveryMemoController.partialAssign,
    );
  }
}

export default DeliveryMemoRoute;
