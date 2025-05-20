import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoriesEntity } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ErrorMsg } from 'src/utils/base';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(CategoriesEntity)
    private readonly CategoriesRepo: Repository<CategoriesEntity>,
  ) {}
  async create(createCategoryDto: CreateCategoryDto) {
    const exists = await this.CategoriesRepo.findOne({
      where: { name: createCategoryDto.name },
    });
    if (exists) throw new ConflictException('اسم الفئة موجود بالفعل');

    const newCategory = this.CategoriesRepo.create(createCategoryDto);
    try {
      await this.CategoriesRepo.save(newCategory);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(ErrorMsg);
    }
    return {
      done: true,
      message: 'تم إنشاء الفئة بنجاح',
    };
  }
  async findAll() {
    const categories = await this.CategoriesRepo.createQueryBuilder('category')
      .loadRelationCountAndMap('category.products_count', 'category.products')
      .getMany();
    return {
      categories,
      total: categories.length,
    };
  }

  async findOne(id: string) {
    // const category = await this.CategoriesRepo.findOne({
    //   where: { id },
    //   relations: ['products'],
    // });
    const category = await this.CategoriesRepo.createQueryBuilder('category')
      .andWhere('category.id = :id', { id })
      .leftJoinAndSelect('category.products', 'product')
      .loadRelationCountAndMap('product.sorts_count', 'product.sorts')
      .getOne();
    if (!category) throw new NotFoundException('الفئة غير موجودة');

    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.CategoriesRepo.findOne({ where: { id } });
    if (!category) throw new NotFoundException('الفئة غير موجودة');

    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const duplicate = await this.CategoriesRepo.findOne({
        where: { name: updateCategoryDto.name },
      });
      if (duplicate) throw new ConflictException('اسم الفئة مستخدم بالفعل');
    }

    Object.assign(category, updateCategoryDto);
    try {
      await this.CategoriesRepo.save(category);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(ErrorMsg);
    }
    return {
      done: true,
      message: 'تم تحديث الفئة بنجاح',
    };
  }

  async delete(id: string) {
    const category = await this.CategoriesRepo.findOne({
      where: { id },
      relations: ['products'],
    });
    if (!category) throw new NotFoundException('الفئة غير موجودة');

    if (category.products && category.products.length > 0) {
      throw new BadRequestException('لا يمكن حذف الفئة لوجود منتجات تابعة لها');
    }

    await this.CategoriesRepo.remove(category);
    return { done: true, message: 'تم حذف الفئة بنجاح' };
  }
}
