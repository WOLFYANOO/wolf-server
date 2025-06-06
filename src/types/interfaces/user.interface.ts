import { Request } from 'express';
import { ProductSortsEntity } from 'src/products/entities/product-sort.entity';

export interface WorkerTokenInterface {
  id: number;
  user_name: string;
  role: string;
}

export interface CustomRequest extends Request {
  user?: WorkerTokenInterface;
}
export interface CustomProductSortsInterface extends ProductSortsEntity {
  orders_count?: number;
}
