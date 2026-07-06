import { Router } from 'express';
import UsersController from '@controllers/users.controller';
import { CreateUserDto, UpdateUserDto, ReassignTasksDto } from '@dtos/users.dto';
import { Routes } from '@interfaces/routes.interface';
import validationMiddleware from '@middlewares/validation.middleware';
import authMiddleware from '@/middlewares/auth.middleware';

class UsersRoute implements Routes {
  public path = '/users';
  public router = Router();
  public usersController = new UsersController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.use(this.path, authMiddleware);

    this.router.get(`${this.path}`, authMiddleware, this.usersController.getUsers);
    this.router.get(`${this.path}/:id`, this.usersController.getUserById);
    this.router.post(`${this.path}/create`, validationMiddleware(CreateUserDto, 'body'), this.usersController.createUser);
    this.router.put(`${this.path}/:id`, validationMiddleware(UpdateUserDto, 'body', true), this.usersController.updateUser);
    this.router.get(`${this.path}/:id/tasks`, this.usersController.getUserTaskSummary);
    this.router.delete(`${this.path}/:id`, this.usersController.deleteUser);
    this.router.post(`${this.path}/reactivate/:id`, this.usersController.reactivateUser);
    this.router.post(`${this.path}/reassign-tasks`, validationMiddleware(ReassignTasksDto, 'body'), this.usersController.reassignTasks);
    this.router.get(`${this.path}/role/:roleName`, this.usersController.getUsersByRole);
  }
}

export default UsersRoute;
