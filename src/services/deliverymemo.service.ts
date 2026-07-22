// src/services/deliverymemo.service.ts
import { DBDataSource } from '@/databases';
import { DeliveryMemo, DeliveryMemoEntity } from '@/entities/deliverymemo.entity';
import { DeliveryMemoItemEntity } from '@/entities/deliveryMemoItem.entity';
import { DeliveryMemoItemDamageEntity } from '@/entities/DeliveryMemoItemDamage.entity';
import { DeliveryMemoStageHistoryEntity } from '@/entities/deliveryMemoStageHistory.entity';
import { FabricEntity } from '@/entities/fabric.entity';
import { FabricDamageEntity } from '@/entities/fabricDamage.entity';
import { FabricService } from '@/services/fabric.service';
import { CreateDeliveryMemoDto, UpdateDeliveryMemoDto } from '@dtos/deliverymemo.dto';
import { HttpException } from '@exceptions/HttpException';
import { FabricTransactionHistoryEntity } from '@/entities/fabricTransitionHistory';
import { isEmpty } from '@utils/util';
import { generateUniqueDmNumber } from '@/utils/deliveryMemo.util';
import DeliveryMemoStageHistoryService from './deliveryMemoStageHistory.service';
import { In, IsNull } from 'typeorm';
import { PreStitcherAssignmentEntity, PreStitcherAssignmentStatus } from '@/entities/preStitcher.entity';
import { PreStitcherPartialCompletionEntity } from '@/entities/preStitcherPartialCompletion.entity';
import { PreStitchOptionsEntity } from '@/entities/prestitchOptions.entity';
import { TailorAssignmentStatus } from '@/constants/tailorStatus.enum';
import { KanchButtonAssignmentStatus } from '@/constants/KanchButtonStatus.enum';

class DeliveryMemoService {
  public deliveryMemos = DBDataSource.getRepository(DeliveryMemoEntity);
  public deliveryMemoItems = DBDataSource.getRepository(DeliveryMemoItemEntity);
  public fabricEntity = DBDataSource.getRepository(FabricEntity);
  public stageHistoryRepo = DBDataSource.getRepository(DeliveryMemoStageHistoryEntity);
  public damageRepository = DBDataSource.getRepository(FabricDamageEntity);

  public FabricService = new FabricService();
  public stageHistoryService = new DeliveryMemoStageHistoryService();

  public async getMemosByStage(stage: string): Promise<any[]> {
    try {
      console.log(`[DELIVERY MEMO SERVICE] Fetching memos for stage: ${stage}`);

      const query = this.deliveryMemos
        .createQueryBuilder('memo')
        .leftJoinAndSelect('memo.items', 'items')
        .leftJoinAndSelect('memo.stageHistory', 'stageHistory')
        .where('memo.stage = :stage', { stage });

      if (stage === 'ASSIGN_PRE_STITCHER') {
        query.andWhere('memo.assignedPreStitcherId IS NULL');
      }

      if (stage === 'PRE_STITCHER_ASSIGNED') {
        query.andWhere('memo.assignedPreStitcherId IS NOT NULL');
      }

      const memos = await query.orderBy('memo.createdAt', 'DESC').addOrderBy('stageHistory.enteredAt', 'DESC').getMany();

      const assignmentRepo = this.deliveryMemos.manager.getRepository(PreStitcherAssignmentEntity);
      const partialRepo = this.deliveryMemos.manager.getRepository(PreStitcherPartialCompletionEntity);

      const enrichedMemos = await Promise.all(
        memos.map(async memo => {
          let assignments: any[] = [];
          try {
            const memoAssignments = await assignmentRepo.find({
              where: {
                deliveryMemoId: memo._id,
                status: In(['ASSIGNED', 'IN_PROGRESS', 'COMPLETED']),
              },
              relations: ['preStitcher'],
              order: { createdAt: 'DESC' },
            });

            assignments = await Promise.all(
              memoAssignments.map(async assignment => {
                const partials = await partialRepo.find({
                  where: { assignmentId: assignment._id },
                  order: { createdAt: 'DESC' },
                });

                const progressEntries = partials.map(p => ({
                  notes: p.notes,
                  timestamp: p.createdAt,
                  completedQuantity: p.totalShirtsHandedOver,
                  performedBy: p.preStitcherId,
                }));

                return {
                  _id: assignment._id,
                  preStitcherId: assignment.preStitcherId,
                  preStitcherName: assignment.preStitcher ? `${assignment.preStitcher.firstName} ${assignment.preStitcher.lastName}` : 'Unknown',
                  preStitcherEmail: assignment.preStitcher?.email || null,
                  assignedOptions: assignment.assignedOptions || [],
                  optionProgress: assignment.optionProgress || [],
                  status: assignment.status,
                  completedQuantity: assignment.completedQuantity || 0,
                  createdAt: assignment.createdAt,
                  completedAt: assignment.completedAt,
                  progressEntries: progressEntries,
                };
              }),
            );
          } catch (err) {
            console.error(`Error fetching assignments for memo ${memo._id}:`, err);
          }

          const enrichedItems = await Promise.all(
            (memo.items || []).map(async item => {
              try {
                const fabric = await this.FabricService.getFabricBySKU(item.fabricSKU);
                return {
                  _id: item._id,
                  fabricSKU: item.fabricSKU,
                  dhap: item.dhap,
                  fold: item.fold,
                  totalDhapFold: item.totalDhapFold,
                  damagedQuantity: item.damagedQuantity || 0,
                  returnedQuantity: item.returnedQuantity || 0,
                  shirtSKUs: item.shirtSKUs || [],
                  shirtQuantity: item.shirtQuantity || null,
                  fabricTitle: fabric.title,
                  fabricColor: fabric.color,
                  imageUrl: fabric.imageUrl,
                  createdAt: item.createdAt,
                  updatedAt: item.updatedAt,
                };
              } catch (error) {
                console.error(`Error fetching fabric for SKU ${item.fabricSKU}:`, error);
                return {
                  _id: item._id,
                  fabricSKU: item.fabricSKU,
                  dhap: item.dhap,
                  fold: item.fold,
                  totalDhapFold: item.totalDhapFold,
                  damagedQuantity: item.damagedQuantity || 0,
                  returnedQuantity: item.returnedQuantity || 0,
                  shirtSKUs: item.shirtSKUs || [],
                  shirtQuantity: item.shirtQuantity || null,
                  fabricTitle: 'Unknown',
                  fabricColor: 'Unknown',
                  imageUrl: null,
                  createdAt: item.createdAt,
                  updatedAt: item.updatedAt,
                };
              }
            }),
          );

          const sortedHistory = memo.stageHistory?.sort((a, b) => {
            return new Date(b.enteredAt).getTime() - new Date(a.enteredAt).getTime();
          });

          return {
            deliveryMemoId: memo._id,
            stage: memo.stage,
            createdAt: memo.createdAt,
            updatedAt: memo.updatedAt,
            createdBy: memo.createdBy,
            dmNumber: memo.dmNumber,
            totalDhapFold: memo.totalDhapFold,
            assignedPreStitcherId: memo.assignedPreStitcherId,
            items: enrichedItems,
            itemCount: enrichedItems.length,
            stageHistory: sortedHistory,
            assignments: assignments,
          };
        }),
      );

      return enrichedMemos;
    } catch (error) {
      console.error('Error in getMemosByStage:', error);
      throw error;
    }
  }

