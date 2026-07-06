import { DBDataSource } from '@/databases';
import { CreateFabricDto } from '@/dtos/fabric.dto';
import { UpdateFabricQuantityDto } from '@/dtos/fabricQuantity.dto';
import {
  BulkCreateFabricShirtMappingDto,
  CreateFabricShirtMappingDto,
  GetFabricShirtMappingsDto,
  UpdateFabricShirtMappingDto,
} from '@/dtos/fabricShirtMapping.dto';
import { FabricEntity } from '@/entities/fabric.entity';
import { FabricDamageEntity } from '@/entities/fabricDamage.entity';
import { FabricShirtMappingEntity } from '@/entities/fabricShirtMapping.entity';
import { FabricTransactionHistoryEntity } from '@/entities/fabricTransitionHistory';
import { UserEntity } from '@/entities/users.entity';
import { HttpException } from '@exceptions/HttpException';
import { Fabric } from '@interfaces/fabric.interface';
import { isEmpty } from '@utils/util';
import { IsNull, Repository } from 'typeorm';

export class FabricService {
  private fabricRepository: Repository<FabricEntity>;
  private transactionHistoryRepository: Repository<FabricTransactionHistoryEntity>;
  private damageRepository: Repository<FabricDamageEntity>;
  private userRepository: Repository<UserEntity>;
  private fabricShirtMappingRepository: Repository<FabricShirtMappingEntity>;

  constructor() {
    this.fabricRepository = DBDataSource.getRepository(FabricEntity);
    this.transactionHistoryRepository = DBDataSource.getRepository(FabricTransactionHistoryEntity);
    this.damageRepository = DBDataSource.getRepository(FabricDamageEntity);
    this.userRepository = DBDataSource.getRepository(UserEntity);
    this.fabricShirtMappingRepository = DBDataSource.getRepository(FabricShirtMappingEntity);
  }

  public async createFabric(fabricData: CreateFabricDto, imageUrl: string): Promise<Fabric> {
    if (isEmpty(fabricData)) throw new HttpException(400, 'Fabric data is empty');
    if (!fabricData.sku || !fabricData.quantity) throw new HttpException(400, 'SKU and quantity are required');

    const exists = await this.fabricRepository.findOne({
      where: { sku: fabricData.sku },
    });
    if (exists) throw new HttpException(409, 'SKU already exists');

    const fabric = await this.fabricRepository.save({
      ...fabricData,
      imageUrl,
    });

    await this.transactionHistoryRepository.save({
      fabricSKU: fabric.sku,
      transactionType: 'INITIAL',
      quantityChanged: fabric.quantity,
      previousQuantity: 0,
      newQuantity: fabric.quantity,
      notes: 'Initial stock',
    });

    return fabric;
  }

