import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ReturnEntity } from './return.entity';
import { OrderItemsEntity } from './order-items.entity';

@Entity({ name: 'returns_items' })
export class ReturnsItemsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @ManyToOne(() => ReturnEntity, (ret) => ret.returns_items)
  return: ReturnEntity;
  @ManyToOne(() => OrderItemsEntity, (order) => order.returns_items)
  order_item: OrderItemsEntity;
  @Column({ type: 'int' })
  qty: number;
  @Column({ type: 'decimal' })
  unit_price: number;
  @Column({ nullable: true })
  reason: string;
  @CreateDateColumn()
  created_at: Date;
  @UpdateDateColumn()
  updated_at: Date;
}
