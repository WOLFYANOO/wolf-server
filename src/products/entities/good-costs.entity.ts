import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductSortsEntity } from './product-sort.entity';

@Entity({ name: 'good_costs' })
export class CostsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  qty: number;
  @Column({ type: 'decimal' })
  price: number;
  @ManyToOne(() => ProductSortsEntity, (sort) => sort.costs)
  sort: ProductSortsEntity;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
