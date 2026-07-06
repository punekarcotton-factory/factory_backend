import { Router } from 'express';
import AssignTailorController from '@controllers/assignTailor.controller';
import { Routes } from '@interfaces/routes.interface';
import authMiddleware from '@/middlewares/auth.middleware';

class AssignTailorRoute implements Routes {
  public path = '/assign-tailor';
  public router = Router();
  public assignTailorController = new AssignTailorController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.use(this.path, authMiddleware);

    this.router.post(`${this.path}/:memoId/move-to-assign-tailor`, this.assignTailorController.moveToAssignTailor);

    this.router.get(`${this.path}/memos`, this.assignTailorController.getAssignTailorMemos);

    this.router.post(`${this.path}/:memoId/assign`, this.assignTailorController.assignTailor);

    this.router.post(`${this.path}/:memoId/complete`, this.assignTailorController.completeTailorAssignment);

    this.router.post(`${this.path}/:memoId/kanch-button`, this.assignTailorController.assignToKanchButton);

    this.router.get(`${this.path}/tailors/statistics`, this.assignTailorController.getTailorsWithStatistics);

    this.router.get(`${this.path}/options`, this.assignTailorController.getAvailableOptions);

    this.router.post(`${this.path}/assign-multiple`, this.assignTailorController.assignMultipleTailors);

    this.router.patch(`${this.path}/assignments/:assignmentId/progress`, this.assignTailorController.updateAssignmentProgress);

    this.router.get(`${this.path}/:memoId/assignments`, this.assignTailorController.getAssignmentsByMemo);

    this.router.get(`${this.path}/:memoId/assignment-summary`, this.assignTailorController.getAssignmentSummary);

    this.router.get(`${this.path}/tailors/:tailorId/assignments`, this.assignTailorController.getAssignmentsByTailor);

    this.router.post(`${this.path}/memos/:memoId/partial-assign-and-assign`, this.assignTailorController.partialAssignAndAssign);
  }

}

export default AssignTailorRoute;
