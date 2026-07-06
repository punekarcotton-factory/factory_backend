import { Router } from 'express';
import { Routes } from '@/interfaces/routes.interface';
import validationMiddleware from '@/middlewares/validation.middleware';
import PartialCompletionController from '@/controllers/preStitcherPartialCompletion.controller';
import { CreatePartialCompletionDto, ReceivePartialCompletionDto } from '@/dtos/getPartialCompletionsFilter.dto';
import authMiddleware from '@/middlewares/auth.middleware';

class PreStitcherPartialCompletionRoute implements Routes {
  public path = '/partial-completions';
  public router = Router();
  public controller = new PartialCompletionController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.use(this.path, authMiddleware);

    this.router.post(`${this.path}`, validationMiddleware(CreatePartialCompletionDto, 'body'), this.controller.createPartialCompletion);

    this.router.patch(
      `${this.path}/:completionId/receive`,
      validationMiddleware(ReceivePartialCompletionDto, 'body'),
      this.controller.receivePartialCompletion,
    );

    this.router.patch(`${this.path}/:completionId/cancel`, this.controller.cancelPartialCompletion);

    this.router.get(`${this.path}`, this.controller.getPartialCompletions);

    this.router.get(`${this.path}/assignment/:assignmentId`, this.controller.getPartialCompletionsByAssignment);

    this.router.get(`${this.path}/memo/:memoId/summary`, this.controller.getMemoPartialCompletionSummary);
  }
}

export default PreStitcherPartialCompletionRoute;
