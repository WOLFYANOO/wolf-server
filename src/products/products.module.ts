import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsEntity } from './entities/product.entity';
import { ProductSortsEntity } from './entities/product-sort.entity';
import { CategoriesEntity } from 'src/category/entities/category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductsEntity,
      ProductSortsEntity,
      CategoriesEntity,
    ]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
