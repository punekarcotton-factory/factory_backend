import { Router } from 'express';

import { Routes } from '@/interfaces/routes.interface';
import validationMiddleware from '@/middlewares/validation.middleware';
import { AssignPreStitcherDto } from '@/dtos/prestitcher.dto';
import PreStitcherController from '@/controllers/preStitcher.controller';
import authMiddleware from '@/middlewares/auth.middleware';

class PreStitcherRoute implements Routes {
  public path = '/pre-stitchers';
  public router = Router();
  public preStitcherController = new PreStitcherController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.use(this.path, authMiddleware);

    // Get all pre-stitchers
    this.router.get(`${this.path}`, this.preStitcherController.getAllPreStitchers);

    // Get available options for UI checkboxes
    this.router.get(`${this.path}/options`, this.preStitcherController.getAvailableOptions);

    // Assign multiple pre-stitchers
    this.router.post(`${this.path}/assign-multiple`, this.preStitcherController.assignMultiplePreStitchers);

    // Partial assign + assign: splits the memo and assigns pre-stitcher to child memo in one transaction
    this.router.post(`${this.path}/memos/:memoId/partial-assign-and-assign`, this.preStitcherController.partialAssignAndAssign);

    // Assign pre-stitcher to memo (with options)
    this.router.post(`${this.path}/assign`, validationMiddleware(AssignPreStitcherDto, 'body'), this.preStitcherController.assignPreStitcher);

    // Update assignment progress
    this.router.patch(`${this.path}/assignments/:assignmentId/progress`, this.preStitcherController.updateAssignmentProgress);

    // Get assignment details with options by assignment ID
    this.router.get(`${this.path}/assignments/:assignmentId`, this.preStitcherController.getAssignmentDetails);

    // Get assignment details with options by memo ID
    this.router.get(`${this.path}/memos/:memoId/assignment`, this.preStitcherController.getAssignmentByMemo);

    // Get all assignments for a memo ID
    this.router.get(`${this.path}/memos/:memoId/pre-stitcher-assignments`, this.preStitcherController.getAssignmentsByMemo);


    // Complete pre-stitching memo
    this.router.post(`${this.path}/memos/:memoId/complete`, this.preStitcherController.completeMemo);

    // Admin complete pre-stitching memo on behalf of pre-stitcher
    this.router.post(`${this.path}/memos/:memoId/admin-complete`, this.preStitcherController.adminCompleteMemo);



    // Get report for a pre-stitcher (BEFORE /:preStitcherId/memos)
    this.router.get(`${this.path}/:preStitcherId/report`, this.preStitcherController.getReport);

    // Get all memos for a pre-stitcher (history)
    this.router.get(`${this.path}/:preStitcherId/all-memos`, this.preStitcherController.getAllMemos);

    // Get assigned memos for a pre-stitcher
    this.router.get(`${this.path}/:preStitcherId/memos`, this.preStitcherController.getAssignedMemos);

    this.router.get(`${this.path}/:preStitcherId/all-memos`, this.preStitcherController.getAllMemos);
  }
}

export default PreStitcherRoute;
