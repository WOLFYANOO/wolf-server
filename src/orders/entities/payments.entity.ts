import {
  PaidStatusEnum,
  PaymentMethodsEnum,
} from 'src/types/enums/product.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OrdersEntity } from './order.entity';

@Entity({ name: 'payments' })
export class PaymentsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => OrdersEntity, (order) => order.payment)
  order: OrdersEntity;

  @Column({ type: 'enum', enum: PaymentMethodsEnum })
  payment_method: string;

  @Column({ type: 'enum', enum: PaidStatusEnum })
  status: string;

  @CreateDateColumn()
  created_at: Date;
}
