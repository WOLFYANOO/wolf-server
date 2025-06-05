import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductsEntity } from './entities/product.entity';
import { ProductSortsEntity } from './entities/product-sort.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CategoriesEntity } from 'src/category/entities/category.entity';
import { ErrorMsg } from 'src/utils/base';
import { CreateSortDto } from './dto/create-sort.dto';
import { UpdateSortDto } from './dto/update-sorts.dto';
import { CustomProductSortsInterface } from 'src/types/interfaces/user.interface';
import { CostsEntity } from './entities/good-costs.entity';
import { cat, items, products } from 'src/initailData';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(ProductsEntity)
    private readonly productsRepo: Repository<ProductsEntity>,

    @InjectRepository(CategoriesEntity)
    private readonly categoriesRepo: Repository<CategoriesEntity>,

    @InjectRepository(ProductSortsEntity)
    private readonly sortsRepo: Repository<ProductSortsEntity>,

    @InjectRepository(CostsEntity)
    private readonly costsRepo: Repository<CostsEntity>,
  ) {}

  async create(createProductDto: CreateProductDto) {
    const exists = await this.productsRepo.findOne({
      where: { name: createProductDto.name },
    });
    if (exists) throw new ConflictException('اسم المنتج موجود بالفعل');

    const category = await this.categoriesRepo.findOne({
      where: { id: createProductDto.categoryId },
    });
    if (!category) throw new NotFoundException('الفئة غير موجودة');

    const newProduct = this.productsRepo.create({
      ...createProductDto,
      category,
    });
    try {
      await this.productsRepo.save(newProduct);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(ErrorMsg);
    }
    return {
      done: true,
      message: 'تم إنشاء المنتج بنجاح',
    };
  }
  async findAll() {
    const [products, total] = await this.productsRepo
      .createQueryBuilder('product')
      .leftJoin('product.category', 'cat')
      .addSelect(['cat.id', 'cat.name'])
      .loadRelationCountAndMap('product.sorts_count', 'product.sorts')
      .getManyAndCount();
    return {
      products,
      total,
    };
  }
  async findAllSorts(page: number = 1, limit: number = 1000) {
    const [sorts, total] = await this.sortsRepo
      .createQueryBuilder('sorts')
      .leftJoin('sorts.product', 'product')
      .addSelect(['product.id', 'product.name', 'product.material'])
      .leftJoin('product.category', 'category')
      .addSelect(['category.id', 'category.name'])
      .orderBy('sorts.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      sorts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
  async findOne(id: string) {
    const product = await this.productsRepo
      .createQueryBuilder('product')
      .andWhere('product.id = :id', { id })
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.sorts', 'sorts')
      .loadRelationCountAndMap('sorts.orders_count', 'sorts.order_items')
      .getOne();

    if (!product) throw new NotFoundException('المنتج غير موجود');

    return product;
  }
  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.productsRepo.findOne({
      where: { id },
      relations: ['category', 'sorts'],
    });
    if (!product) throw new NotFoundException('المنتج غير موجود');

    if (updateProductDto.name && updateProductDto.name !== product.name) {
      const duplicate = await this.productsRepo.findOne({
        where: { name: updateProductDto.name },
      });
      if (duplicate) throw new ConflictException('اسم المنتج مستخدم بالفعل');
    }

    if (updateProductDto.categoryId) {
      const category = await this.categoriesRepo.findOne({
        where: { id: updateProductDto.categoryId },
      });
      if (!category) throw new NotFoundException('الفئة الجديدة غير موجودة');
      product.category = category;
    }
    Object.assign(product, updateProductDto);
    try {
      await this.productsRepo.save(product);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(ErrorMsg);
    }
    return {
      done: true,
      message: 'تم تحديث المنتج بنجاح',
    };
  }
  async createSort(productId: string, createSortDto: CreateSortDto) {
    const product = await this.productsRepo.findOne({
      where: { id: productId },
      relations: ['sorts'],
    });
    if (!product) throw new NotFoundException('المنتج غير موجود.');
    if (
      product.sorts?.some(
        (sort) =>
          sort.color.trim().toLowerCase() ===
            createSortDto.color.trim().toLowerCase() &&
          sort.size.trim().toLowerCase() ===
            createSortDto.size.trim().toLowerCase() &&
          sort.name.trim().toLowerCase() ===
            createSortDto.name.trim().toLowerCase(),
      )
    ) {
      throw new ConflictException('هذا الصنف موجود بالفعل');
    }

    const newSort = this.sortsRepo.create({
      ...createSortDto,
      product,
    });

    try {
      await this.productsRepo.save({
        ...product,
        qty: product.qty + createSortDto.qty,
      });
      const savedSort = await this.sortsRepo.save(newSort);
      const costsRepo = this.costsRepo.create({
        sort: savedSort,
        qty: createSortDto.qty,
        price: createSortDto.costPrice,
        short_id: `COS-${await this.generateShortId()}`,
      });
      await this.costsRepo.save(costsRepo);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(ErrorMsg);
    }
    return {
      done: true,
      message: 'تم إنشاء الصنف بنجاح',
    };
  }
  async updateSortQtyOrders(sortId: string, newQty: number) {
    console.log('you right');
    const sort = await this.sortsRepo.findOne({
      where: { id: sortId },
      relations: ['product'],
    });
    if (!sort) throw new NotFoundException('النوع غير موجود');
    try {
      const productQty = sort.product.qty - sort.qty + newQty;
      await this.productsRepo.save({
        ...sort.product,
        qty: productQty,
      });
      Object.assign(sort, { qty: newQty });
      await this.sortsRepo.save(sort);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(ErrorMsg);
    }
  }
  async updateSort(sortId: string, updateSortDto: UpdateSortDto) {
    const sort = await this.sortsRepo.findOne({
      where: { id: sortId },
      relations: ['product'],
    });
    if (!sort) throw new NotFoundException('النوع غير موجود');

    const otherSorts = await this.sortsRepo.find({
      where: { product: { id: sort.product.id } },
    });
    if (
      (updateSortDto.color || updateSortDto.size || updateSortDto.name) &&
      otherSorts.some(
        (s) =>
          s.id !== sortId &&
          s.color.trim() === updateSortDto.color.trim() &&
          s.size.trim() === updateSortDto.size.trim() &&
          s.name.trim() === updateSortDto.name.trim(),
      )
    ) {
      throw new ConflictException('يوجد صنف آخر بنفس الأسم واللون والمقاس');
    }

    try {
      if (updateSortDto.qty !== undefined) {
        const productQty = sort.product.qty - sort.qty + updateSortDto.qty;
        await this.productsRepo.save({
          ...sort.product,
          qty: productQty,
        });
        const newQty = updateSortDto.qty - sort.qty;
        const newCost = this.costsRepo.create({
          sort,
          qty: newQty,
          price: updateSortDto.costPrice,
          short_id: `COS-${await this.generateShortId()}`,
        });
        await this.costsRepo.save(newCost);
      }
      Object.assign(sort, updateSortDto);
      await this.sortsRepo.save(sort);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(ErrorMsg);
    }

    return {
      done: true,
      message: 'تم تحديث الصنف بنجاح',
    };
  }
  async deleteSort(id: string) {
    const sort: CustomProductSortsInterface = await this.sortsRepo
      .createQueryBuilder('sort')
      .andWhere('sort.id = :id', { id })
      .leftJoinAndSelect('sort.product', 'product')
      .loadRelationCountAndMap('sort.orders_count', 'sort.order_items')
      .getOne();
    if (!sort) {
      throw new NotFoundException('لا يوجد صنف بهذه البيانات.');
    }
    if (sort.orders_count != 0) {
      throw new ConflictException('لا يمكن حذف صنف يحتوي علي طلبات.');
    }
    try {
      await this.sortsRepo.delete(sort.id);
      await this.productsRepo.save({
        ...sort.product,
        qty: sort.product.qty - sort.qty,
      });
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException();
    }
  }
  async findOneSort(id: string) {
    const sort = await this.sortsRepo.findOne({
      where: { id },
      relations: ['product', 'costs'],
    });
    if (!sort) throw new NotFoundException('الصنف غير موجود');
    return sort;
  }
  async findAllCosts(page: number = 1, limit: number = 1000) {
    const [costs, total] = await this.costsRepo
      .createQueryBuilder('cost')
      .leftJoinAndSelect('cost.sort', 'sort')
      .leftJoin('sort.product', 'product')
      .addSelect(['product.id', 'product.name'])
      .orderBy('cost.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return {
      costs,
      total,
      page,
      limit,
    };
  }
  async generateShortId() {
    let shortId: string;
    let exists = true;

    while (exists) {
      const random = Math.floor(100000 + Math.random() * 900000);
      shortId = random.toString();

      const existingCost = await this.costsRepo.findOne({
        where: { short_id: shortId },
      });
      exists = !!existingCost;
    }

    return shortId;
  }
  async initailData() {
    // cats
    for (const c of cat) {
      await this.categoriesRepo.save({
        name: c,
      });
    }
    // products
    for (const product of products) {
      const category = await this.categoriesRepo.findOne({
        where: {
          name: product.category,
        },
      });
      await this.create({
        name: product.title,
        categoryId: category.id,
        material: 'مجهول',
      });
    }
    // sorts
    const problems = [];
    for (const sort of items) {
      const product = await this.productsRepo.findOne({
        where: {
          name: sort.title.split(' ')[0],
        },
      });
      if (product) {
        await this.createSort(product.id, {
          size: 'مجهول',
          name: sort.title,
          qty: sort.qty,
          costPrice: sort.qty * sort.cost_price,
          unit_price: sort.sell_price,
          color: '',
        });
      } else {
        problems.push(sort);
      }
    }
  }
  async calcCurrentInventory() {
    const sorts = await this.sortsRepo
      .createQueryBuilder('sort')
      .leftJoin('sort.costs', 'cost')
      .select([
        'sort.id',
        'sort.qty',
        'sort.unit_price',
        'cost.id',
        'cost.qty',
        'cost.price',
        'cost.created_at',
      ])
      .getMany();
    let totalCostsPrice = 0;
    let totalPrices = 0;
    for (const sort of sorts) {
      totalCostsPrice += this.countCostPriceForOrder(
        sort,
        sort.qty,
        true,
      ) as any;
      totalPrices += sort.qty * sort.unit_price;
    }
    return { totalCostsPrice, totalPrices };
  }
  countCostPriceForOrder(
    sort: ProductSortsEntity,
    orderQty: number,
    isForCalcs?: boolean,
  ) {
    let currSortQty = sort.qty;
    let filledCosts = [];
    const sortedCosts = this.sortData(sort.costs, 'newFirst');
    for (const cost of sortedCosts) {
      if (cost.qty > 0) {
        if (currSortQty > 0) {
          currSortQty -= cost.qty;
          filledCosts.push({
            qty: currSortQty >= 0 ? cost.qty : currSortQty + cost.qty,
            unit_price: cost.price / cost.qty,
            created_at: cost.created_at,
          });
        }
      }
    }
    if (isForCalcs) {
      return filledCosts.reduce(
        (acc, crr) => acc + crr.qty * crr.unit_price,
        0,
      );
    }
    let countCostPrice = 0;
    for (const filledCost of this.sortData(filledCosts, 'oldFirst')) {
      if (orderQty <= filledCost.qty) {
        countCostPrice += orderQty * filledCost.unit_price;
        break;
      } else if (orderQty > filledCost.qty) {
        countCostPrice += filledCost.qty * filledCost.unit_price;
        orderQty -= filledCost.qty;
      }
    }
    return countCostPrice;
  }
  sortData(data: any[], type: 'oldFirst' | 'newFirst') {
    return data.sort(
      (a, b) =>
        new Date((type === 'newFirst' ? b : a).created_at).getTime() -
        new Date((type === 'newFirst' ? a : b).created_at).getTime(),
    );
  }

  async searchEngine(
    searchin: 'products' | 'sorts' | 'costs',
    searchwith: string,
    column?: string,
  ) {
    if (searchin === 'sorts') {
      const columns = [
        'sort.name',
        'sort.color',
        'sort.size',
        'product.name',
        'product.material',
        'category.name',
      ];
      if (column && !columns.includes(column)) {
        throw new ConflictException('لا يوجد عمود بهذا الاسم');
      }
      const query = this.sortsRepo
        .createQueryBuilder('sort')
        .leftJoin('sort.product', 'product')
        .leftJoin('product.category', 'category')
        .addSelect(['product.id', 'product.name', 'product.material'])
        .addSelect(['category.id', 'category.name']);
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
          .where('sort.name ILIKE :termStart', {
            termStart: `${searchwith.toLowerCase()}%`,
          })
          .orWhere('sort.name ILIKE :termEnd', {
            termEnd: `%${searchwith.toLowerCase()}`,
          })
          .orWhere('sort.color ILIKE :termStart', {
            termStart: `${searchwith.toLowerCase()}%`,
          })
          .orWhere('sort.color ILIKE :termEnd', {
            termEnd: `%${searchwith.toLowerCase()}`,
          })
          .orWhere('sort.size ILIKE :termStart', {
            termStart: `${searchwith.toLowerCase()}%`,
          })
          .orWhere('sort.size ILIKE :termEnd', {
            termEnd: `%${searchwith.toLowerCase()}`,
          })
          .orWhere('product.name ILIKE :termStart', {
            termStart: `${searchwith.toLowerCase()}%`,
          })
          .orWhere('product.name ILIKE :termEnd', {
            termEnd: `%${searchwith.toLowerCase()}`,
          })
          .orWhere('product.material ILIKE :termStart', {
            termStart: `${searchwith.toLowerCase()}%`,
          })
          .orWhere('product.material ILIKE :termEnd', {
            termEnd: `%${searchwith.toLowerCase()}`,
          })
          .orWhere('category.name ILIKE :termStart', {
            termStart: `${searchwith.toLowerCase()}%`,
          })
          .orWhere('category.name ILIKE :termEnd', {
            termEnd: `%${searchwith.toLowerCase()}`,
          });
      }

      const [results, total] = await query
        .orderBy('sort.created_at', 'DESC')
        .getManyAndCount();
      return { results, total };
    } else if (searchin === 'products') {
      const columns = [
        'product.name',
        'product.desc',
        'cat.name',
        'product.material',
        'product.note',
      ];
      if (column && !columns.includes(column)) {
        throw new ConflictException('لا يوجد عمود بهذا الاسم');
      }
      const query = this.productsRepo
        .createQueryBuilder('product')
        .leftJoin('product.category', 'cat')
        .loadRelationCountAndMap('product.sorts_count', 'product.sorts')
        .select([
          'product.id',
          'product.name',
          'product.desc',
          'cat.id',
          'cat.name',
          'product.qty',
          'product.material',
          'product.note',
          'product.created_at',
          'product.updated_at',
        ]);

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
          .where('product.name ILIKE :termStart', {
            termStart: `${searchwith.toLowerCase()}%`,
          })
          .orWhere('product.name ILIKE :termEnd', {
            termEnd: `%${searchwith.toLowerCase()}`,
          })
          .orWhere('product.desc ILIKE :termEnd', {
            termEnd: `%${searchwith.toLowerCase()}`,
          })
          .orWhere('product.desc ILIKE :termStart', {
            termStart: `${searchwith.toLowerCase()}%`,
          })
          .orWhere('product.material ILIKE :termEnd', {
            termEnd: `%${searchwith.toLowerCase()}`,
          })
          .orWhere('product.material ILIKE :termStart', {
            termStart: `${searchwith.toLowerCase()}%`,
          })
          .orWhere('product.note ILIKE :termEnd', {
            termEnd: `%${searchwith.toLowerCase()}`,
          })
          .orWhere('product.note ILIKE :termStart', {
            termStart: `${searchwith.toLowerCase()}%`,
          })
          .orWhere('cat.name ILIKE :termEnd', {
            termEnd: `%${searchwith.toLowerCase()}`,
          })
          .orWhere('cat.name ILIKE :termStart', {
            termStart: `${searchwith.toLowerCase()}%`,
          });
      }
      const [results, total] = await query
        .orderBy('product.created_at', 'DESC')
        .getManyAndCount();
      return { results, total };
    } else if (searchin === 'costs') {
      const columns = [
        'cost.short_id',
        'product.name',
        'sort.name',
        'sort.color',
        'sort.size',
      ];
      if (column && !columns.includes(column)) {
        throw new ConflictException('لا يوجد عمود بهذا الاسم');
      }
      const query = this.costsRepo
        .createQueryBuilder('cost')
        .leftJoin('cost.sort', 'sort')
        .leftJoin('sort.product', 'product')
        .select([
          'cost.id',
          'cost.short_id',
          'cost.qty',
          'cost.price',
          'cost.created_at',
          'cost.updated_at',
          'sort.id',
          'sort.name',
          'sort.color',
          'sort.size',
          'product.id',
          'product.name',
        ]);
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
          .where(`cost.short_id ILIKE :termStart`, {
            termStart: `${searchwith.toLowerCase()}%`,
          })
          .orWhere(`cost.short_id ILIKE :termEnd`, {
            termEnd: `%${searchwith.toLowerCase()}`,
          })
          .orWhere('product.name ILIKE :termStart', {
            termStart: `${searchwith.toLowerCase()}%`,
          })
          .orWhere('product.name ILIKE :termEnd', {
            termEnd: `%${searchwith.toLowerCase()}`,
          })
          .orWhere('sort.name ILIKE :termStart', {
            termStart: `${searchwith.toLowerCase()}%`,
          })
          .orWhere('sort.name ILIKE :termEnd', {
            termEnd: `%${searchwith.toLowerCase()}`,
          })
          .orWhere('sort.color ILIKE :termStart', {
            termStart: `${searchwith.toLowerCase()}%`,
          })
          .orWhere('sort.color ILIKE :termEnd', {
            termEnd: `%${searchwith.toLowerCase()}`,
          })
          .orWhere('sort.size ILIKE :termStart', {
            termStart: `${searchwith.toLowerCase()}%`,
          })
          .orWhere('sort.size ILIKE :termEnd', {
            termEnd: `%${searchwith.toLowerCase()}`,
          });
      }
      const [results, total] = await query
        .orderBy('cost.created_at', 'DESC')
        .getManyAndCount();
      return { results, total };
    }

    throw new ConflictException('البحث غير مدعوم لهذه الفئة.');
  }
}
