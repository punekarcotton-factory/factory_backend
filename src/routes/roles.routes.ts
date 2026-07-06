import RolesController from '@/controllers/roles.controller';
import authMiddleware from '@/middlewares/auth.middleware';
import { Routes } from '@interfaces/routes.interface';
import { Router } from 'express';

class RolesRoute implements Routes {
  public path = '/roles';
  public router = Router();
  public rolesController = new RolesController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.use(this.path, authMiddleware);

    this.router.get(`${this.path}`, this.rolesController.getAllRoles);
  }
}

export default RolesRoute;
