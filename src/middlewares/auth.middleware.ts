import { NextFunction, Request, RequestHandler, Response } from 'express';
import { verify } from 'jsonwebtoken';
import { SECRET_KEY } from '@config';
import { HttpException } from '@exceptions/HttpException';
import { DataStoredInToken, RequestWithUser } from '@interfaces/auth.interface';
import { UserEntity } from '@/entities/users.entity';

const authMiddleware: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reqWithUser = req as RequestWithUser;
    const Authorization = (req.header('Authorization') ? req.header('Authorization')!.split('Bearer ')[1] : null) || (req as any).cookies['Authorization'];

    if (Authorization) {
      const secretKey: string = SECRET_KEY!;
      const verificationResponse = (verify(Authorization, secretKey)) as DataStoredInToken;
      const userId = verificationResponse._id;
      const findUser = await UserEntity.findOneBy({ _id: userId });

      if (findUser) {
        reqWithUser.user = findUser;
        next();
      } else {
        next(new HttpException(401, 'Wrong authentication token'));
      }
    } else {
      next(new HttpException(404, 'Authentication token missing'));
    }
  } catch (error) {
    next(new HttpException(401, 'Wrong authentication token'));
  }
};

export default authMiddleware;
