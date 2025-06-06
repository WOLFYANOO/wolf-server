import { CategoriesEntity } from 'src/category/entities/category.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductSortsEntity } from './product-sort.entity';

@Entity({ name: 'products' })
export class ProductsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  desc: string;

  @Column({ default: 0 })
  qty: number;
  @Column()
  material: string;
  @Column({ nullable: true })
  note: string;

  @ManyToOne(() => CategoriesEntity, (category) => category.products)
  category: CategoriesEntity;

  @OneToMany(() => ProductSortsEntity, (sort) => sort.product, {
    cascade: true,
  })
  sorts: ProductSortsEntity[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
