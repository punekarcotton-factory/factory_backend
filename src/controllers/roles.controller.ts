import { Roles } from '@/interfaces/roles.interface';
import RolesService from '@/services/roles.service';
import { NextFunction, Request, Response } from 'express';

class RolesController {
  public rolesService = new RolesService();

  public getAllRoles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const findAllRoles: Roles[] = await this.rolesService.findAllRoles();

      res.status(200).json({ data: findAllRoles, message: 'findAllRoles' });
    } catch (error) {
      next(error);
    }
  };
}

export default RolesController;
