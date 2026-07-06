
import { NextFunction, Request, Response } from 'express';
import { CreateDeliveryMemoDto, UpdateDeliveryMemoDto } from '@dtos/deliverymemo.dto';
import { DeliveryMemo } from '@/entities/deliverymemo.entity';
import DeliveryMemoService from '@services/deliverymemo.service';
import { getS3Service, enrichMemosWithPresignedUrls } from '@/provider/s3.provider';

class DeliveryMemoController {
  public deliveryMemoService = new DeliveryMemoService();

  public getDeliveryMemos = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stage = req.query.stage as string;
      let memos = await this.deliveryMemoService.findAllDeliveryMemos(stage);
      const s3Service = await getS3Service();
      memos = await enrichMemosWithPresignedUrls(memos, s3Service);
      res.status(200).json({ data: memos, message: 'findAll' });
    } catch (error) {
      next(error);
    }
  };

  public getMemosByStage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stage = req.query.stage as string;

      if (!stage) {
        return res.status(400).json({ message: 'Stage parameter is required' });
      }

      let memos = await this.deliveryMemoService.getMemosByStage(stage);
      const s3Service = await getS3Service();
      memos = await enrichMemosWithPresignedUrls(memos, s3Service);
      res.status(200).json({ data: memos, message: 'findAll' });
    } catch (error) {
      next(error);
    }
  };

  public getDeliveryMemoById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const memoId: string = req.params.id;
      let memo: any = await this.deliveryMemoService.findDeliveryMemoById(memoId);
      const s3Service = await getS3Service();
      [memo] = await enrichMemosWithPresignedUrls([memo], s3Service);
      res.status(200).json({ data: memo, message: 'findOne' });
    } catch (error) {
      next(error);
    }
  };

  public createDeliveryMemo = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const memoData: CreateDeliveryMemoDto = req.body;
      const memo = await this.deliveryMemoService.createDeliveryMemo(memoData);
      res.status(201).json({ data: memo, message: 'created' });
    } catch (error) {
      next(error);
    }
  };

  public updateDeliveryMemo = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const memoId: string = req.params.id;
      const memoData: UpdateDeliveryMemoDto = req.body;
      const memo: DeliveryMemo = await this.deliveryMemoService.updateDeliveryMemo(memoId, memoData);
      res.status(200).json({ data: memo, message: 'updated' });
    } catch (error) {
      next(error);
    }
  };

  public deleteDeliveryMemo = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const memoId: string = req.params.id;
      const memo: DeliveryMemo = await this.deliveryMemoService.deleteDeliveryMemo(memoId);
      res.status(200).json({ data: memo, message: 'deleted' });
    } catch (error) {
      next(error);
    }
  };

  public getFabricSKU = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sku = await this.deliveryMemoService.getFabricSKU();
      res.status(200).json({ data: sku, message: 'success' });
    } catch (error) {
      next(error);
    }
  };

  public updateDeliveryMemoStage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const memoId: string = req.params.id;
      const stageData = req.body;
      const memo = await this.deliveryMemoService.updateDeliveryMemoStage(memoId, stageData);
      res.status(200).json({ data: memo, message: 'Stage updated successfully' });
    } catch (error) {
      next(error);
    }
  };

  public getFabricSKUWithQuantity = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fabrics = await this.deliveryMemoService.getFabricSKUWithQuantity();
      res.status(200).json({ data: fabrics, message: 'success' });
    } catch (error) {
      next(error);
    }
  };


  public updateMemoItemShirtFields = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const itemId: string = req.params.itemId;
      const { shirtSKUs, shirtQuantity, performedBy } = req.body;

      const result = await this.deliveryMemoService.updateMemoItemShirtFields(
        itemId,
        {
          shirtSKUs,
          shirtQuantity,
        },
        performedBy,
      );

      res.status(200).json({ data: result, message: 'Item updated successfully' });
    } catch (error) {
      next(error);
    }
  };

  public markItemDamage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const itemId = req.params.itemId;
      const { damagedQuantity, notes, performedBy, stage } = req.body;

      const result = await this.deliveryMemoService.markItemDamage({
        itemId,
        damagedQuantity: parseFloat(damagedQuantity),
        notes,
        performedBy,
        stage,
      });

      res.status(200).json({
        data: result,
        message: 'Item damage recorded successfully',
      });
    } catch (error) {
      next(error);
    }
  };


  public getDamageHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = {
        itemId: req.query.itemId as string,
        deliveryMemoId: req.query.deliveryMemoId as string,
        fabricSKU: req.query.fabricSKU as string,
        shirtSKU: req.query.shirtSKU as string,
        stage: req.query.stage as string,
        performedBy: req.query.performedBy as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };

      const result = await this.deliveryMemoService.getItemDamageHistory(filters);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };


  public getItemSpecificDamageHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { itemId } = req.params;

      const result = await this.deliveryMemoService.getItemDamageHistory({
        itemId,
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  public getMemoStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const stats = await this.deliveryMemoService.getMemoStatsSummary(startDate, endDate);
      res.status(200).json({ data: stats, message: 'getMemoStats' });
    } catch (error) {
      next(error);
    }
  };

  public getCuttingSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.deliveryMemoService.getCuttingSummary();
      res.status(200).json({ data, message: 'getCuttingSummary' });
    } catch (error) {
      next(error);
    }
  };

  public searchDeliveryMemos = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = req.query.q as string;
      const result = await this.deliveryMemoService.searchDeliveryMemos(query);
      res.status(200).json({ data: result, message: 'search results' });
    } catch (error) {
      next(error);
    }
  };

  public partialAssign = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const memoId: string = req.params.id;
      const { items, performedBy } = req.body;
      const newMemo = await this.deliveryMemoService.partialAssign(memoId, items, performedBy);
      res.status(200).json({ data: newMemo, message: 'Partial assignment created successfully' });
    } catch (error) {
      next(error);
    }
  };
}

export default DeliveryMemoController;
