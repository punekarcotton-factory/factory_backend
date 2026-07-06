export class FabricDamageDto {
  fabricSKU: string;
  damagedQuantity: number;
  deliveryMemoId?: string;
  deliveryMemoItemId?: string;
  performedBy: string;
  notes?: string;
  metadata?: Record<string, any>;
}