  public async findAllDeliveryMemos(stage?: string): Promise<any[]> {
    const where = stage ? { stage } : {};

    const memos = await this.deliveryMemos.find({
      where,
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });

    const fabricRepo = DBDataSource.getRepository(FabricEntity);

    return Promise.all(
      memos.map(async memo => {
        const itemsWithDetails = await Promise.all(
          memo.items.map(async item => {
            const fabric = await fabricRepo.findOne({
              where: { sku: item.fabricSKU, isDeleted: false },
            });

            return {
              _id: item._id,
              fabricSKU: item.fabricSKU,
              dhap: item.dhap,
              fold: item.fold,
              imageUrl: fabric?.imageUrl || null,
              fabricTitle: fabric?.title || null,
              fabricColor: fabric?.color || null,
            };
          }),
        );

        return {
          deliveryMemoId: memo._id,
          stage: memo.stage,
          createdAt: memo.createdAt,
          updatedAt: memo.updatedAt,
          dmNumber: memo.dmNumber,
          items: itemsWithDetails,
          itemCount: itemsWithDetails.length,
        };
      }),
    );
  }

  public async findDeliveryMemoById(memoId: string): Promise<any> {
    const memo = await this.deliveryMemos.findOne({
      where: { _id: memoId },
      relations: ['items', 'stageHistory'],
    });

    if (!memo) throw new HttpException(404, 'Delivery memo not found');

    const fabricRepo = DBDataSource.getRepository(FabricEntity);

    const assignmentRepo = DBDataSource.getRepository(PreStitcherAssignmentEntity);
    const optionsRepo = DBDataSource.getRepository(PreStitchOptionsEntity);

    let options = null;
    const assignment = await assignmentRepo.findOne({
      where: { deliveryMemoId: memoId },
      order: { createdAt: 'DESC' },
    });

    if (assignment) {
      options = await optionsRepo.findOne({
        where: { assignmentId: assignment._id },
      });
    }

    const itemsWithImages = await Promise.all(
      memo.items.map(async item => {
        const fabric = await fabricRepo.findOne({
          where: { sku: item.fabricSKU, isDeleted: false },
        });

        return {
          _id: item._id,
          fabricSKU: item.fabricSKU,
          dhap: item.dhap,
          fold: item.fold,
          totalDhapFold: item.totalDhapFold,
          imageUrl: fabric?.imageUrl || null,
          fabricTitle: fabric?.title || null,
          fabricColor: fabric?.color || null,
          shirtSKUs: item.shirtSKUs || [],
          shirtQuantity: item.shirtQuantity || null,
        };
      }),
    );

    return {
      deliveryMemoId: memo._id,
      stage: memo.stage,
      createdAt: memo.createdAt,
      updatedAt: memo.updatedAt,
      dmNumber: memo.dmNumber,
      items: itemsWithImages,
      itemCount: itemsWithImages.length,
      stageHistory: memo.stageHistory,
      options: options
        ? {
            label: options.label ?? false,
            flacket: options.flacket ?? false,
            covering: options.covering ?? false,
            pocket: options.pocket ?? false,
            shoulder: options.shoulder ?? false,
            chockPatti: options.chockPatti ?? false,
          }
        : null,
    };
  }

  public async getFabricSKUWithQuantity(): Promise<
    Array<{
      sku: string;
      quantity: number;
      title: string;
      color: string;
    }>
  > {
    const fabrics = await this.FabricService.getAvailableFabrics();

    const fabricsWithAvailable = await Promise.all(
      fabrics.map(async fabric => {
        const currentStock = parseFloat(String(fabric.quantity));

        const standaloneDamageRecords = await this.damageRepository.find({
          where: {
            fabricSKU: fabric.sku,
            deliveryMemoItemId: IsNull(),
          },
        });

        const blockedByPendingReturn = standaloneDamageRecords
          .filter(record => record.action === 'RETURN' && record.status === 'RETURN')
          .reduce((sum, record) => sum + parseFloat(String(record.damagedQuantity || 0)), 0);

        console.log('DM DROPDOWN DEBUG', {
          sku: fabric.sku,
          currentStock,
          blockedByPendingReturn,
          calculated: currentStock - blockedByPendingReturn,
        });

        // const availableForNewMemos = currentStock - blockedByPendingReturn;
        const availableForNewMemos = currentStock;

        return {
          sku: fabric.sku,
          quantity: availableForNewMemos,
          title: fabric.title || '',
          color: fabric.color || '',
        };
      }),
    );

    return fabricsWithAvailable.filter(f => f.quantity > 0);
  }

  public async createDeliveryMemo(memoData: CreateDeliveryMemoDto): Promise<any> {
    if (isEmpty(memoData) || isEmpty(memoData.memos)) {
      throw new HttpException(400, 'memoData is empty');
    }

    if (memoData.dmNumber) {
      const existingMemo = await this.deliveryMemos.findOne({ where: { dmNumber: memoData.dmNumber } });
      if (existingMemo) {
        throw new HttpException(400, `Delivery Memo with number ${memoData.dmNumber} already exists`);
      }
    }

    for (const memoItem of memoData.memos) {
      const fabric = await this.FabricService.getFabricBySKU(memoItem.fabricSKU);
      const dhapNum = parseFloat(String(memoItem.dhap || '0'));
      const foldNum = parseFloat(String(memoItem.fold || '0'));

      if (Number.isNaN(dhapNum) || dhapNum <= 0) {
        throw new HttpException(400, `Invalid dhap value for SKU ${memoItem.fabricSKU}`);
      }

      if (Number.isNaN(foldNum) || foldNum <= 0) {
        throw new HttpException(400, `Invalid fold value for SKU ${memoItem.fabricSKU}`);
      }

      //  total fabric (dhap × fold)
      const totalFabricNeeded = dhapNum * foldNum;
      const currentQuantity = parseFloat(String(fabric.quantity));

      if (currentQuantity < totalFabricNeeded) {
        throw new HttpException(
          400,
          `Insufficient quantity for SKU ${memoItem.fabricSKU}. Available: ${currentQuantity}m, Required: ${totalFabricNeeded}m (${dhapNum}m × ${foldNum} fold)`,
        );
      }
    }

    const createMemoData: DeliveryMemo = await this.deliveryMemos.save({
      createdBy: memoData.createdBy,
      stage: memoData.stage,
      dmNumber: memoData.dmNumber,
    });

    let memoTotalDhapFold = 0;

    const items = await Promise.all(
      memoData.memos.map(async memoItem => {
        const dhapNum = parseFloat(String(memoItem.dhap || '0'));
        const foldNum = parseFloat(String(memoItem.fold || '0'));
        const itemTotal = !Number.isNaN(dhapNum) && !Number.isNaN(foldNum) ? dhapNum * foldNum : 0;

        memoTotalDhapFold += itemTotal;

        const savedItem = await this.deliveryMemoItems.save({
          deliveryMemoId: createMemoData._id,
          fabricSKU: memoItem.fabricSKU,
          dhap: parseFloat(String(memoItem.dhap)),
          fold: parseInt(String(memoItem.fold)),
          totalDhapFold: itemTotal,
        } as any);

        await this.FabricService.deductFabricQuantity(memoItem.fabricSKU, itemTotal, createMemoData._id, (savedItem as any)._id, memoData.createdBy, {
          dhap: dhapNum,
          fold: foldNum,
          totalDhapFold: itemTotal,
          stage: memoData.stage,
        });

        return savedItem;
      }),
    );

    await this.deliveryMemos.update({ _id: createMemoData._id }, { totalDhapFold: memoTotalDhapFold });

    if (memoData.stage) {
      await this.stageHistoryService.createStageHistory({
        deliveryMemoId: createMemoData._id,
        stage: memoData.stage,
        performedBy: memoData.createdBy,
        metadata: {
          itemCount: items.length,
          items: items.map((i: any) => ({
            fabricSKU: i.fabricSKU,
            dhap: i.dhap,
            fold: i.fold,
            totalDhapFold: i.totalDhapFold,
          })),
          memoTotalDhapFold,
        },
      });
    }

    return {
      deliveryMemoId: createMemoData._id,
      stage: memoData.stage,
      createdAt: createMemoData.createdAt,
      updatedAt: createMemoData.updatedAt,
      dmNumber: memoData.dmNumber,
      totalDhapFold: memoTotalDhapFold,
      items,
      itemCount: items.length,
    };
  }

