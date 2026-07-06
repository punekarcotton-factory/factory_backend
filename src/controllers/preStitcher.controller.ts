import { Request, Response, NextFunction } from 'express';
import PreStitcherService from '@/services/preStitcher.service';
import { AssignMultiplePreStitchersDto, AssignPreStitcherDto } from '@/dtos/prestitcher.dto';
import { getS3Service, enrichMemosWithPresignedUrls } from '@/provider/s3.provider';

class PreStitcherController {
  public preStitcherService = new PreStitcherService();

  public getAllPreStitchers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const preStitchers = await this.preStitcherService.findAllPreStitcher();
      res.status(200).json({ data: preStitchers, message: 'Pre-stitchers retrieved' });
    } catch (error) {
      next(error);
    }
  };

  public assignMultiplePreStitchers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { deliveryMemoId, assignments }: AssignMultiplePreStitchersDto = req.body;
      const performedBy = req.body.performedBy || 'ADMIN';

      const result = await this.preStitcherService.assignMultiplePreStitchers(deliveryMemoId, assignments, performedBy);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Pre-stitchers assigned successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  public completeAssignment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { assignmentId } = req.params;
      const { completedBy, notes } = req.body;

      const result = await this.preStitcherService.completeAssignment(assignmentId, completedBy, notes);

      res.status(200).json({
        success: true,
        data: result,
        message: result.allCompleted ? 'All assignments completed. Memo moved to next stage.' : 'Assignment completed successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  public getAssignmentsByMemo = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { memoId } = req.params;

      const assignments = await this.preStitcherService.getAssignmentsByMemoId(memoId);

      res.status(200).json({
        success: true,
        data: assignments,
        message: 'Assignments retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };


  public getAvailableOptions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const options = this.preStitcherService.getAvailableOptions();
      res.status(200).json({ data: options, message: 'Available options retrieved' });
    } catch (error) {
      next(error);
    }
  };

  public assignPreStitcher = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { preStitcherId, deliveryMemoId, options }: AssignPreStitcherDto = req.body;

      const result = await this.preStitcherService.assignPreStitcherToMemo(preStitcherId, deliveryMemoId, options);

      res.status(200).json({
        data: result,
        message: 'pre-stitcher assigned successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  public getAssignmentDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { assignmentId } = req.params;

      const result = await this.preStitcherService.getAssignmentWithOptions(assignmentId);

      res.status(200).json({
        data: result,
        message: 'Assignment details retrieved',
      });
    } catch (error) {
      next(error);
    }
  };

  public getAssignmentByMemo = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { memoId } = req.params;

      const result = await this.preStitcherService.getAssignmentByMemoId(memoId);

      if (!result) {
        res.status(404).json({
          data: null,
          message: 'No active assignment found for this memo',
        });
        return;
      }

      res.status(200).json({
        data: result,
        message: 'Assignment details retrieved',
      });
    } catch (error) {
      next(error);
    }
  };

  // public getAllMemos = async (req: Request, res: Response, next: NextFunction) => {
  //   try {
  //     const { preStitcherId } = req.params;

  //     const memos = await this.preStitcherService.getAllMemos(preStitcherId);

  //     res.status(200).json({
  //       data: memos,
  //       message: 'All memos retrieved',
  //     });
  //   } catch (error) {
  //     next(error);
  //   }
  // };

  public getAssignedMemos = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { preStitcherId } = req.params;

      let memos = await this.preStitcherService.getAssignedMemos(preStitcherId);
      const s3Service = await getS3Service();
      memos = await enrichMemosWithPresignedUrls(memos, s3Service);

      res.status(200).json({
        data: memos,
        message: 'Assigned memos retrieved',
      });
    } catch (error) {
      next(error);
    }
  };
  public updateAssignmentProgress = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { assignmentId } = req.params;
      const { optionUpdates, performedBy, notes } = req.body;

      const result = await this.preStitcherService.updateAssignmentProgress(assignmentId, optionUpdates, performedBy, notes);

      res.status(200).json({
        success: true,
        data: result,
        message: result.allCompleted ? 'Assignment completed successfully' : 'Progress updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  public completeMemo = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { memoId } = req.params;
      const { completedBy, notes } = req.body;

      const result = await this.preStitcherService.completeMemo(memoId, completedBy, notes);

      res.status(200).json({
        data: result,
        message: 'Memo completed successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  public getReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { preStitcherId } = req.params;

      // Get query parameters
      const { fromDate, toDate, search } = req.query;

      // Parse dates if provided
      let parsedFromDate: Date | undefined;
      let parsedToDate: Date | undefined;

      if (fromDate && typeof fromDate === 'string') {
        parsedFromDate = new Date(fromDate);
        if (isNaN(parsedFromDate.getTime())) {
          parsedFromDate = undefined; // Invalid date, use default
        }
      }

      if (toDate && typeof toDate === 'string') {
        parsedToDate = new Date(toDate);
        if (isNaN(parsedToDate.getTime())) {
          parsedToDate = undefined; // Invalid date, use default
        }
      }

      const searchQuery = search && typeof search === 'string' ? search : undefined;

      const report = await this.preStitcherService.getPreStitcherReport(preStitcherId, parsedFromDate, parsedToDate, searchQuery);

      console.log('[CONTROLLER] Report generated successfully');

      res.status(200).json({
        success: true,
        data: report,
        message: 'Report retrieved successfully',
      });
    } catch (error) {
      console.error('[CONTROLLER] Error getting report:', error);
      next(error);
    }
  };



  public getAllMemos = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { preStitcherId } = req.params;
      const memos = await this.preStitcherService.getAllMemosForPreStitcher(preStitcherId);
      res.status(200).json({
        data: memos,
        message: 'All memos retrieved',
      });
    } catch (error) {
      next(error);
    }
  };

  public partialAssignAndAssign = async (req: Request, res: Response, next: NextFunction) => {
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

      const result = await this.preStitcherService.partialAssignAndAssign(
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

export default PreStitcherController;
