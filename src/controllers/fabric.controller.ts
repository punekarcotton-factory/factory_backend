import { NextFunction, Request, Response } from 'express';
import { CreateFabricDto } from '@/dtos/fabric.dto';
import { UpdateFabricQuantityDto } from '@/dtos/fabricQuantity.dto';
import { Fabric } from '@interfaces/fabric.interface';
import FabricService from '@/services/fabric.service';
import S3Service from '@/services/s3.service';
import { BulkCreateFabricShirtMappingDto, CreateFabricShirtMappingDto, GetFabricShirtMappingsDto, UpdateFabricShirtMappingDto } from '@/dtos/fabricShirtMapping.dto';
import { getS3Service } from '@/provider/s3.provider';
import { logger } from '@/utils/logger';

class FabricController {
  public fabricService = new FabricService();
  // public s3Service = new S3Service();

  private async enrichFabricsWithPresignedUrls(fabrics: any, s3Service: S3Service) {
    if (!fabrics) return fabrics;
    const isArray = Array.isArray(fabrics);
    const list = isArray ? fabrics : [fabrics];

    for (const f of list) {
      if (f.imageUrl) {
        try {
          f.imageUrl = await s3Service.getPresignedUrlOrSame(f.imageUrl);
        } catch (e) {
          logger.error(`Error enriching presigned url: ${e}`);
        }
      }
    }
    return isArray ? list : list[0];
  }

  public createFabric = async (req: Request & { file: any }, res: Response, next: NextFunction): Promise<void> => {
    try {
      const s3Service = await getS3Service();
      const fabricData: CreateFabricDto = req.body;
      const file = req.file;

      if (!file) {
        throw new Error('Image file is required');
      }

      const imageUrl = await s3Service.uploadFile(file);
      const createFabricData: Fabric = await this.fabricService.createFabric(fabricData, imageUrl);

      res.status(201).json({ data: await this.enrichFabricsWithPresignedUrls(createFabricData, s3Service), message: 'created' });
    } catch (error) {
      logger.info(`S3 Client initialized with region: ${error}`);

      next(error);
    }
  };

  public getAllFabrics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const search = req.query.search as string;

      const s3Service = await getS3Service();
      let fabrics: Fabric[];

      if (search && search.trim()) {
        fabrics = await this.fabricService.searchFabrics(search.trim());
      } else {
        fabrics = await this.fabricService.getFabrics();
      }

      fabrics = await this.enrichFabricsWithPresignedUrls(fabrics, s3Service);