  public async updateDeliveryMemo(memoId: string, memoData: UpdateDeliveryMemoDto): Promise<DeliveryMemo> {
    if (isEmpty(memoData)) throw new HttpException(400, 'memoData is empty');

    return DBDataSource.transaction(async manager => {
      const memoRepo = manager.getRepository(DeliveryMemoEntity);
      const memoItemRepo = manager.getRepository(DeliveryMemoItemEntity);
      const fabricRepo = manager.getRepository(FabricEntity);
      const txRepo = manager.getRepository(FabricTransactionHistoryEntity);

      const memo = await memoRepo.findOne({
        where: { _id: memoId },
        relations: ['items'],
      });

      if (!memo) throw new HttpException(404, "Delivery memo doesn't exist");

      if (memo.stage !== 'CREATE_DELIVERY_MEMO') {
        throw new HttpException(400, "Only delivery memos in the 'Create Delivery Memo' stage can be edited.");
      }

      if (memoData.dmNumber !== undefined) {
        const trimmed = memoData.dmNumber.trim();
        if (trimmed === '') {
          throw new HttpException(400, 'DM Number cannot be empty');
        } else {
          const existingMemo = await memoRepo.findOne({ where: { dmNumber: trimmed } });
          if (existingMemo && existingMemo._id !== memoId) {
            throw new HttpException(400, `Delivery Memo with number ${trimmed} already exists`);
          }
          memo.dmNumber = trimmed;
        }
      }

      if (memoData.notes !== undefined) {
        memo.notes = memoData.notes;
      }

      if (memoData.memos) {
        // 1. Revert previous fabric stock deductions
        for (const oldItem of memo.items) {
          const fabric = await fabricRepo.findOne({ where: { sku: oldItem.fabricSKU, isDeleted: false } });
          if (fabric) {
            const currentQty = parseFloat(String(fabric.quantity));
            const restoredQty = parseFloat(String(oldItem.totalDhapFold || 0));
            const newQty = currentQty + restoredQty;
            await fabricRepo.update({ _id: fabric._id }, { quantity: newQty });

            // Log stock restoration
            await txRepo.save({
              fabricSKU: oldItem.fabricSKU,
              transactionType: 'ADD',
              quantityChanged: restoredQty,
              previousQuantity: currentQty,
              newQuantity: newQty,
              deliveryMemoId: memo._id,
              deliveryMemoItemId: oldItem._id,
              performedBy: memoData.createdBy || memo.createdBy,
              notes: 'Stock restored due to Delivery Memo update',
            } as any);
          }
        }

        // 2. Delete old delivery memo items
        await memoItemRepo.delete({ deliveryMemoId: memo._id });

        // 3. Validate new items stock and deduct quantity
        let newTotalDhapFold = 0;
        const newItems: DeliveryMemoItemEntity[] = [];

        for (const itemData of memoData.memos) {
          const fabric = await fabricRepo.findOne({ where: { sku: itemData.fabricSKU, isDeleted: false } });
          if (!fabric) {
            throw new HttpException(404, `Fabric not found for SKU ${itemData.fabricSKU}`);
          }

          const dhapNum = parseFloat(String(itemData.dhap || '0'));
          const foldNum = parseFloat(String(itemData.fold || '0'));

          if (Number.isNaN(dhapNum) || dhapNum <= 0) {
            throw new HttpException(400, `Invalid dhap value for SKU ${itemData.fabricSKU}`);
          }
          if (Number.isNaN(foldNum) || foldNum <= 0) {
            throw new HttpException(400, `Invalid fold value for SKU ${itemData.fabricSKU}`);
          }

          const totalFabricNeeded = dhapNum * foldNum;
          newTotalDhapFold += totalFabricNeeded;

          const currentQty = parseFloat(String(fabric.quantity));
          if (currentQty < totalFabricNeeded) {
            throw new HttpException(
              400,
              `Insufficient quantity for SKU ${itemData.fabricSKU}. Available: ${currentQty}m, Required: ${totalFabricNeeded}m (${dhapNum}m × ${foldNum} fold)`,
            );
          }

          // Deduct fabric quantity
          const newQty = currentQty - totalFabricNeeded;
          await fabricRepo.update({ _id: fabric._id }, { quantity: newQty });

          // Save new item
          const savedItem = await memoItemRepo.save({
            deliveryMemoId: memo._id,
            fabricSKU: itemData.fabricSKU,
            dhap: dhapNum,
            fold: foldNum,
            totalDhapFold: totalFabricNeeded,
          } as any);

          // Log transaction
          await txRepo.save({
            fabricSKU: itemData.fabricSKU,
            transactionType: 'DEDUCT',
            quantityChanged: totalFabricNeeded,
            previousQuantity: currentQty,
            newQuantity: newQty,
            deliveryMemoId: memo._id,
            deliveryMemoItemId: savedItem._id,
            performedBy: memoData.createdBy || memo.createdBy,
            notes: 'Deducted for delivery memo update',
          } as any);

          newItems.push(savedItem);
        }

        memo.totalDhapFold = newTotalDhapFold;
        memo.items = newItems;
      }

      await memoRepo.save(memo);

      await this.stageHistoryService.createStageHistory({
        deliveryMemoId: memo._id,
        stage: memo.stage,
        performedBy: memoData.createdBy || memo.createdBy,
        metadata: {
          action: 'UPDATE_DELIVERY_MEMO',
          dmNumber: memo.dmNumber,
          totalDhapFold: memo.totalDhapFold,
          notes: memo.notes,
          itemsCount: memo.items?.length || 0,
          items: memo.items?.map(i => ({
            fabricSKU: i.fabricSKU,
            dhap: i.dhap,
            fold: i.fold,
            totalDhapFold: i.totalDhapFold,
          })),
        },
      });

      return memo;
    });
  }

