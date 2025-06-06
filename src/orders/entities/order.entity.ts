import { ClientsEntity } from 'src/clients/entities/client.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OrderItemsEntity } from './order-items.entity';
import { PaymentsEntity } from './payments.entity';
import { ReturnEntity } from './return.entity';

@Entity({ name: 'orders' })
export class OrdersEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ unique: true })
  short_id: string;
  @ManyToOne(() => ClientsEntity, (client) => client.orders)
  client: ClientsEntity;

  @OneToMany(() => OrderItemsEntity, (item) => item.order, { cascade: true })
  order_items: OrderItemsEntity[];

  @Column({ type: 'decimal' })
  total_price: number;

  @Column({ type: 'decimal', default: '0' })
  tax: string;

  @Column({ type: 'decimal', default: 0 })
  discount: number;

  @OneToOne(() => PaymentsEntity, (payment) => payment.order)
  @JoinColumn()
  payment: PaymentsEntity;

  @OneToOne(() => ReturnEntity, (ret) => ret.order, {
    cascade: true,
  })
  @JoinColumn()
  return: ReturnEntity;

  @CreateDateColumn()
  created_at: Date;
}
