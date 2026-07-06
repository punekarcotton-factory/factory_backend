export interface Fabric {
  _id?: string;
  sku: string;
  title?: string;  
  color?: string;  
  quantity: number;
  imageUrl?: string;
  isDeleted?: boolean;
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
