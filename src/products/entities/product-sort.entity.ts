import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductsEntity } from './product.entity';
import { OrderItemsEntity } from 'src/orders/entities/order-items.entity';
import { SizesEnum } from 'src/types/enums/product.enum';
import { CostsEntity } from './good-costs.entity';

@Entity({ name: 'product_sorts' })
export class ProductSortsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ProductsEntity, (product) => product.sorts)
  product: ProductsEntity;

  @Column()
  name: string;
  @Column({ nullable: true })
  color: string;

  @Column()
  size: string;

  @Column()
  qty: number;

  @Column({ type: 'decimal' })
  unit_price: number;
  @Column({ nullable: true })
  note: string;
  @OneToMany(() => OrderItemsEntity, (order) => order.sort, {
    cascade: true,
  })
  order_items: OrderItemsEntity[];
  @OneToMany(() => CostsEntity, (cost) => cost.sort, {
    cascade: true,
  })
  costs: CostsEntity[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