      res.status(200).json({ data: fabrics, message: 'fabrics retrieved' });
    } catch (error) {
      next(error);
    }
  };

  public updateFabric = async (req: Request & { file: any }, res: Response, next: NextFunction): Promise<void> => {
    try {
      const s3Service = await getS3Service();
      const id = req.params.id;
      const fabricData: Partial<CreateFabricDto> = req.body;
      const file = req.file;

      let imageUrl: string | undefined;

      if (file) {
        imageUrl = await s3Service.uploadFile(file);
      }

      const updatedFabric: Fabric = await this.fabricService.updateFabric(id, fabricData, imageUrl);

      res.status(200).json({ data: await this.enrichFabricsWithPresignedUrls(updatedFabric, s3Service), message: 'fabric updated' });
    } catch (error) {
      next(error);
    }
  };

  public updateFabricQuantity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const s3Service = await getS3Service();
      const id = req.params.id;
      const quantityData: UpdateFabricQuantityDto = req.body;

      const result = await this.fabricService.updateFabricQuantity(id, quantityData);

      if (result && result.fabric) {
        result.fabric = await this.enrichFabricsWithPresignedUrls(result.fabric, s3Service);
      }

      res.status(200).json({
        data: result,
        message: `Fabric quantity ${quantityData.operation.toLowerCase()}ed successfully`,
      });
    } catch (error) {
      next(error);
    }
  };

  public markFabricDamage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const fabricSKU = req.params.sku;
      const { damagedQuantity, notes, performedBy } = req.body;

      if (!damagedQuantity || damagedQuantity <= 0) {
        res.status(400).json({ message: 'Valid damaged quantity is required' });
        return;
      }

      const result = await this.fabricService.markFabricDamage({
        fabricSKU,
        damagedQuantity: parseFloat(damagedQuantity),
        notes,
        performedBy,
      });

      res.status(200).json({
        data: result,
        message: result.action === 'DAMAGE' ? 'Fabric marked as damaged successfully' : 'Fabric return initiated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  public getFabricTransactionHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sku = req.params.sku;
      const history = await this.fabricService.getFabricTransactionHistory(sku);
      res.status(200).json({ data: history, message: 'fabric transaction history retrieved' });
    } catch (error) {
      next(error);
    }
  };

  public getAllTransactionHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const history = await this.fabricService.getAllTransactionHistory();
      res.status(200).json({ data: history, message: 'all transaction history retrieved' });
    } catch (error) {
      next(error);
    }
  };

  public getFabricsWithOriginalQuantity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const search = req.query.search as string;

      const s3Service = await getS3Service();
      let fabrics: any[];

      if (search && search.trim()) {
        fabrics = await this.fabricService.searchFabricsWithOriginalQuantity(search.trim());
      } else {
        fabrics = await this.fabricService.getFabricsWithOriginalQuantity();
      }

      fabrics = await this.enrichFabricsWithPresignedUrls(fabrics, s3Service);

      res.status(200).json({ data: fabrics, message: 'fabrics with original quantity retrieved' });
    } catch (error) {
      next(error);
    }
  };



  public getFabricDamageReports = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const s3Service = await getS3Service();
      const { startDate, endDate, action, status, search, groupBy } = req.query;

      const reports = await this.fabricService.getFabricDamageReports({
        startDate: startDate as string,
        endDate: endDate as string,
        action: action as 'DAMAGE' | 'RETURN',
        status: status as 'DAMAGED' | 'RETURN',
        search: search as string,
        groupBy: groupBy as 'fabric' | 'transaction',
      });

      if (reports && reports.records) {
        const fabricImageCache: Record<string, string> = {};

        for (const record of reports.records) {
          let rawImageUrl: string = (record.metadata && record.metadata.imageUrl) ? record.metadata.imageUrl : '';

          if (!rawImageUrl) {
            const sku: string = record.fabricSKU;
            if (fabricImageCache[sku] === undefined) {
              try {
                const fabric = await this.fabricService.getFabricBySKU(sku);
                fabricImageCache[sku] = (fabric && fabric.imageUrl) ? fabric.imageUrl : '';
              } catch (err) {
                fabricImageCache[sku] = '';
              }
            }
            rawImageUrl = fabricImageCache[sku] || '';
          }

          if (rawImageUrl && record.metadata) {
            record.metadata.imageUrl = await s3Service.getPresignedUrlOrSame(rawImageUrl);
          }
        }
      }

      res.status(200).json({ data: reports, message: 'damage reports retrieved' });
    } catch (error) {
      next(error);
    }
  };


  public bulkCreateFabricShirtMappings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: BulkCreateFabricShirtMappingDto = req.body;
      const result = await this.fabricService.createFabricShirtMappingsBulk(data);
      res.status(201).json({
        message: `${result.created.length} mapping(s) created, ${result.skipped.length} skipped (already existed)`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public createFabricShirtMapping = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const mappingData: CreateFabricShirtMappingDto = req.body;

      const mapping = await this.fabricService.createFabricShirtMapping(mappingData);

      res.status(201).json({
        data: mapping,
        message: 'Fabric-Shirt mapping created successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  public getFabricShirtMappings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters: GetFabricShirtMappingsDto = {
        fabricSKU: req.query.fabricSKU as string,
        shirtSKU: req.query.shirtSKU as string,
      };

      const mappings = await this.fabricService.getFabricShirtMappings(filters);

      res.status(200).json({
        data: mappings,
        message: 'Fabric-Shirt mappings retrieved',
      });
    } catch (error) {
      next(error);
    }
  };

  public getFabricShirtMappingsWithDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const mappings = await this.fabricService.getFabricShirtMappingsWithDetails();

      res.status(200).json({
        data: mappings,
        message: 'Fabric-Shirt mappings with details retrieved',
      });
    } catch (error) {
      next(error);
    }
  };

  public getFabricShirtMappingById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;

      const mapping = await this.fabricService.getFabricShirtMappingById(id);

      res.status(200).json({
        data: mapping,
        message: 'Fabric-Shirt mapping retrieved',
      });
    } catch (error) {
      next(error);
    }
  };

  public getShirtSKUsByFabricSKU = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const fabricSKU = req.params.fabricSKU;

      const shirtSKUs = await this.fabricService.getShirtSKUsByFabricSKU(fabricSKU);

      res.status(200).json({
        data: shirtSKUs,
        message: 'Shirt SKUs retrieved',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all fabric SKUs for a specific shirt
   * GET /fabrics/shirt/:shirtSKU/fabric-skus
   */
  public getFabricSKUsByShirtSKU = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const shirtSKU = req.params.shirtSKU;

      const fabricSKUs = await this.fabricService.getFabricSKUsByShirtSKU(shirtSKU);

      res.status(200).json({
        data: fabricSKUs,
        message: 'Fabric SKUs retrieved',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update a fabric-shirt mapping
   * PUT /fabrics/shirt-mapping/:id
   */
  public updateFabricShirtMapping = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      const updateData: UpdateFabricShirtMappingDto = req.body;

      const mapping = await this.fabricService.updateFabricShirtMapping(id, updateData);

      res.status(200).json({
        data: mapping,
        message: 'Fabric-Shirt mapping updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}

export default FabricController;
