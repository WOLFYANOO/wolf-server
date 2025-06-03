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
  async findAll(page: number = 1, limit: number = 50) {
    const [categories, total] = await this.CategoriesRepo.createQueryBuilder(
      'category',
    )
      .loadRelationCountAndMap('category.products_count', 'category.products')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return {
      categories,
      total,
      page: Number(page),
      limit,
    };
  }
  async findOne(id: string) {
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
  async searchEngine(
    searchin: 'categories',
    searchwith: string,
    column?: string,
  ) {
    if (searchin === 'categories') {
      const columns = ['category.name', 'category.desc'];
      if (column && !columns.includes(column)) {
        throw new ConflictException('لا يوجد عمود بهذا الاسم');
      }
      const query = this.CategoriesRepo.createQueryBuilder(
        'category',
      ).loadRelationCountAndMap('category.products_count', 'category.products');

      if (column) {
        query
          .where(`${column} ILIKE :termStart`, {
            termStart: `${searchwith.toLowerCase()}%`,
          })
          .orWhere(`${column} ILIKE :termEnd`, {
            termEnd: `%${searchwith.toLowerCase()}`,
          });
      } else {
        query
          .where('category.name ILIKE :termStart', {
            termStart: `${searchwith.toLowerCase()}%`,
          })
          .orWhere('category.name ILIKE :termEnd', {
            termEnd: `%${searchwith.toLowerCase()}`,
          })
          .orWhere('category.desc ILIKE :termStart', {
            termStart: `${searchwith.toLowerCase()}%`,
          })
          .orWhere('category.desc ILIKE :termEnd', {
            termEnd: `%${searchwith.toLowerCase()}`,
          });
      }

      const [results, total] = await query.getManyAndCount();
      return { results, total };
    }

    throw new ConflictException('البحث غير مدعوم لهذه الفئة.');
  }
}