  public async getFabricSKU(): Promise<string[]> {
    const fabrics = await this.FabricService.getFabrics();
    return fabrics.map(f => f.sku);
  }

  public async deleteDeliveryMemo(memoId: string): Promise<DeliveryMemo> {
    const deletedMemo = await this.deliveryMemos
      .createQueryBuilder()
      .delete()
      .from(DeliveryMemoEntity)
      .where('_id = :id', { id: memoId })
      .returning('*')
      .execute()
      .then(res => res.raw[0]);

    if (!deletedMemo) throw new HttpException(404, "Delivery memo doesn't exist");

    return deletedMemo;
  }

  public async updateDeliveryMemoStage(
    memoId: string,
    stageData: {
      stage: string;
      performedBy?: string;
      metadata?: any;
      updateData?: any;
    },
  ): Promise<any> {
    const memo = await this.deliveryMemos.findOne({
      where: { _id: memoId },
      relations: ['items', 'stageHistory'],
    });

    if (!memo) {
      throw new HttpException(404, 'Delivery memo not found');
    }

    const updatePayload: any = {
      ...stageData.updateData,
      stage: stageData.stage,
    };

    if (stageData.stage === 'COMPLETED') {
      const { MemoStatus } = require('@/constants/MemoStatus.enum');
      updatePayload.status = MemoStatus.CLOSED;
      updatePayload.closedAt = new Date();
      updatePayload.closedBy = stageData.performedBy || 'SYSTEM';
    }

    await this.deliveryMemos.createQueryBuilder().update(DeliveryMemoEntity).set(updatePayload).where('_id = :id', { id: memoId }).execute();

    const sortedHistory = memo.stageHistory?.sort((a, b) => new Date(b.enteredAt).getTime() - new Date(a.enteredAt).getTime());
    const previousStage = sortedHistory && sortedHistory.length > 0 ? sortedHistory[0].stage : null;

    let historyMetadata: any = {
      itemCount: memo.items?.length || 0,
      previousStage: previousStage,
    };

    switch (stageData.stage) {
      case 'CREATE_DELIVERY_MEMO':
        historyMetadata = {
          ...historyMetadata,
          items:
            memo.items?.map(item => ({
              fabricSKU: item.fabricSKU,
              dhap: item.dhap,
              fold: item.fold,
              totalDhapFold: item.totalDhapFold,
            })) || [],
          memoTotalDhapFold: memo.totalDhapFold,
        };
        break;

      case 'CUTTING':
        const itemsWithFabricDetails = await Promise.all(
          (memo.items || []).map(async item => {
            try {
              const fabric = await this.FabricService.getFabricBySKU(item.fabricSKU);
              return {
                _id: item._id,
                fabricSKU: item.fabricSKU,
                fabricTitle: fabric.title,
                fabricColor: fabric.color,
                dhap: item.dhap,
                fold: item.fold,
                totalDhapFold: item.totalDhapFold,
              };
            } catch (error) {
              return {
                _id: item._id,
                fabricSKU: item.fabricSKU,
                fabricTitle: 'Unknown',
                fabricColor: 'Unknown',
                dhap: item.dhap,
                fold: item.fold,
                totalDhapFold: item.totalDhapFold,
              };
            }
          }),
        );

        historyMetadata = {
          ...historyMetadata,
          items: itemsWithFabricDetails,
          totalDhapFold: memo.totalDhapFold,
          cuttingStarted: new Date().toISOString(),
        };
        break;

      case 'ASSIGN_PRE_STITCHER':
        historyMetadata = {
          ...historyMetadata,
          awaitingAssignment: true,
        };
        break;

      case 'PRE_STITCHER_ASSIGNED':
        if (stageData.metadata?.assignments) {
          historyMetadata = {
            ...historyMetadata,
            assignments: stageData.metadata.assignments,
            assignmentType: stageData.metadata.assignmentType,
            totalShirtQuantity: stageData.metadata.totalShirtQuantity,
          };
        }
        break;

      case 'COMPLETED':
        historyMetadata = {
          ...historyMetadata,
          completedAt: new Date().toISOString(),
          totalDuration:
            sortedHistory && sortedHistory.length > 0
              ? new Date().getTime() - new Date(sortedHistory[sortedHistory.length - 1].enteredAt).getTime()
              : 0,
        };
        break;

      default:
        historyMetadata = {
          ...historyMetadata,
          stageName: stageData.stage,
        };
    }

    if (stageData.metadata) {
      historyMetadata = {
        ...historyMetadata,
        ...stageData.metadata,
      };
    }

    if (stageData.updateData) {
      historyMetadata = {
        ...historyMetadata,
        ...stageData.updateData,
      };
    }

    await this.stageHistoryService.createStageHistory({
      deliveryMemoId: memoId,
      stage: stageData.stage,
      performedBy: stageData.performedBy,
      metadata: historyMetadata,
    });

    const updatedMemo = await this.deliveryMemos.findOne({
      where: { _id: memoId },
      relations: ['items', 'stageHistory'],
    });

    if (!updatedMemo) {
      throw new HttpException(404, 'Delivery memo not found after update');
    }

    const history = [...updatedMemo.stageHistory].sort((a, b) => a.enteredAt.getTime() - b.enteredAt.getTime());

    const now = new Date();
    const historyWithDuration = history.map((entry, index) => {
      const start = entry.enteredAt;
      const end = history[index + 1]?.enteredAt || now;
      const durationMs = end.getTime() - start.getTime();
      const durationHours = durationMs / (1000 * 60 * 60);

      return {
        _id: entry._id,
        stage: entry.stage,
        enteredAt: entry.enteredAt,
        performedBy: entry.performedBy,
        metadata: entry.metadata,
        durationMs,
        durationHours: Number(durationHours.toFixed(2)),
      };
    });

    return {
      deliveryMemoId: updatedMemo._id,
      dmNumber: updatedMemo.dmNumber,
      currentStage: updatedMemo.stage,
      createdAt: updatedMemo.createdAt,
      updatedAt: updatedMemo.updatedAt,
      items: updatedMemo.items,
      itemCount: updatedMemo.items?.length || 0,
      stageHistory: historyWithDuration,
    };
  }

