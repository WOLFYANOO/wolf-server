import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderItemsEntity } from './order-items.entity';

@Entity({ name: 'return' })
export class ReturnEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @ManyToOne(() => OrderItemsEntity, (item) => item.return)
  order_item: OrderItemsEntity;
  @Column({ type: 'int' })
  qty: number;
  @Column({ nullable: true })
  reason: string;
  @CreateDateColumn()
  created_at: Date;
  @UpdateDateColumn()
  updated_at: Date;
}
