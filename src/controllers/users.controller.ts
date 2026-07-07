import { NextFunction, Request, Response } from 'express';
import { CreateUserDto, UpdateUserDto, ReassignTasksDto } from '@dtos/users.dto';
import { User } from '@interfaces/users.interface';
import userService from '@services/users.service';
import { isEmpty } from 'class-validator';
import { HttpException } from '@/exceptions/HttpException';

class UsersController {
  public userService = new userService();

  public getUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const findAllUsersData: User[] = await this.userService.findAllUser();

      res.status(200).json({ data: findAllUsersData, message: 'findAll' });
    } catch (error) {
      next(error);
    }
  };

  public getUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId: string = req.params.id;
      if (isEmpty(userId)) throw new HttpException(400, 'UserId is empty');

      const users: User[] = await this.userService.findUserById(userId);

      res.status(200).json({ data: users, message: 'findAllExceptUser' });
    } catch (error) {
      next(error);
    }
  };

  public createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userData: CreateUserDto = req.body;
      const createUserData: User = await this.userService.createUser(userData);

      res.status(201).json({ data: createUserData, message: 'created' });
    } catch (error) {
      next(error);
    }
  };

  public updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId: string = req.params.id;
      const userData: UpdateUserDto = req.body;
      const updateUserData: User = await this.userService.updateUser(userId, userData);
      
      res.status(200).json({ data: updateUserData, message: 'updated' });
    } catch (error) {
      next(error);
    }
  };

  public getUserTaskSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId: string = req.params.id;
      const summary = await this.userService.getUserTaskSummary(userId);

      res.status(200).json({ data: summary, message: 'getUserTaskSummary' });
    } catch (error) {
      next(error);
    }
  };

  public deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId: string = req.params.id;
      const deletedBy: string = req.body.deletedBy || (req.headers['x-user-id'] as string);

      if (!deletedBy) throw new HttpException(400, 'deletedBy is required');

      const deleteUserData: User = await this.userService.deleteUser(userId, deletedBy);

      res.status(200).json({ data: deleteUserData, message: 'deleted' });
    } catch (error) {
      next(error);
    }
  };

  public reassignTasks = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reassignData: ReassignTasksDto = req.body;
      const reassignedBy: string = (req.headers['x-user-id'] as string);

      const result = await this.userService.reassignUserTasks(reassignData, reassignedBy);

      res.status(200).json({ data: result, message: 'reassigned' });
    } catch (error) {
      next(error);
    }
  };
  public getUsersByRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const roleName = req.params.roleName || req.query.roleName;

    if (!roleName) {
      throw new HttpException(400, 'Role name is required');
    }

    const users = await this.userService.findUsersByRole(roleName as string);

    res.status(200).json({ data: users, message: 'findUsersByRole' });
  } catch (error) {
    }
  };

  public reactivateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId: string = req.params.id;
      const reactivateUserData: User = await this.userService.reactivateUser(userId);

      res.status(200).json({ data: reactivateUserData, message: 'reactivated' });
    } catch (error) {
      next(error);
    }
  };
}

export default UsersController;
