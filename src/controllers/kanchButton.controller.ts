import { NextFunction, Request, Response } from 'express';
import KanchButtonService from '@/services/kanchButton.service';
import { getS3Service, enrichMemosWithPresignedUrls } from '@/provider/s3.provider';
import KanchButtonAssignmentService from '@/services/kanchButtonAssignment.service';

class KanchButtonController {
  public KanchButtonService = new KanchButtonService();

  /**
   * GET /kanch-button/memos
   * Get all memos in KANCH_BUTTON stage (active only)
   */
  public getKanchButtonMemos = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      let memos = await this.KanchButtonService.getMemosInKanchButtonStage();
      const s3Service = await getS3Service();
      memos = await enrichMemosWithPresignedUrls(memos, s3Service);

      res.status(200).json({
        data: memos,
        message: 'KANCH_BUTTON memos fetched successfully',
      });
    } catch (error) {
      console.error('[KanchButtonController] Error fetching memos:', error);
      next(error);
    }
  };

  /**
   * POST /kanch-button/:memoId/assign
   * Assign kanch button to a memo
   */
  public assignKanchButton = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { memoId } = req.params;
      const { tailorName, tailorPhoneNumber, notes } = req.body;

      // Validation
      if (!tailorName || !tailorPhoneNumber) {
        res.status(400).json({
          message: 'Kanch Button name and phone number are required',
        });
        return;
      }

      if (!/^\d{10}$/.test(tailorPhoneNumber)) {
        res.status(400).json({
          message: 'Phone number must be 10 digits',
        });
        return;
      }

      const result = await this.KanchButtonService.assignKanchButtonToMemo(memoId, tailorName, tailorPhoneNumber, notes);

      res.status(200).json({
        data: result,
        message: 'Kanch Button assigned successfully',
      });
    } catch (error) {
      console.error('[KanchButtonController] Error assigning kanch button:', error);
      next(error);
    }
  };


  public completeKanchButtonAssignment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { memoId } = req.params;
      const { notes } = req.body;


      const userId = (req as any).user?.id || (req as any).user?._id || (req as any).userId || 'system';

      const memo = await this.KanchButtonService.completeKanchButtonAssignment(memoId, userId, notes);

      res.status(200).json({
        data: memo,
        message: 'Kanch button assignment completed and memo closed successfully',
      });
    } catch (error) {
      console.error('[KanchButtonController] Error completing assignment:', error);
      next(error);
    }
  };

  /**
   * GET /kanch-button/statistics
   * Get all kanch buttons with statistics
   */
  public getTailorsWithStatistics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const kanchButtons = await this.KanchButtonService.getAllKanchButtonWithStats();

      res.status(200).json({
        data: kanchButtons,
        message: 'Kanch buttons with statistics fetched successfully',
        totalCount: kanchButtons.length,
      });
    } catch (error) {
      console.error('[KanchButtonController] Error fetching kanch buttons with statistics:', error);
      next(error);
    }
  };

  /**
   * PATCH /kanch-button/:kanchButtonId/progress
   * Update progress for a Kanch Button worker
   */
  public updateKanchButtonProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { kanchButtonId } = req.params;
      const { completedQuantity, performedBy, notes } = req.body;


      if (!completedQuantity || completedQuantity <= 0) {
        res.status(400).json({
          message: 'Completed quantity must be greater than 0',
        });
        return;
      }

      const service = new KanchButtonAssignmentService();

      const result = await service.updateProgress(kanchButtonId, completedQuantity, performedBy, notes);

      res.status(200).json({
        data: result,
        message: result.allCompleted ? 'Work completed successfully' : 'Progress updated successfully',
      });
    } catch (error) {
      console.error('[KanchButtonController] Error updating progress:', error);
      next(error);
    }
  };

  /**
   * GET /kanch-button/:kanchButtonId/details
   * Get Kanch Button worker details with progress
   */
  public getKanchButtonDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { kanchButtonId } = req.params;

      const service = new KanchButtonAssignmentService();

      const details = await service.getKanchButtonDetails(kanchButtonId);

      res.status(200).json({
        data: details,
        message: 'Kanch Button details retrieved successfully',
      });
    } catch (error) {
      console.error('[KanchButtonController] Error fetching Kanch Button details:', error);
      next(error);
    }
  };

  public getMemoHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status } = req.query;
      const statusFilter = (status as string) || 'All';

      if (!['Active', 'Closed', 'All'].includes(statusFilter)) {
        res.status(400).json({
          message: 'Invalid status filter. Must be Active, Closed, or All',
        });
        return;
      }

      let memos = await this.KanchButtonService.getMemoHistory(statusFilter);
      const s3Service = await getS3Service();
      memos = await enrichMemosWithPresignedUrls(memos, s3Service);

      res.status(200).json({
        data: memos,
        filter: statusFilter,
        message: 'Memo history retrieved successfully',
      });
    } catch (error) {
      console.error('[KanchButtonController] Error fetching memo history:', error);
      next(error);
    }
  };

  public getClosedMemos = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      let memos = await this.KanchButtonService.getClosedMemos();
      const s3Service = await getS3Service();
      memos = await enrichMemosWithPresignedUrls(memos, s3Service);

      res.status(200).json({
        data: memos,
        message: 'Closed memos retrieved successfully',
        totalCount: memos.length,
      });
    } catch (error) {
      console.error('[KanchButtonController] Error fetching closed memos:', error);
      next(error);
    }
  };

 
  public getActiveMemos = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      let memos = await this.KanchButtonService.getActiveMemos();
      const s3Service = await getS3Service();
      memos = await enrichMemosWithPresignedUrls(memos, s3Service);

      res.status(200).json({
        data: memos,
        message: 'Active memos retrieved successfully',
        totalCount: memos.length,
      });
    } catch (error) {
      console.error('[KanchButtonController] Error fetching active memos:', error);
      next(error);
    }
  };
}

export default KanchButtonController;
