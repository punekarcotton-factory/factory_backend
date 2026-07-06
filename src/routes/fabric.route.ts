import FabricController from '@/controllers/fabric.controller';
import { Routes } from '@/interfaces/routes.interface';
import { Router } from 'express';
import multer from 'multer';
import authMiddleware from '@/middlewares/auth.middleware';

class FabricRoute implements Routes {
  public path = '/fabrics';
  public router = Router();
  public fabricController = new FabricController();
  public upload = multer({ storage: multer.memoryStorage() });

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.use(this.path, authMiddleware);

    // ── Create / base GET ────────────────────────────────────────────
    this.router.post(`${this.path}`, this.upload.single('image'), this.fabricController.createFabric);
    this.router.get(`${this.path}`, this.fabricController.getAllFabrics);

    // ── Static routes FIRST (before any /:param wildcards) ──────────
    this.router.get(`${this.path}/with-original`, this.fabricController.getFabricsWithOriginalQuantity);
    this.router.get(`${this.path}/history/all`, this.fabricController.getAllTransactionHistory);
    this.router.get(`${this.path}/reports/damage`, this.fabricController.getFabricDamageReports);
    this.router.get(`${this.path}/shirt-mapping/details`, this.fabricController.getFabricShirtMappingsWithDetails);
    this.router.get(`${this.path}/shirt-mapping`, this.fabricController.getFabricShirtMappings);
    this.router.post(`${this.path}/shirt-mapping`, this.fabricController.createFabricShirtMapping);
    this.router.post(`${this.path}/shirt-mappings/bulk`, this.fabricController.bulkCreateFabricShirtMappings);

    // ── Wildcard / param routes AFTER ───────────────────────────────
    this.router.get(`${this.path}/shirt-mapping/:id`, this.fabricController.getFabricShirtMappingById);
    this.router.put(`${this.path}/shirt-mapping/:id`, this.fabricController.updateFabricShirtMapping);
    // this.router.delete(`${this.path}/shirt-mapping/:id`, this.fabricController.deleteFabricShirtMapping);

    this.router.get(`${this.path}/:fabricSKU/shirt-skus`, this.fabricController.getShirtSKUsByFabricSKU);
    this.router.get(`${this.path}/shirt/:shirtSKU/fabric-skus`, this.fabricController.getFabricSKUsByShirtSKU);

    this.router.put(`${this.path}/:id`, this.upload.single('image'), this.fabricController.updateFabric);
    this.router.patch(`${this.path}/:id/quantity`, this.fabricController.updateFabricQuantity);
    this.router.post(`${this.path}/:sku/damage`, this.fabricController.markFabricDamage);
    this.router.get(`${this.path}/:sku/history`, this.fabricController.getFabricTransactionHistory);
  }
}

export default FabricRoute;