  public async updateMemoItemShirtFields(itemId: string, payload: { shirtSKUs?: any[]; shirtQuantity?: number }, performedBy?: string): Promise<any> {
    const item = await this.deliveryMemoItems.findOne({
      where: { _id: itemId },
      relations: ['deliveryMemo'],
    });

    if (!item) {
      throw new HttpException(404, 'Delivery memo item not found');
    }

    const oldShirtSKUs = item.shirtSKUs;
    const oldShirtQuantity = item.shirtQuantity;

    // Handle shirtSKUs update and calculate total quantity
    if (payload.shirtSKUs) {
      // Legacy support: if existing data is string array, we convert or overwrite
      // Since we're updating now, we use the new payload format
      item.shirtSKUs = payload.shirtSKUs.map(skuObj => {
        if (typeof skuObj === 'string') {
          // If a string is passed (legacy/fallback), try to assign it a quantity of 0 or maintain it
          // But ideally the new payload should be objects
          return { sku: skuObj, quantity: 0 };
        }
        return skuObj;
      });

      // Recalculate total quantity if not explicitly provided
      if (payload.shirtQuantity === undefined || payload.shirtQuantity === null) {
        item.shirtQuantity = item.shirtSKUs.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
      } else {
        item.shirtQuantity = payload.shirtQuantity;
      }
    } else {
      item.shirtQuantity = payload.shirtQuantity ?? item.shirtQuantity;
    }

    const isNewEntry = (!oldShirtSKUs || oldShirtSKUs.length === 0) && !oldShirtQuantity;

    await this.deliveryMemoItems.save(item);

    let fabricDetails = { title: '', color: '', imageUrl: '' };
    try {
      const fabric = await this.FabricService.getFabricBySKU(item.fabricSKU);
      fabricDetails = {
        title: fabric.title || '',
        color: fabric.color || '',
        imageUrl: fabric.imageUrl || '',
      };
    } catch (error) {
      console.error('Error fetching fabric details:', error);
    }

    await this.stageHistoryService.createStageHistory({
      deliveryMemoId: item.deliveryMemoId,
      stage: isNewEntry ? 'SHIRT_DETAILS_ADDED' : 'SHIRT_DETAILS_UPDATED',
      performedBy: performedBy || 'SYSTEM',
      metadata: {
        action: isNewEntry ? 'ADD_SHIRT_DETAILS' : 'UPDATE_SHIRT_DETAILS',
        itemId: item._id,
        fabricSKU: item.fabricSKU,
        fabricTitle: fabricDetails.title,
        fabricColor: fabricDetails.color,
        imageUrl: fabricDetails.imageUrl,
        dhap: item.dhap,
        fold: item.fold,
        totalDhapFold: item.totalDhapFold,
        shirtDetails: {
          shirtSKUs: item.shirtSKUs,
          shirtQuantity: item.shirtQuantity,
        },
        changes: isNewEntry
          ? null
          : {
              shirtSKUs: {
                old: oldShirtSKUs || null,
                new: item.shirtSKUs,
              },
              shirtQuantity: {
                old: oldShirtQuantity || null,
                new: item.shirtQuantity,
              },
            },
        timestamp: new Date().toISOString(),
      },
    });

    return {
      message: 'Item updated successfully',
      data: item,
    };
  }

  public async markItemDamage(data: { itemId: string; damagedQuantity: number; notes?: string; performedBy?: string; stage: string }): Promise<any> {
    const { itemId, damagedQuantity, notes, performedBy, stage } = data;

    if (!damagedQuantity || damagedQuantity <= 0) {
      throw new HttpException(400, 'Valid damaged quantity is required');
    }

    const item = await this.deliveryMemoItems.findOne({
      where: { _id: itemId },
      relations: ['deliveryMemo'],
    });

    if (!item) {
      throw new HttpException(404, 'Delivery memo item not found');
    }

    if (!item.shirtQuantity || item.shirtQuantity <= 0) {
      throw new HttpException(400, 'Shirt quantity not set for this item.');
    }

    const totalShirts = Number(item.shirtQuantity || 0);
    const currentDamagedShirts = Number(item.damagedQuantity || 0);
    const currentReturnedShirts = Number(item.returnedQuantity || 0);
    const availableShirts = totalShirts - currentDamagedShirts - currentReturnedShirts;

    if (damagedQuantity > availableShirts) {
      throw new HttpException(400, `Insufficient available shirts. Available: ${availableShirts}, Requested: ${damagedQuantity}`);
    }

    return DBDataSource.transaction(async manager => {
      const itemRepo = manager.getRepository(DeliveryMemoItemEntity);
      const damageRepo = manager.getRepository(DeliveryMemoItemDamageEntity);
      const assignmentRepo = manager.getRepository(PreStitcherAssignmentEntity);

      let fabricDetails = { title: '', color: '', imageUrl: '' };
      try {
        const fabric = await this.FabricService.getFabricBySKU(item.fabricSKU);
        fabricDetails = {
          title: fabric.title || '',
          color: fabric.color || '',
          imageUrl: fabric.imageUrl || '',
        };
      } catch (e) {
        console.error('Error fetching fabric:', e);
      }

      let damagedFabricQuantity = 0;
      if (totalShirts > 0) {
        const fabricPerShirt = Number(item.totalDhapFold || 0) / totalShirts;
        damagedFabricQuantity = Number((damagedQuantity * fabricPerShirt).toFixed(2));
      }

      const newDamagedQuantity = currentDamagedShirts + damagedQuantity;

      await itemRepo.update({ _id: itemId }, { damagedQuantity: newDamagedQuantity });

      const remainingShirts = totalShirts - newDamagedQuantity;

      const assignments = await assignmentRepo.find({
        where: {
          deliveryMemoId: item.deliveryMemoId,
          status: In(['ASSIGNED', 'IN_PROGRESS']),
        },
      });

      for (const assignment of assignments) {
        const completed = totalShirts - remainingShirts;

        assignment.completedQuantity = completed;
        assignment.optionProgress = (assignment.optionProgress || []).map(p => ({
          ...p,
          totalQuantity: totalShirts,
          completedQuantity: completed,
          inProgressQuantity: remainingShirts,
        }));

        if (remainingShirts === 0) {
          assignment.status = PreStitcherAssignmentStatus.COMPLETED;
          assignment.completedAt = new Date();
        }

        await assignmentRepo.save(assignment);
      }

      const damageRecord = damageRepo.create({
        deliveryMemoItemId: itemId,
        deliveryMemoId: item.deliveryMemoId,
        fabricSKU: item.fabricSKU,
        shirtSKUs: item.shirtSKUs || [],
        damagedShirtQuantity: damagedQuantity,
        damagedFabricQuantity,
        stage,
        notes: notes || `Damaged ${damagedQuantity} shirt(s) at ${stage} stage`,
        performedBy,
        metadata: {
          previousDamagedQuantity: currentDamagedShirts,
          newDamagedQuantity,
          availableShirtsAfter: remainingShirts,
          totalShirts,
          fabricTitle: fabricDetails.title,
          fabricColor: fabricDetails.color,
          imageUrl: fabricDetails.imageUrl,
          dhap: item.dhap,
          fold: item.fold,
          totalDhapFold: item.totalDhapFold,
          fabricPerShirt: totalShirts > 0 ? Number(item.totalDhapFold || 0) / totalShirts : 0,
          calculatedFabricDamage: damagedFabricQuantity,
        },
      });

      await damageRepo.save(damageRecord);

      const updatedItem = await itemRepo.findOne({ where: { _id: itemId } });

      return {
        success: true,
        itemId,
        fabricSKU: item.fabricSKU,
        shirtSKUs: item.shirtSKUs || [],
        damagedShirtQuantity: damagedQuantity,
        damagedFabricQuantity,
        previousDamagedQuantity: currentDamagedShirts,
        newDamagedQuantity,
        availableShirts: remainingShirts,
        totalShirts,
        damageRecord,
        updatedItem,
      };
    });
  }

