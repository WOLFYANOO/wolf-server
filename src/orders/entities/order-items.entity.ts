import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OrdersEntity } from './order.entity';
import { ProductSortsEntity } from 'src/products/entities/product-sort.entity';
import { ReturnsItemsEntity } from './returns-items.entity';

@Entity({ name: 'order_items' })
export class OrderItemsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => OrdersEntity, (order) => order.order_items)
  order: OrdersEntity;

  @ManyToOne(() => ProductSortsEntity, (product) => product.order_items)
  sort: ProductSortsEntity;

  @Column()
  qty: number;

  @Column({ type: 'decimal' })
  unit_price: number;
  @OneToMany(() => ReturnsItemsEntity, (ret) => ret.order_item)
  returns_items: ReturnsItemsEntity;
}
