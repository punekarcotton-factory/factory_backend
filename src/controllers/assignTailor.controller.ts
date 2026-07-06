import { NextFunction, Request, Response } from 'express';
import AssignTailorService from '@/services/assignTailor.service';
import TailorAssignmentService from '@/services/tailorAssignment.service';
import { AssignMultipleTailorsDto } from '@/dtos/tailorAssignment.dto';
import { getS3Service, enrichMemosWithPresignedUrls } from '@/provider/s3.provider';

class AssignTailorController {
  public assignTailorService = new AssignTailorService();
  public tailorAssignmentService = new TailorAssignmentService();

  public moveToAssignTailor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { memoId } = req.params;

      const performedBy = (req as any).user?._id;

      if (!performedBy) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const memo = await this.assignTailorService.moveToAssignTailor(memoId, performedBy);

      res.status(200).json({
        data: memo,
        message: 'Memo moved to Assign Tailor stage successfully',
      });
    } catch (error) {
      console.error('[AssignTailorController] Error moving to assign tailor:', error);
      next(error);
    }
  };

  public getAssignTailorMemos = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      let memos = await this.assignTailorService.getMemosInAssignTailorStage();
      const s3Service = await getS3Service();
      memos = await enrichMemosWithPresignedUrls(memos, s3Service);

      res.status(200).json({
        data: memos,
        message: 'ASSIGN_TAILOR memos fetched successfully',
      });
    } catch (error) {
      console.error('[AssignTailorController] Error fetching memos:', error);
      next(error);
    }
  };

  /**
   * POST /assign-tailor/:memoId/assign
   * Assign a tailor to a delivery memo
   */


  public assignTailor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { memoId } = req.params;
      const { tailorName, tailorPhoneNumber, cuff, ghera, collar } = req.body;

      // Validation
      if (!tailorName || !tailorPhoneNumber) {
        res.status(400).json({
          message: 'Tailor name and phone number are required',
        });
        return;
      }

      if (!/^\d{10}$/.test(tailorPhoneNumber)) {
        res.status(400).json({
          message: 'Phone number must be 10 digits',
        });
        return;
      }


      const cuffValue = Boolean(cuff);
      const gheraValue = Boolean(ghera);
      const collarValue = Boolean(collar);

      const result = await this.assignTailorService.assignTailorToMemo(memoId, tailorName, tailorPhoneNumber, cuffValue, gheraValue, collarValue);

      res.status(200).json({
        data: result,
        message: 'Tailor assigned successfully',
      });
    } catch (error) {
      console.error('[AssignTailorController] Error assigning tailor:', error);
      next(error);
    }
  };

  /**
   * POST /assign-tailor/:memoId/complete
   * Mark tailor assignment as complete
   */
  public completeTailorAssignment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { memoId } = req.params;

      const performedBy = (req as any).user?._id || req.body.performedBy;

      const memo = await this.assignTailorService.completeTailorAssignment(memoId, performedBy);

      res.status(200).json({
        data: memo,
        message: 'Tailor assignment marked as complete',
      });
    } catch (error) {
      console.error('[AssignTailorController] Error completing assignment:', error);
      next(error);
    }
  };

  public assignToKanchButton = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { memoId } = req.params;

    
      const performedBy = (req as any).user?._id || req.body.performedBy;

      const memo = await this.assignTailorService.assignToKanchButton(memoId, performedBy);

      res.status(200).json({
        data: memo,
        message: 'Memo moved to Kanch Button stage successfully',
      });
    } catch (error) {
      console.error('[AssignTailorController] Error assigning to Kanch Button:', error);
      next(error);
    }
  };

  /**
   * GET /assign-tailor/tailors/statistics
   * Fetch all tailors with their task statistics
   */
  public getTailorsWithStatistics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tailors = await this.assignTailorService.getAllTailorsWithStats();

      res.status(200).json({
        data: tailors,
        message: 'Tailors with statistics fetched successfully',
        totalCount: tailors.length,
      });
    } catch (error) {
      console.error('[AssignTailorController] Error fetching tailors with statistics:', error);
      next(error);
    }
  };

  public assignMultipleTailors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto: AssignMultipleTailorsDto = req.body;

      const performedBy = req.body.performedBy;

      const result = await this.tailorAssignmentService.assignMultipleTailors(dto, performedBy);

      res.status(200).json({
        success: true,
        message: 'Tailors assigned successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public updateAssignmentProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { assignmentId } = req.params;
      const { optionUpdates, performedBy, notes } = req.body;

      const result = await this.tailorAssignmentService.updateAssignmentProgress(assignmentId, optionUpdates, performedBy, notes);

      res.status(200).json({
        success: true,
        data: result,
        message: result.allCompleted ? 'Assignment completed successfully' : 'Progress updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  public getAssignmentsByMemo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { memoId } = req.params;

      const assignments = await this.tailorAssignmentService.getAssignmentsByMemoId(memoId);

      res.status(200).json({
        success: true,
        data: assignments,
        message: 'Assignments retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  public getAssignmentSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { memoId } = req.params;

      const summary = await this.tailorAssignmentService.getAssignmentSummary(memoId);

      res.status(200).json({
        success: true,
        data: summary,
        message: 'Summary retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  public getAvailableOptions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { memoId } = req.query;
      
      if (memoId && typeof memoId === 'string') {
        const options = await this.tailorAssignmentService.getAvailableOptionsWithRemaining(memoId);
        res.status(200).json({ data: options, message: 'Available options with remaining quantities retrieved' });
      } else {
        const options = this.tailorAssignmentService.getAvailableOptions();
        res.status(200).json({ data: options, message: 'Default available options retrieved' });
      }
    } catch (error) {
      next(error);
    }
  };
  public getAssignmentsByTailor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tailorId } = req.params;

      const assignments = await this.tailorAssignmentService.getAssignmentsByTailorId(tailorId);

      res.status(200).json({
        success: true,
        data: assignments,
        message: 'Tailor assignments retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  public partialAssignAndAssign = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { memoId } = req.params;
      const { items, assignments, performedBy } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({ message: 'items array is required' });
        return;
      }

      if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
        res.status(400).json({ message: 'assignments array is required' });
        return;
      }

      const result = await this.tailorAssignmentService.partialAssignAndAssign(
        memoId,
        items,
        assignments,
        performedBy || 'ADMIN',
      );

      res.status(200).json({
        success: true,
        data: result,
        message: 'Partial assignment created successfully. Child memo moved to In Progress.',
      });
    } catch (error) {
      next(error);
    }
  };
}

export default AssignTailorController;

