// controllers/partialCompletion.controller.ts
import { NextFunction, Request, Response } from 'express';
import { CreatePartialCompletionDto, GetPartialCompletionsFilterDto, ReceivePartialCompletionDto } from '@/dtos/getPartialCompletionsFilter.dto';
import PartialCompletionService from '@/services/preStitcherPartialCompletion.service';

class PartialCompletionController {
  private partialCompletionService = new PartialCompletionService();


  public createPartialCompletion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: CreatePartialCompletionDto = req.body;

      const result = await this.partialCompletionService.createPartialCompletion(data);

      res.status(201).json({
        success: true,
        data: result,
        message: result.allCompleted
          ? 'Assignment fully completed! All shirts handed over.'
          : 'Partial completion recorded successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /partial-completions/:completionId/receive
   * Mark a partial completion as received
   */
  public receivePartialCompletion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { completionId } = req.params;
      const { receivedBy, notes }: ReceivePartialCompletionDto = req.body;

      const result = await this.partialCompletionService.receivePartialCompletion(completionId, receivedBy, notes);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Partial completion marked as received',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /partial-completions
   * Get all partial completions with optional filters
   */
  public getPartialCompletions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = {
        assignmentId: req.query.assignmentId as string,
        deliveryMemoId: req.query.deliveryMemoId as string,
        preStitcherId: req.query.preStitcherId as string,
        status: req.query.status as any,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };

      const completions = await this.partialCompletionService.getPartialCompletions(filters);

      res.status(200).json({
        success: true,
        data: completions,
        count: completions.length,
        message: 'Partial completions retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /partial-completions/assignment/:assignmentId
   * Get all partial completions for a specific assignment
   */
  public getPartialCompletionsByAssignment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { assignmentId } = req.params;

      const completions = await this.partialCompletionService.getPartialCompletionsByAssignment(assignmentId);

      res.status(200).json({
        success: true,
        data: completions,
        count: completions.length,
        message: 'Partial completions retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /partial-completions/memo/:memoId/summary
   * Get summary of partial completions for a memo
   */
  public getMemoPartialCompletionSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { memoId } = req.params;

      const summary = await this.partialCompletionService.getMemoPartialCompletionSummary(memoId);

      res.status(200).json({
        success: true,
        data: summary,
        message: 'Partial completion summary retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /partial-completions/:completionId/cancel
   * Cancel a partial completion
   */
  public cancelPartialCompletion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { completionId } = req.params;
      const { cancelledBy, reason } = req.body;

      if (!cancelledBy || !reason) {
        res.status(400).json({
          success: false,
          message: 'cancelledBy and reason are required',
        });
        return;
      }

      const result = await this.partialCompletionService.cancelPartialCompletion(completionId, cancelledBy, reason);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Partial completion cancelled successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}

export default PartialCompletionController;
