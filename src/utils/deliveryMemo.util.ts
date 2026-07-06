import { EntityManager } from 'typeorm';
import { DeliveryMemoEntity } from '@/entities/deliverymemo.entity';

/**
 * Generates a unique dmNumber by appending a suffix (-1, -2, etc.) to the parent dmNumber.
 * Queries the database using the provided transaction manager to ensure uniqueness.
 */
export const generateUniqueDmNumber = async (
  parentDmNumber: string,
  manager: EntityManager
): Promise<string> => {
  const memoRepo = manager.getRepository(DeliveryMemoEntity);
  let suffix = 1;
  let newDmNumber = `${parentDmNumber}-${suffix}`;
  
  while (true) {
    const existing = await memoRepo.findOne({ where: { dmNumber: newDmNumber } });
    if (!existing) {
      return newDmNumber;
    }
    suffix++;
    newDmNumber = `${parentDmNumber}-${suffix}`;
  }
};