  public async getItemDamageHistory(filters?: {
    itemId?: string;
    deliveryMemoId?: string;
    fabricSKU?: string;
    shirtSKU?: string;
    stage?: string;
    startDate?: Date;
    endDate?: Date;
    performedBy?: string;
  }): Promise<any> {
    const damageRepo = DBDataSource.getRepository(DeliveryMemoItemDamageEntity);

    const queryBuilder = damageRepo
      .createQueryBuilder('damage')
      .leftJoinAndSelect('damage.deliveryMemoItem', 'item')
      .leftJoinAndSelect('damage.deliveryMemo', 'memo')
      .orderBy('damage.createdAt', 'DESC');

    if (filters?.itemId) {
      queryBuilder.andWhere('damage.deliveryMemoItemId = :itemId', {
        itemId: filters.itemId,
      });
    }

    if (filters?.deliveryMemoId) {
      queryBuilder.andWhere('damage.deliveryMemoId = :deliveryMemoId', {
        deliveryMemoId: filters.deliveryMemoId,
      });
    }

    if (filters?.fabricSKU) {
      queryBuilder.andWhere('damage.fabricSKU = :fabricSKU', {
        fabricSKU: filters.fabricSKU,
      });
    }

    if (filters?.shirtSKU) {
      queryBuilder.andWhere(':shirtSKU = ANY(damage.shirtSKUs)', {
        shirtSKU: filters.shirtSKU,
      });
    }

    if (filters?.stage) {
      queryBuilder.andWhere('damage.stage = :stage', {
        stage: filters.stage,
      });
    }

    if (filters?.performedBy) {
      queryBuilder.andWhere('damage.performedBy = :performedBy', {
        performedBy: filters.performedBy,
      });
    }

    if (filters?.startDate) {
      queryBuilder.andWhere('damage.createdAt >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters?.endDate) {
      queryBuilder.andWhere('damage.createdAt <= :endDate', {
        endDate: filters.endDate,
      });
    }

    const damageHistory = await queryBuilder.getMany();

    const summary = {
      totalRecords: damageHistory.length,
      totalDamagedShirts: damageHistory.reduce((sum, record) => sum + (record.damagedShirtQuantity || 0), 0),
      totalDamagedFabric: damageHistory.reduce((sum, record) => sum + (record.damagedFabricQuantity || 0), 0),
      byStage: {} as Record<string, number>,
      byPerformer: {} as Record<string, number>,
    };

    damageHistory.forEach(record => {
      if (record.stage) {
        summary.byStage[record.stage] = (summary.byStage[record.stage] || 0) + record.damagedShirtQuantity;
      }
      if (record.performedBy) {
        summary.byPerformer[record.performedBy] = (summary.byPerformer[record.performedBy] || 0) + record.damagedShirtQuantity;
      }
    });

    return {
      success: true,
      summary,
      history: damageHistory,
    };
  }
  public async getMemoStatsSummary(startDate?: Date, endDate?: Date): Promise<Record<string, { active: number; completed: number }>> {
    const query = this.deliveryMemos.createQueryBuilder('memo');

    if (startDate) {
      query.andWhere('memo.createdAt >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('memo.createdAt <= :endDate', { endDate });
    }

    const memos = await query.getMany();

    const stats: Record<string, { active: number; completed: number }> = {
      CUTTING: { active: 0, completed: 0 },
      PRESTITCHER: { active: 0, completed: 0 },
      TAILOR: { active: 0, completed: 0 },
      KANCH_BUTTON: { active: 0, completed: 0 },
    };

    const stageLevels: Record<string, number> = {
      PENDING: 0,
      CREATE_DELIVERY_MEMO: 0,
      CUTTING: 0,
      ASSIGN_PRE_STITCHER: 1,
      PRE_STITCHER_ASSIGNED: 1,
      PRE_STITCHER_IN_PROGRESS: 1,
      PRE_STITCHER_COMPLETED: 2,
      ASSIGN_TAILOR: 3,
      KANCH_BUTTON: 4,
      COMPLETED: 5,
    };

    memos.forEach(memo => {
      const currentStage = memo.stage || 'PENDING';
      const level = stageLevels[currentStage] ?? 0;

      if (level === 0) stats['CUTTING'].active++;
      if (level > 0) stats['CUTTING'].completed++;

      if (level === 1) stats['PRESTITCHER'].active++;
      if (level > 1) stats['PRESTITCHER'].completed++;

      const isTailorActuallyCompleted = memo.tailorAssignmentStatus === TailorAssignmentStatus.COMPLETED;
      if (level === 3) {
        if (isTailorActuallyCompleted) {
          stats['TAILOR'].completed++;
        } else {
          stats['TAILOR'].active++;
        }
      } else if (level > 3) {
        stats['TAILOR'].completed++;
      }

      const isKanchActuallyCompleted = memo.kanchButtonAssignmentStatus === KanchButtonAssignmentStatus.COMPLETED;
      if (level === 4) {
        if (isKanchActuallyCompleted) {
          stats['KANCH_BUTTON'].completed++;
        } else {
          stats['KANCH_BUTTON'].active++;
        }
      } else if (level > 4) {
        stats['KANCH_BUTTON'].completed++;
      }
    });

    return stats;
  }

  public async getCuttingSummary(): Promise<any[]> {
    try {
      const cuttingHistoryEntries = await this.stageHistoryRepo.find({
        where: { stage: 'CUTTING' },
        order: { enteredAt: 'DESC' },
      });

      if (!cuttingHistoryEntries.length) return [];

      const enrichedMemos = await Promise.all(
        cuttingHistoryEntries.map(async entry => {
          const memo = await this.deliveryMemos.findOne({
            where: { _id: entry.deliveryMemoId },
            relations: ['items', 'stageHistory'],
          });

          if (!memo) return null;

          const sortedHistory = [...(memo.stageHistory || [])].sort((a, b) => new Date(a.enteredAt).getTime() - new Date(b.enteredAt).getTime());

          const cuttingIndex = sortedHistory.findIndex(h => h._id === entry._id);
          const nextStageEntry = sortedHistory[cuttingIndex + 1] || null;

          const enteredCuttingAt = entry.enteredAt;
          const exitedCuttingAt = nextStageEntry?.enteredAt || null;
          const durationMs = exitedCuttingAt
            ? new Date(exitedCuttingAt).getTime() - new Date(enteredCuttingAt).getTime()
            : Date.now() - new Date(enteredCuttingAt).getTime();
          const durationHours = Number((durationMs / (1000 * 60 * 60)).toFixed(2));

          const enrichedItems = await Promise.all(
            (memo.items || []).map(async item => {
              try {
                const fabric = await this.FabricService.getFabricBySKU(item.fabricSKU);
                return {
                  _id: item._id,
                  fabricSKU: item.fabricSKU,
                  fabricTitle: fabric.title,
                  fabricColor: fabric.color,
                  imageUrl: fabric.imageUrl,
                  dhap: item.dhap,
                  fold: item.fold,
                  totalDhapFold: item.totalDhapFold,
                  shirtSKUs: item.shirtSKUs || [],
                  shirtQuantity: item.shirtQuantity || null,
                  damagedQuantity: item.damagedQuantity || 0,
                  returnedQuantity: item.returnedQuantity || 0,
                };
              } catch {
                return {
                  _id: item._id,
                  fabricSKU: item.fabricSKU,
                  fabricTitle: 'Unknown',
                  fabricColor: 'Unknown',
                  imageUrl: null,
                  dhap: item.dhap,
                  fold: item.fold,
                  totalDhapFold: item.totalDhapFold,
                  shirtSKUs: item.shirtSKUs || [],
                  shirtQuantity: item.shirtQuantity || null,
                  damagedQuantity: item.damagedQuantity || 0,
                  returnedQuantity: item.returnedQuantity || 0,
                };
              }
            }),
          );

          return {
            deliveryMemoId: memo._id,
            dmNumber: memo.dmNumber,
            currentStage: memo.stage,
            isStillInCutting: memo.stage === 'CUTTING',
            createdBy: memo.createdBy,
            totalDhapFold: memo.totalDhapFold,
            itemCount: memo.items?.length || 0,
            enteredCuttingAt,
            exitedCuttingAt,
            durationHours,
            nextStage: nextStageEntry?.stage || null,
            items: enrichedItems,
            stageHistory: sortedHistory,
          };
        }),
      );

      return enrichedMemos.filter(Boolean);
    } catch (error) {
      console.error('Error in getCuttingSummary:', error);
      throw error;
    }
  }
  public async searchDeliveryMemos(query: string): Promise<any[]> {
    if (!query || query.trim() === '') return [];

    const searchPattern = `%${query.toLowerCase()}%`;

    // We use a query builder to join with items and fabrics to search by title/sku
    const memos = await this.deliveryMemos
      .createQueryBuilder('memo')
      .leftJoinAndSelect('memo.items', 'items')
      .leftJoinAndSelect('memo.stageHistory', 'stageHistory')
      .leftJoinAndSelect('memo.tailorDetails', 'tailorDetails')
      .leftJoinAndSelect('memo.KanchButtonDetails', 'kanchButtonDetails')
      .leftJoin('items.deliveryMemo', 'memoJoin') // dummy join to allow subquery or where on fabric
      .where(
        `(LOWER(memo.dmNumber) LIKE :search OR EXISTS (
          SELECT 1 FROM fabrics f
          WHERE f.sku = items."fabricSKU"
          AND (LOWER(f.title) LIKE :search OR LOWER(f.sku) LIKE :search)
        ))`,
        { search: searchPattern },
      )
      .orWhere(
        `EXISTS (
          SELECT 1 FROM jsonb_array_elements(items."shirtSKUs") AS s
          WHERE LOWER(s->>'sku') LIKE :search
        )`,
        { search: searchPattern },
      )
      .orderBy('memo.createdAt', 'DESC')
      .getMany();

    // Enrich with fabric details manually to avoid complex double-joins in TypeORM if not needed
    // or we can join FabricEntity if we add the relation to DeliveryMemoItemEntity.
    // Given the current structure, let's fetch fabrics for the found items.

    const fabricRepo = DBDataSource.getRepository(FabricEntity);
    const assignmentRepo = DBDataSource.getRepository(PreStitcherAssignmentEntity);

    return Promise.all(
      memos.map(async memo => {
        const itemsWithDetails = await Promise.all(
          memo.items.map(async item => {
            const fabric = await fabricRepo.findOne({
              where: { sku: item.fabricSKU, isDeleted: false },
            });

            return {
              ...item,
              fabricTitle: fabric?.title || 'Unknown',
              fabricColor: fabric?.color || 'Unknown',
              imageUrl: fabric?.imageUrl || null,
            };
          }),
        );

        // Fetch pre-stitcher assignment if any
        const assignments = await assignmentRepo.find({
          where: { deliveryMemoId: memo._id },
          relations: ['preStitcher'],
          order: { createdAt: 'DESC' },
        });

        const preStitcherNames = [
          ...new Set(assignments.map(a => (a.preStitcher ? `${a.preStitcher.firstName} ${a.preStitcher.lastName}` : 'Unknown'))),
        ];

        return {
          deliveryMemoId: memo._id,
          dmNumber: memo.dmNumber,
          stage: memo.stage,
          status: memo.status,
          createdAt: memo.createdAt,
          updatedAt: memo.updatedAt,
          items: itemsWithDetails,
          itemCount: itemsWithDetails.length,
          stageHistory: memo.stageHistory,
          assignments: assignments.map(a => ({
            preStitcherName: a.preStitcher ? `${a.preStitcher.firstName} ${a.preStitcher.lastName}` : 'Unknown',
            status: a.status,
          })),
          tailorName: memo.tailorDetails?.name || null,
          kanchButtonName: memo.KanchButtonDetails?.name || null,
          tailorAssignmentStatus: memo.tailorAssignmentStatus,
          kanchButtonAssignmentStatus: memo.kanchButtonAssignmentStatus,
          kanchButtonAssigned: !!memo.KanchButtonDetails,
          isJobWork: (memo as any).isJobWork,
          jobWorkWorkerName: (memo as any).jobWorkWorkerName,
          jobWorkWorkerPhone: (memo as any).jobWorkWorkerPhone,
          jobWorkStatus: (memo as any).jobWorkStatus,
          // Consolidatd assigned names for easy display
          assignedTo: [...preStitcherNames, memo.tailorDetails?.name, memo.KanchButtonDetails?.name, (memo as any).jobWorkWorkerName].filter(Boolean),
        };
      }),
    );
  }
  public async partialAssign(memoId: string, payloadItems: any[], performedBy?: string): Promise<any> {
    return DBDataSource.transaction(async manager => {
      const memoRepo = manager.getRepository(DeliveryMemoEntity);
      const itemRepo = manager.getRepository(DeliveryMemoItemEntity);
      const stageHistoryRepo = manager.getRepository(DeliveryMemoStageHistoryEntity);

      const parentMemo = await memoRepo.findOne({
        where: { _id: memoId },
        relations: ['items'],
      });

      if (!parentMemo) throw new HttpException(404, 'Memo not found');
      if (parentMemo.stage !== 'CUTTING') throw new HttpException(400, 'Memo is not in CUTTING stage');

      // 1. Calculate requested vs available quantities
      const totalAvailableShirts = parentMemo.items.reduce((sum, item) => sum + (item.shirtQuantity || 0), 0);

      let totalRequestedQuantity = 0;
      for (const payloadItem of payloadItems) {
        const partialSKUs = payloadItem.partialShirtSKUs;
        if (partialSKUs && Array.isArray(partialSKUs)) {
          for (const sku of partialSKUs) {
            totalRequestedQuantity += Number(sku.quantity) || 0;
          }
        }
      }

      if (totalRequestedQuantity <= 0) {
        throw new HttpException(400, 'Assigned quantity must be greater than 0');
      }

      // 2. Direct Full Assignment Check
      if (totalRequestedQuantity === totalAvailableShirts) {
        parentMemo.stage = 'ASSIGN_PRE_STITCHER';
        await memoRepo.save(parentMemo);

        await stageHistoryRepo.save({
          deliveryMemoId: parentMemo._id,
          stage: 'ASSIGN_PRE_STITCHER',
          performedBy,
          metadata: {
            action: 'FULL_ASSIGNMENT_DIRECT',
            note: 'Promoted parent directly to ASSIGN_PRE_STITCHER because all available quantity was assigned.',
          },
        });

        return {
          childMemoId: null,
          parentMemoId: parentMemo._id,
          parentAutoPromoted: true,
        };
      }

      // 3. Proper Split Handling
      const childDmNumber = await generateUniqueDmNumber(parentMemo.dmNumber, manager);

      const childMemo = await memoRepo.save(
        memoRepo.create({
          createdBy: performedBy,
          dmNumber: childDmNumber,
          notes: parentMemo.notes,
          stage: 'ASSIGN_PRE_STITCHER',
          totalDhapFold: 0,
        }),
      );

      let childTotalDhapFold = 0;
      let parentTotalDhapFold = Number(parentMemo.totalDhapFold || 0);

      const itemsToRemove: string[] = [];

      for (const payloadItem of payloadItems) {
        const parentItem = parentMemo.items.find(i => i._id === payloadItem.itemId);
        if (!parentItem) throw new HttpException(404, `Item ${payloadItem.itemId} not found in memo`);

        const partialSKUs = payloadItem.partialShirtSKUs;
        let partialQuantity = 0;
        if (partialSKUs && Array.isArray(partialSKUs)) {
          for (const sku of partialSKUs) {
            partialQuantity += Number(sku.quantity) || 0;
          }
        }

        if (partialQuantity <= 0) continue;

        const parentTotalShirts = parentItem.shirtQuantity || 0;
        if (partialQuantity > parentTotalShirts) {
          throw new HttpException(400, `Requested partial quantity ${partialQuantity} exceeds available ${parentTotalShirts}`);
        }

        const ratio = parentTotalShirts > 0 ? partialQuantity / parentTotalShirts : 0;

        const partialTotalDhapFold = Number((Number(parentItem.totalDhapFold || 0) * ratio).toFixed(2));
        const newParentTotalDhapFold = Number((Number(parentItem.totalDhapFold || 0) - partialTotalDhapFold).toFixed(2));
        const newParentQuantity = parentTotalShirts - partialQuantity;

        // Child item
        await itemRepo.save(
          itemRepo.create({
            deliveryMemoId: childMemo._id,
            fabricSKU: parentItem.fabricSKU,
            dhap: parentItem.dhap,
            fold: parentItem.fold,
            totalDhapFold: partialTotalDhapFold,
            shirtSKUs: partialSKUs,
            shirtQuantity: partialQuantity,
            notes: parentItem.notes,
          } as any),
        );

        // Deduct from parent item
        const originalSKUs = parentItem.shirtSKUs || [];
        const newParentSKUs = originalSKUs
          .map(o => {
            const p = partialSKUs.find((s: { sku: string; quantity: number }) => s.sku === o.sku);
            if (p) {
              return { sku: o.sku, quantity: Math.max(0, o.quantity - p.quantity) };
            }
            return o;
          })
          .filter(o => o.quantity > 0);

        parentItem.shirtQuantity = newParentQuantity;
        parentItem.shirtSKUs = newParentSKUs;
        parentItem.totalDhapFold = newParentTotalDhapFold;

        if (newParentQuantity === 0) {
          await itemRepo.delete({ _id: parentItem._id });
          itemsToRemove.push(parentItem._id);
        } else {
          await itemRepo.save(parentItem);
        }

        childTotalDhapFold += partialTotalDhapFold;
        parentTotalDhapFold -= partialTotalDhapFold;
      }

      // Sync in-memory items
      parentMemo.items = parentMemo.items.filter(i => !itemsToRemove.includes(i._id));

      parentMemo.totalDhapFold = Number(parentTotalDhapFold.toFixed(2));
      childMemo.totalDhapFold = Number(childTotalDhapFold.toFixed(2));

      await memoRepo.save(parentMemo);
      await memoRepo.save(childMemo);

      await stageHistoryRepo.save({
        deliveryMemoId: childMemo._id,
        stage: 'ASSIGN_PRE_STITCHER',
        performedBy: performedBy,
        metadata: {
          action: 'PARTIAL_ASSIGNMENT_CREATED',
          parentMemoId: parentMemo._id,
        },
      });

      const parentStillHasContent = parentMemo.items.some(item => (item.shirtQuantity ?? 0) > 0);

      if (parentStillHasContent) {
        // Parent still has remaining shirts — keep it in CUTTING, log the split
        await stageHistoryRepo.save({
          deliveryMemoId: parentMemo._id,
          stage: 'CUTTING',
          performedBy: performedBy,
          metadata: {
            action: 'PARTIAL_ASSIGNMENT_SPLIT',
            childMemoId: childMemo._id,
            remainingShirts: parentMemo.items.reduce((sum, i) => sum + (i.shirtQuantity ?? 0), 0),
          },
        });
      } else {
        // Edge case: all shirts moved out but due to floating point or weird manual edge cases
        await memoRepo.update({ _id: parentMemo._id }, { stage: 'ASSIGN_PRE_STITCHER' });

        await stageHistoryRepo.save({
          deliveryMemoId: parentMemo._id,
          stage: 'ASSIGN_PRE_STITCHER',
          performedBy: performedBy,
          metadata: {
            action: 'AUTO_PROMOTED_AFTER_FULL_PARTIAL_ASSIGN',
            childMemoId: childMemo._id,
            note: 'All shirts moved to child memo; parent promoted automatically',
          },
        });
      }

      return {
        childMemoId: childMemo._id,
        parentMemoId: parentMemo._id,
        parentAutoPromoted: !parentStillHasContent,
      };
    });
  }
}

export default DeliveryMemoService;