  public async searchFabricsWithOriginalQuantity(searchTerm: string): Promise<any[]> {
    const searchPattern = `%${searchTerm.toLowerCase()}%`;

    const fabrics = await this.fabricRepository
      .createQueryBuilder('fabric')
      .where('fabric.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('(LOWER(fabric.sku) LIKE :search OR LOWER(fabric.title) LIKE :search OR LOWER(fabric.color) LIKE :search)', { search: searchPattern })
      .orderBy('fabric.createdAt', 'DESC')
      .getMany();

    return Promise.all(
      fabrics.map(async fabric => {
        const currentQuantity = Number(fabric.quantity);

        const deductTransactions = await this.transactionHistoryRepository.find({
          where: {
            fabricSKU: fabric.sku,
            transactionType: 'DEDUCT',
          },
        });

        const usedInMemos = deductTransactions.reduce((sum, tx) => sum + Number(tx.quantityChanged || 0), 0);
        const originalQuantity = currentQuantity + usedInMemos;

        // Subtract standalone pending returns — same logic as DeliveryMemoService.getFabricSKUWithQuantity()
        const standaloneDamageRecords = await this.damageRepository.find({
          where: {
            fabricSKU: fabric.sku,
            deliveryMemoItemId: IsNull(),
          },
        });
        const blockedByPendingReturn = standaloneDamageRecords
          .filter(record => record.action === 'RETURN' && record.status === 'RETURN')
          .reduce((sum, record) => sum + parseFloat(String(record.damagedQuantity || 0)), 0);
        const availableQuantity = Math.max(0, currentQuantity - blockedByPendingReturn);

        return {
          id: fabric._id,
          sku: fabric.sku,
          title: fabric.title,
          color: fabric.color,
          imageUrl: fabric.imageUrl,

          originalQuantity,
          quantityInMeter: originalQuantity,

          currentQuantity: availableQuantity,
          actualStock: availableQuantity,
          usedInMemos,

          createdAt: fabric.createdAt,
        };
      }),
    );
  }

  public async searchFabrics(searchTerm: string): Promise<Fabric[]> {
    const searchPattern = `%${searchTerm.toLowerCase()}%`;

    return this.fabricRepository
      .createQueryBuilder('fabric')
      .where('fabric.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('(LOWER(fabric.sku) LIKE :search OR LOWER(fabric.title) LIKE :search OR LOWER(fabric.color) LIKE :search)', { search: searchPattern })
      .orderBy('fabric.createdAt', 'DESC')
      .getMany();
  }

  public async getFabrics(): Promise<Fabric[]> {
    return this.fabricRepository.find({ where: { isDeleted: false } });
  }

  public async getFabricBySKU(sku: string): Promise<FabricEntity> {
    const fabric = await this.fabricRepository.findOne({
      where: { sku, isDeleted: false },
    });

    if (!fabric) {
      throw new HttpException(404, `Fabric not found for SKU ${sku}`);
    }

    return fabric;
  }

  public async getAvailableFabrics(): Promise<any[]> {
    const fabrics = await this.fabricRepository.find({
      where: { isDeleted: false },
    });

    return fabrics.map(fabric => ({
      id: fabric._id,
      sku: fabric.sku,
      title: fabric.title,
      color: fabric.color,
      imageUrl: fabric.imageUrl,
      quantity: Number(fabric.quantity),
      actualStock: Number(fabric.quantity),
      createdAt: fabric.createdAt,
    }));
  }

  public async getFabricsWithOriginalQuantity(): Promise<any[]> {
    const fabrics = await this.fabricRepository.find({
      where: { isDeleted: false },
    });

    return Promise.all(
      fabrics.map(async fabric => {
        const currentQuantity = Number(fabric.quantity);

        const deductTransactions = await this.transactionHistoryRepository.find({
          where: {
            fabricSKU: fabric.sku,
            transactionType: 'DEDUCT',
          },
        });

        const usedInMemos = deductTransactions.reduce((sum, tx) => sum + Number(tx.quantityChanged || 0), 0);

        const originalQuantity = currentQuantity + usedInMemos;

        // Subtract standalone pending returns — same logic as DeliveryMemoService.getFabricSKUWithQuantity()
        const standaloneDamageRecords = await this.damageRepository.find({
          where: {
            fabricSKU: fabric.sku,
            deliveryMemoItemId: IsNull(),
          },
        });
        const blockedByPendingReturn = standaloneDamageRecords
          .filter(record => record.action === 'RETURN' && record.status === 'RETURN')
          .reduce((sum, record) => sum + parseFloat(String(record.damagedQuantity || 0)), 0);

        console.log('FABRIC REPORT DEBUG', {
          sku: fabric.sku,
          currentQuantity,
          blockedByPendingReturn,
          calculated: currentQuantity - blockedByPendingReturn,
        });

        // const availableQuantity = Math.max(0, currentQuantity - blockedByPendingReturn);
        const availableQuantity = currentQuantity;

        return {
          id: fabric._id,
          sku: fabric.sku,
          title: fabric.title,
          color: fabric.color,
          imageUrl: fabric.imageUrl,

          originalQuantity,
          quantityInMeter: originalQuantity,

          currentQuantity: availableQuantity,
          actualStock: availableQuantity,
          usedInMemos,

          createdAt: fabric.createdAt,
        };
      }),
    );
  }

  public async deductFabricQuantity(
    sku: string,
    quantityToDeduct: number,
    deliveryMemoId?: string,
    deliveryMemoItemId?: string,
    performedBy?: string,
    metadata?: Record<string, any>,
  ): Promise<FabricEntity> {
    const fabric = await this.getFabricBySKU(sku);

    const currentQuantity = Number(fabric.quantity);
    if (currentQuantity < quantityToDeduct) {
      throw new HttpException(400, `Insufficient stock for SKU ${sku}. Available: ${currentQuantity}`);
    }

    const newQuantity = currentQuantity - quantityToDeduct;

    await this.fabricRepository.update({ _id: fabric._id }, { quantity: newQuantity });

    await this.transactionHistoryRepository.save({
      fabricSKU: sku,
      transactionType: 'DEDUCT',
      quantityChanged: quantityToDeduct,
      previousQuantity: currentQuantity,
      newQuantity,
      deliveryMemoId,
      deliveryMemoItemId,
      performedBy,
      metadata,
      notes: 'Deducted for delivery memo',
    });

    return this.fabricRepository.findOne({
      where: { _id: fabric._id },
    });
  }

  public async updateFabricQuantity(fabricId: string, quantityData: UpdateFabricQuantityDto): Promise<any> {
    const { operation, quantity, performedBy, notes } = quantityData;

    const fabric = await this.fabricRepository.findOne({
      where: { _id: fabricId, isDeleted: false },
    });

    if (!fabric) {
      throw new HttpException(404, 'Fabric not found');
    }

    if (operation === 'DAMAGE') {
      throw new HttpException(400, 'DAMAGE is not allowed from this API');
    }

    if (operation !== 'ADD' && operation !== 'RETURN') {
      throw new HttpException(400, 'Invalid operation');
    }

    const currentQuantity = Number(fabric.quantity);

    if (operation === 'RETURN' && quantity > currentQuantity) {
      throw new HttpException(400, 'Insufficient stock');
    }

    const newQuantity = operation === 'ADD' ? currentQuantity + quantity : currentQuantity - quantity;

    await this.fabricRepository.update({ _id: fabricId }, { quantity: newQuantity });

    const transaction = await this.transactionHistoryRepository.save({
      fabricSKU: fabric.sku,
      transactionType: operation,
      quantityChanged: quantity,
      previousQuantity: currentQuantity,
      newQuantity,
      performedBy,
      notes,
    });

    return {
      fabric: {
        ...fabric,
        quantity: newQuantity,
        currentQuantity: newQuantity,
      },
      transaction,
    };
  }

  // =====================================
  // DAMAGE (<6m) OR RETURN (>=6m) - DIRECT
  // =====================================

  public async markFabricDamage(data: { fabricSKU: string; damagedQuantity: number; notes?: string; performedBy?: string }): Promise<any> {
    const { fabricSKU, damagedQuantity, notes, performedBy } = data;

    const fabric = await this.getFabricBySKU(fabricSKU);
    const currentQuantity = Number(fabric.quantity);

    if (damagedQuantity > currentQuantity) {
      throw new HttpException(400, `Insufficient stock. Available: ${currentQuantity}m`);
    }

    const newQuantity = currentQuantity - damagedQuantity;

    const action: 'DAMAGE' | 'RETURN' = damagedQuantity < 6 ? 'DAMAGE' : 'RETURN';
    const status: 'DAMAGED' | 'RETURN' = action === 'DAMAGE' ? 'DAMAGED' : 'RETURN';

    return DBDataSource.transaction(async manager => {
      const fabricRepo = manager.getRepository(FabricEntity);
      const damageRepo = manager.getRepository(FabricDamageEntity);
      const historyRepo = manager.getRepository(FabricTransactionHistoryEntity);

      await fabricRepo.update({ _id: fabric._id }, { quantity: newQuantity });

      const damageRecord = damageRepo.create({
        fabricSKU,
        damagedQuantity,
        action,
        status,
        performedBy,
        notes: notes || '',
        metadata: {
          previousStock: currentQuantity,
          remainingStock: newQuantity,
          threshold: 6,
          fabricTitle: fabric.title || '',
          fabricColor: fabric.color || '',
          imageUrl: fabric.imageUrl || '',
        },
      });

      await damageRepo.save(damageRecord);

      const transaction = historyRepo.create({
        fabricSKU,
        transactionType: action,
        quantityChanged: damagedQuantity,
        previousQuantity: currentQuantity,
        newQuantity,
        performedBy,
        notes: notes || '',
        metadata: {
          damageRecordId: damageRecord._id,
          action,
          status,
          fabricTitle: fabric.title || '',
          fabricColor: fabric.color || '',
          imageUrl: fabric.imageUrl || '',
        },
      });

      await historyRepo.save(transaction);

      return {
        fabricSKU,
        action,
        status,
        damagedQuantity,
        previousQuantity: currentQuantity,
        newQuantity,
        damageRecord,
        transaction,
      };
    });
  }

  public async updateFabric(id: string, fabricData: Partial<CreateFabricDto>, imageUrl?: string): Promise<Fabric> {
    const fabric = await this.fabricRepository.findOne({
      where: { _id: id, isDeleted: false },
    });

    if (!fabric) throw new HttpException(404, 'Fabric not found');

    const { quantity, ...safeData } = fabricData as any;
    const updateData: any = { ...safeData };

    if (imageUrl) updateData.imageUrl = imageUrl;

    await this.fabricRepository.update({ _id: id }, updateData);

    return this.fabricRepository.findOne({ where: { _id: id } });
  }

  public async getFabricTransactionHistory(sku: string): Promise<any[]> {
    return this.transactionHistoryRepository.find({
      where: { fabricSKU: sku },
      order: { createdAt: 'DESC' },
    });
  }

  public async getAllTransactionHistory(): Promise<any[]> {
    return this.transactionHistoryRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  private async enrichWithUserNames(records: any[]): Promise<any[]> {
    const userIds = new Set<string>();
    records.forEach(record => {
      if (record.performedBy) userIds.add(record.performedBy);

      if (record.metadata?.transactions) {
        record.metadata.transactions.forEach((tx: any) => {
          if (tx.performedBy) userIds.add(tx.performedBy);
        });
      }
    });

    if (userIds.size === 0) {
      return records;
    }

    const users = await this.userRepository.findByIds(Array.from(userIds));
    const userMap = new Map(users.map(u => [u._id, `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email]));

    return records.map(record => {
      const enrichedRecord = { ...record };

      if (record.performedBy && userMap.has(record.performedBy)) {
        enrichedRecord.performedByName = userMap.get(record.performedBy);
      }

      if (record.metadata?.transactions) {
        enrichedRecord.metadata = {
          ...record.metadata,
          transactions: record.metadata.transactions.map((tx: any) => ({
            ...tx,
            performedByName: tx.performedBy && userMap.has(tx.performedBy) ? userMap.get(tx.performedBy) : null,
          })),
        };
      }

      return enrichedRecord;
    });
  }

  public async getFabricDamageReports(filters: {
    startDate?: string;
    endDate?: string;
    action?: 'DAMAGE' | 'RETURN';
    status?: 'DAMAGED' | 'RETURN';
    search?: string;
    groupBy?: 'fabric' | 'transaction';
  }): Promise<any> {
    const damageQueryBuilder = this.damageRepository.createQueryBuilder('damage').orderBy('damage.createdAt', 'DESC');

    if (filters.startDate) {
      damageQueryBuilder.andWhere('damage.createdAt >= :startDate', {
        startDate: new Date(filters.startDate),
      });
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      damageQueryBuilder.andWhere('damage.createdAt <= :endDate', { endDate });
    }

    if (filters.action) {
      damageQueryBuilder.andWhere('damage.action = :action', { action: filters.action });
    }

    if (filters.status) {
      damageQueryBuilder.andWhere('damage.status = :status', { status: filters.status });
    }

    if (filters.search && filters.search.trim() !== '') {
      const searchTerm = filters.search.trim().toLowerCase();
      damageQueryBuilder.andWhere(
        `(
        LOWER(damage.fabricSKU) LIKE :search OR
        LOWER(damage.notes) LIKE :search OR
        LOWER(damage.metadata->>'fabricTitle') LIKE :search OR
        LOWER(damage.metadata->>'fabricColor') LIKE :search
      )`,
        { search: `%${searchTerm}%` },
      );
    }

    const damageRecords = await damageQueryBuilder.getMany();

    const transactionQueryBuilder = this.transactionHistoryRepository
      .createQueryBuilder('transaction')
      .where('transaction.transactionType IN (:...types)', { types: ['DAMAGE', 'RETURN'] })
      .orderBy('transaction.createdAt', 'DESC');

    if (filters.startDate) {
      transactionQueryBuilder.andWhere('transaction.createdAt >= :startDate', {
        startDate: new Date(filters.startDate),
      });
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      transactionQueryBuilder.andWhere('transaction.createdAt <= :endDate', { endDate });
    }

    if (filters.action) {
      transactionQueryBuilder.andWhere('transaction.transactionType = :type', { type: filters.action });
    }

    if (filters.search && filters.search.trim() !== '') {
      const searchTerm = filters.search.trim().toLowerCase();
      transactionQueryBuilder.andWhere(
        `(
        LOWER(transaction.fabricSKU) LIKE :search OR
        LOWER(transaction.notes) LIKE :search OR
        LOWER(transaction.metadata->>'fabricTitle') LIKE :search OR
        LOWER(transaction.metadata->>'fabricColor') LIKE :search
      )`,
        { search: `%${searchTerm}%` },
      );
    }

    const transactionRecords = await transactionQueryBuilder.getMany();

    const damageRecordIds = new Set(damageRecords.map(d => d.metadata?.damageRecordId).filter(id => id != null));

    const uniqueTransactionRecords = transactionRecords.filter(tx => {
      const txDamageId = tx.metadata?.damageRecordId;
      if (txDamageId && damageRecordIds.has(txDamageId)) return false;

      const isDuplicate = damageRecords.some(
        d =>
          d.fabricSKU === tx.fabricSKU &&
          Math.abs(Number(d.damagedQuantity) - Number(tx.quantityChanged)) < 0.01 &&
          Math.abs(new Date(d.createdAt).getTime() - new Date(tx.createdAt).getTime()) < 5000,
      );
      return !isDuplicate;
    });

    const convertedTransactionRecords = uniqueTransactionRecords.map(tx => {
      const action = tx.transactionType === 'DAMAGE' ? 'DAMAGE' : 'RETURN';
      const status = action === 'DAMAGE' ? 'DAMAGED' : 'RETURN';

      return {
        _id: tx._id,
        fabricSKU: tx.fabricSKU,
        deliveryMemoId: tx.deliveryMemoId,
        deliveryMemoItemId: tx.deliveryMemoItemId,
        damagedQuantity: tx.quantityChanged,
        action,
        status,
        performedBy: tx.performedBy,
        notes: tx.notes,
        metadata: tx.metadata || {},
        createdAt: tx.createdAt,
        updatedAt: tx.createdAt,
      };
    });

    const allRecords = [...damageRecords, ...convertedTransactionRecords];
    allRecords.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    let finalRecords = allRecords;

    if (filters.groupBy !== 'transaction') {
      const groupedMap = new Map<string, any>();

      allRecords.forEach(record => {
        const key = record.fabricSKU;

        if (!groupedMap.has(key)) {
          groupedMap.set(key, {
            _id: record._id,
            fabricSKU: record.fabricSKU,
            deliveryMemoId: record.deliveryMemoId,
            deliveryMemoItemId: record.deliveryMemoItemId,
            damagedQuantity: Number(record.damagedQuantity),
            action: 'MIXED',
            status: 'MIXED',
            performedBy: record.performedBy,
            notes: record.notes,
            metadata: {
              fabricTitle: record.metadata?.fabricTitle || '',
              fabricColor: record.metadata?.fabricColor || '',
              imageUrl: record.metadata?.imageUrl || '',
              transactions: [
                {
                  _id: record._id,
                  fabricSKU: record.fabricSKU,
                  damagedQuantity: record.damagedQuantity,
                  action: record.action,
                  status: record.status,
                  performedBy: record.performedBy,
                  notes: record.notes,
                  createdAt: record.createdAt,
                  updatedAt: record.updatedAt,
                },
              ],
              damageCount: record.action === 'DAMAGE' ? 1 : 0,
              returnCount: record.action === 'RETURN' ? 1 : 0,
              totalDamageQty: record.action === 'DAMAGE' ? Number(record.damagedQuantity) : 0,
              totalReturnQty: record.action === 'RETURN' ? Number(record.damagedQuantity) : 0,
            },
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
            transactionCount: 1,
            totalQuantity: Number(record.damagedQuantity),
            latestDate: record.createdAt,
            oldestDate: record.createdAt,
          });
        } else {
          const existing = groupedMap.get(key) as any;
          existing.transactionCount += 1;
          existing.totalQuantity += Number(record.damagedQuantity);

          if (record.action === 'DAMAGE') {
            existing.metadata.damageCount += 1;
            existing.metadata.totalDamageQty += Number(record.damagedQuantity);
          } else {
            existing.metadata.returnCount += 1;
            existing.metadata.totalReturnQty += Number(record.damagedQuantity);
          }

          existing.metadata.transactions.push({
            _id: record._id,
            fabricSKU: record.fabricSKU,
            damagedQuantity: record.damagedQuantity,
            action: record.action,
            status: record.status,
            performedBy: record.performedBy,
            notes: record.notes,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
          });

          const recordDate = new Date(record.createdAt);
          const existingLatest = new Date(existing.latestDate);
          if (recordDate > existingLatest) {
            existing.latestDate = record.createdAt;
            existing.createdAt = record.createdAt;
          }

          const existingOldest = new Date(existing.oldestDate);
          if (recordDate < existingOldest) {
            existing.oldestDate = record.createdAt;
          }
        }
      });

      finalRecords = Array.from(groupedMap.values());

      finalRecords.sort((a: any, b: any) => {
        const dateA = new Date(a.latestDate).getTime();
        const dateB = new Date(b.latestDate).getTime();
        return dateB - dateA;
      });

      const sampleGrouped = finalRecords.find((r: any) => (r as any).transactionCount > 1);
      if (sampleGrouped) {
        console.log('Sample grouped record with multiple transactions:', {
          fabricSKU: sampleGrouped.fabricSKU,
          transactionCount: (sampleGrouped as any).transactionCount,
          totalQuantity: (sampleGrouped as any).totalQuantity,
          damageCount: sampleGrouped.metadata?.damageCount,
          returnCount: sampleGrouped.metadata?.returnCount,
          transactionsArrayLength: sampleGrouped.metadata?.transactions?.length,
        });
      }
    }

    const totalDamaged = allRecords.filter(r => r.action === 'DAMAGE').reduce((sum, r) => sum + Number(r.damagedQuantity || 0), 0);
    const totalReturned = allRecords.filter(r => r.action === 'RETURN').reduce((sum, r) => sum + Number(r.damagedQuantity || 0), 0);
    

    console.log('Summary:', {
      totalRecords: finalRecords.length,
      originalRecords: allRecords.length,
      totalDamaged,
      totalReturned,
    });

    const enrichedRecords = await this.enrichWithUserNames(finalRecords);

    return {
      records: enrichedRecords,
      summary: {
        totalRecords: finalRecords.length,
        totalTransactions: allRecords.length,
        totalDamaged,
        totalReturned,
      },
    };
  }

  public async createFabricShirtMappingsBulk(data: BulkCreateFabricShirtMappingDto): Promise<{ created: string[]; skipped: string[] }> {
    if (!data.shirtSKUs || data.shirtSKUs.length === 0) {
      throw new HttpException(400, 'shirtSKUs array is empty');
    }

    const fabricExists = await this.fabricRepository.findOne({
      where: { sku: data.fabricSKU, isDeleted: false },
    });
    if (!fabricExists) {
      throw new HttpException(404, `Fabric with SKU ${data.fabricSKU} not found`);
    }

    const created: string[] = [];
    const skipped: string[] = [];

    for (const shirtSKU of data.shirtSKUs) {
      const alreadyExists = await this.fabricShirtMappingRepository.findOne({
        where: { fabricSKU: data.fabricSKU, shirtSKU },
      });

      if (alreadyExists) {
        skipped.push(shirtSKU);
        continue;
      }

      await this.fabricShirtMappingRepository.save(
        this.fabricShirtMappingRepository.create({
          fabricSKU: data.fabricSKU,
          shirtSKU,
          notes: data.notes,
        }),
      );
      created.push(shirtSKU);
    }

    return { created, skipped };
  }

  public async createFabricShirtMapping(mappingData: CreateFabricShirtMappingDto): Promise<FabricShirtMappingEntity> {
    if (isEmpty(mappingData)) {
      throw new HttpException(400, 'Mapping data is empty');
    }

    const fabricExists = await this.fabricRepository.findOne({
      where: { sku: mappingData.fabricSKU, isDeleted: false },
    });

    if (!fabricExists) {
      throw new HttpException(404, `Fabric with SKU ${mappingData.fabricSKU} not found`);
    }

    const existingMapping = await this.fabricShirtMappingRepository.findOne({
      where: {
        fabricSKU: mappingData.fabricSKU,
        shirtSKU: mappingData.shirtSKU,
      },
    });

    if (existingMapping) {
      throw new HttpException(409, `Mapping already exists between Fabric SKU ${mappingData.fabricSKU} and Shirt SKU ${mappingData.shirtSKU}`);
    }

    const mapping = this.fabricShirtMappingRepository.create(mappingData);
    return await this.fabricShirtMappingRepository.save(mapping);
  }

  public async getFabricShirtMappings(filters?: GetFabricShirtMappingsDto): Promise<FabricShirtMappingEntity[]> {
    const queryBuilder = this.fabricShirtMappingRepository
      .createQueryBuilder('mapping')
      .leftJoinAndSelect('mapping.fabric', 'fabric')
      .orderBy('mapping.createdAt', 'DESC');

    if (filters?.fabricSKU) {
      queryBuilder.andWhere('mapping.fabricSKU = :fabricSKU', { fabricSKU: filters.fabricSKU });
    }

    if (filters?.shirtSKU) {
      queryBuilder.andWhere('mapping.shirtSKU = :shirtSKU', { shirtSKU: filters.shirtSKU });
    }

    return await queryBuilder.getMany();
  }

  public async getFabricShirtMappingById(id: string): Promise<FabricShirtMappingEntity> {
    const mapping = await this.fabricShirtMappingRepository.findOne({
      where: { _id: id },
      relations: ['fabric'],
    });

    if (!mapping) {
      throw new HttpException(404, `Mapping with ID ${id} not found`);
    }

    return mapping;
  }

  public async getShirtSKUsByFabricSKU(fabricSKU: string): Promise<string[]> {
    const mappings = await this.fabricShirtMappingRepository.find({
      where: { fabricSKU },
      select: ['shirtSKU'],
    });

    return mappings.map(m => m.shirtSKU);
  }

  public async getFabricSKUsByShirtSKU(shirtSKU: string): Promise<string[]> {
    const mappings = await this.fabricShirtMappingRepository.find({
      where: { shirtSKU },
      select: ['fabricSKU'],
    });

    return mappings.map(m => m.fabricSKU);
  }

  /**
   * Update a fabric-shirt mapping
   */
  public async updateFabricShirtMapping(id: string, updateData: UpdateFabricShirtMappingDto): Promise<FabricShirtMappingEntity> {
    const mapping = await this.getFabricShirtMappingById(id);

    if (updateData.shirtSKU && updateData.shirtSKU !== mapping.shirtSKU) {
      const existingMapping = await this.fabricShirtMappingRepository.findOne({
        where: {
          fabricSKU: mapping.fabricSKU,
          shirtSKU: updateData.shirtSKU,
        },
      });

      if (existingMapping) {
        throw new HttpException(409, `Mapping already exists between Fabric SKU ${mapping.fabricSKU} and Shirt SKU ${updateData.shirtSKU}`);
      }
    }

    await this.fabricShirtMappingRepository.update({ _id: id }, updateData);

    return await this.getFabricShirtMappingById(id);
  }

  /**
   * Delete a fabric-shirt mapping
   */
  public async deleteFabricShirtMapping(id: string): Promise<{ message: string }> {
    const mapping = await this.getFabricShirtMappingById(id);

    await this.fabricShirtMappingRepository.delete({ _id: id });

    return {
      message: `Mapping between Fabric SKU ${mapping.fabricSKU} and Shirt SKU ${mapping.shirtSKU} deleted successfully`,
    };
  }

  /**
   * Get mappings with fabric details
   */
  public async getFabricShirtMappingsWithDetails(): Promise<any[]> {
    const mappings = await this.fabricShirtMappingRepository.find({
      relations: ['fabric'],
      order: { createdAt: 'DESC' },
    });

    return mappings.map(mapping => ({
      id: mapping._id,
      fabricSKU: mapping.fabricSKU,
      shirtSKU: mapping.shirtSKU,
      notes: mapping.notes,
      fabricDetails: mapping.fabric
        ? {
            title: mapping.fabric.title,
            color: mapping.fabric.color,
            imageUrl: mapping.fabric.imageUrl,
            quantity: mapping.fabric.quantity,
          }
        : null,
      createdAt: mapping.createdAt,
      updatedAt: mapping.updatedAt,
    }));
  }
}
export default FabricService;
