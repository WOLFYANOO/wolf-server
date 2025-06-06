import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrdersEntity } from './order.entity';
import { ReturnsItemsEntity } from './returns-items.entity';

@Entity({ name: 'return' })
export class ReturnEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ unique: true })
  short_id: string;
  @OneToOne(() => OrdersEntity, (order) => order.return)
  order: OrdersEntity;
  @OneToMany(() => ReturnsItemsEntity, (ret) => ret.return)
  returns_items: ReturnsItemsEntity;
  @CreateDateColumn()
  created_at: Date;
  @UpdateDateColumn()
  updated_at: Date;
}
