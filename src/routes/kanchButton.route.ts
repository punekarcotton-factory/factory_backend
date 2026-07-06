import { Router } from 'express';

import { Routes } from '@interfaces/routes.interface';
import KanchButtonController from '@/controllers/kanchButton.controller';
import authMiddleware from '@/middlewares/auth.middleware';

class KanchButtonRoute implements Routes {
  public path = '/kanch-button';
  public router = Router();
  public kanchButtonController = new KanchButtonController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.use(this.path, authMiddleware);

    // Get all memos in KANCH_BUTTON stage
    this.router.get(`${this.path}/memos`, this.kanchButtonController.getKanchButtonMemos);

    // Assign a kanch button to a memo
    this.router.post(`${this.path}/:memoId/assign`, this.kanchButtonController.assignKanchButton);

    // Mark kanch button assignment as complete
    this.router.post(`${this.path}/:memoId/complete`, this.kanchButtonController.completeKanchButtonAssignment);

    this.router.get(`${this.path}/statistics`, this.kanchButtonController.getTailorsWithStatistics);

    this.router.get(`${this.path}/history`, this.kanchButtonController.getMemoHistory);

    // Get only closed memos (for Closed Memo History tab)
    this.router.get(`${this.path}/closed-memos`, this.kanchButtonController.getClosedMemos);

    // Get only active memos (for Active Memo list)
    this.router.get(`${this.path}/active-memos`, this.kanchButtonController.getActiveMemos);

  
    this.router.patch(`${this.path}/:kanchButtonId/progress`, this.kanchButtonController.updateKanchButtonProgress);
    this.router.get(`${this.path}/:kanchButtonId/details`, this.kanchButtonController.getKanchButtonDetails);
  }
}

export default KanchButtonRoute;
