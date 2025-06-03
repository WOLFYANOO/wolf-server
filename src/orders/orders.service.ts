import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrdersEntity } from './entities/order.entity';
import { OrderItemsEntity } from './entities/order-items.entity';
import { PaymentsEntity } from './entities/payments.entity';
import { ClientsService } from 'src/clients/clients.service';
import { ProductsService } from 'src/products/products.service';
import { ErrorMsg } from 'src/utils/base';
import { ReturnEntity } from './entities/return.entity';
import { ReturnsItemsEntity } from './entities/returns-items.entity';
import { PaidStatusEnum } from 'src/types/enums/product.enum';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrdersEntity)
    private readonly ordersRepo: Repository<OrdersEntity>,
    @InjectRepository(OrderItemsEntity)
    private readonly ItemsRepo: Repository<OrderItemsEntity>,
    @InjectRepository(PaymentsEntity)
    private readonly paymentsRepo: Repository<PaymentsEntity>,
    @InjectRepository(ReturnEntity)
    private readonly returnRepo: Repository<ReturnEntity>,
    @InjectRepository(ReturnsItemsEntity)
    private readonly returnsItemsRepo: Repository<ReturnsItemsEntity>,
    private readonly clientsService: ClientsService,
    private readonly productsService: ProductsService,
  ) {}
  async createOrder({
    client_id,
    product_sorts,
    payment_method,
    paid_status,
    tax,
    discount,
  }: CreateOrderDto) {
    if (+tax > 99 || +tax < 1) throw new BadRequestException();
    const client = await this.clientsService.findClientById(client_id);
    if (!client) {
      throw new NotFoundException('Client not found.');
    }
    const parseData = JSON.parse(product_sorts);

    const order = this.ordersRepo.create({
      client,
      total_price: 0,
      tax,
      discount,
      short_id: `ORD-${await this.generateShortId()}`,
    });
    let savedOrder;
    try {
      savedOrder = await this.ordersRepo.save(order);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(ErrorMsg);
    }
    const orderItemsPrepare = [];
    let total_price = 0;
    for (const item of parseData) {
      const productSort = await this.productsService.findOneSort(
        item.product_id,
      );
      if (!productSort) {
        await this.ordersRepo.delete({ id: savedOrder.id });
        throw new NotFoundException('Product sort not found.');
      }

      if (productSort.qty < item.qty) {
        await this.ordersRepo.delete({ id: savedOrder.id });
        throw new ConflictException('Product sort is not enough.');
      }
      total_price += +productSort.price * item.qty;
      orderItemsPrepare.push({
        product: productSort.product,
        sort: productSort,
        qty: item.qty,
        order,
        unit_price: productSort.price,
      });
    }
    if (
      discount >
      Number(total_price * (tax !== undefined ? Number(tax) / 100 + 1 : 1))
    ) {
      await this.ordersRepo.delete({ id: savedOrder.id });
      throw new ConflictException(
        'لا يمكن ان يكون الخصم اكبر من الفاتورة كاملة.',
      );
    }
    for (const item of orderItemsPrepare) {
      await this.productsService.updateSortQtyOrders(
        item.sort.id,
        item.sort.qty - item.qty,
      );
      const orderItem = this.ItemsRepo.create(item);
      await this.ItemsRepo.save(orderItem);
    }
    const payment = this.paymentsRepo.create({
      payment_method,
      status: paid_status,
      order: savedOrder,
    });
    await this.paymentsRepo.save(payment);

    await this.ordersRepo.save({ ...savedOrder, total_price });
    const finalOrder = await this.findOne(savedOrder.id);
    return {
      done: true,
      order: finalOrder,
    };
  }
  async getAllOrders() {
    const [orders, total] = await this.ordersRepo
      .createQueryBuilder('order')
      .leftJoin('order.payment', 'payment')
      .addSelect(['payment.id', 'payment.payment_method', 'payment.status'])
      .leftJoin('order.client', 'client')
      .addSelect(['client.id', 'client.user_name'])
      .getManyAndCount();
    return {
      orders,
      total,
    };
  }
  async findOne(id: string) {
    const order = await this.ordersRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.order_items', 'item')
      .leftJoinAndSelect('order.payment', 'payment')
      .leftJoinAndSelect('order.client', 'client')
      .leftJoinAndSelect('order.return', 'return')
      .loadRelationCountAndMap('return.return_count', 'return.returns_items')
      .leftJoinAndSelect('item.sort', 'sort')
      .leftJoinAndSelect('sort.product', 'product')
      .where('order.id = :id', { id })
      .select([
        'order.id',
        'order.short_id',
        'order.total_price',
        'order.tax',
        'order.discount',
        'return.id',
        'payment.status',
        'payment.payment_method',
        'order.created_at',
        'client.id',
        'client.user_name',
        'item.id',
        'item.qty',
        'item.unit_price',
        'sort.id',
        'sort.name',
        'sort.size',
        'sort.color',
        'product.id',
        'product.name',
        'product.material',
      ])
      .getOne();

    if (!order) throw new NotFoundException('No Order Found.');
    return order;
  }
  async updateOrder(id: string, updateOrderDto: UpdateOrderDto) {
    const order = await this.ordersRepo.findOne({
      where: { id },
      relations: ['payment'],
    });
    if (!order) throw new NotFoundException('الطلب المراد تعديله غير موجود.');
    if (updateOrderDto.discount > order.total_price)
      throw new ConflictException(
        'لا يمكن ان يكون الخصم اكبر من الفاتورة كاملة.',
      );
    Object.assign(order, updateOrderDto);
    const payment = order.payment;
    Object.assign(payment, {
      ...updateOrderDto,
      status: updateOrderDto.paid_status,
    });
    try {
      await this.ordersRepo.save(order);
      await this.paymentsRepo.save(payment);
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException();
    }
    return {
      done: true,
      message: 'تم تعديل الطلب بنجاح.',
    };
  }
  //* ===================
  async makeReturn(order_id: string, data: string) {
    const order = await this.ordersRepo.findOne({
      where: { id: order_id },
      relations: ['return'],
    });
    if (!order) {
      throw new NotFoundException('لا يوجد طلب بهذا المعرف.');
    }
    const parseData = JSON.parse(data);
    let returnRecord = order.return;
    if (!order.return) {
      try {
        const returnReady = this.returnRepo.create({
          order,
          short_id: `RET-${await this.generateShortId()}`,
        });
        const savedReturn = await this.returnRepo.save(returnReady);
        order.return = savedReturn;
        await this.ordersRepo.save(order);
        returnRecord = savedReturn;
      } catch (err) {
        console.error(err);
        throw new InternalServerErrorException(ErrorMsg);
      }
    }
    let countLoseMoney = 0;
    for (const item of parseData) {
      const order_item = await this.ItemsRepo.findOne({
        where: { id: item.item_id },
        relations: ['sort'],
      });
      if (!order_item)
        throw new NotFoundException(
          `لا يوجد عنصر لطلب بهذا المعرف ${item.item_id}.`,
        );
      if (order_item.qty < item.qty)
        throw new ConflictException(
          `الكمية المراد ارجاعها لعنصر من العناصر اكبر من الكمية الفعلية.`,
        );
      const returnsItemsReady = this.returnsItemsRepo.create({
        return: returnRecord,
        qty: item.qty,
        unit_price: order_item.unit_price,
        order_item,
      });
      try {
        await this.returnsItemsRepo.save(returnsItemsReady);
        await this.ItemsRepo.save({
          ...order_item,
          qty: order_item.qty - item.qty,
        });
        await this.productsService.updateSortQtyOrders(
          order_item.sort.id,
          item.qty + order_item.sort.qty,
        );
        countLoseMoney += item.qty * Number(order_item.unit_price);
      } catch (err) {
        console.error(err);
        throw new InternalServerErrorException(ErrorMsg);
      }
    }
    try {
      console.log(countLoseMoney);
      await this.ordersRepo.save({
        ...order,
        total_price: order.total_price - countLoseMoney,
      });
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException(ErrorMsg);
    }
    const updated_order = await this?.findOne(order_id);

    return {
      done: true,
      order: updated_order,
    };
  }

  async getAllReturn(
    page: number = 1,
    limit: number = 1000,
    returnId?: string,
  ) {
    const builder = this.returnRepo
      .createQueryBuilder('return')

      .leftJoin('return.order', 'order')
      .addSelect(['order.id', 'order.tax', 'order.short_id'])
      .leftJoin('order.client', 'client')
      .addSelect(['client.id', 'client.user_name'])
      .loadRelationCountAndMap(
        'return.returns_items_count',
        'return.returns_items',
      )
      .leftJoin('return.returns_items', 'ri')
      .addSelect(['ri.id', 'ri.qty', 'ri.unit_price']);
    if (returnId) {
      builder.andWhere('return.id = :id', { id: returnId });
    }
    const [returns_items, total] = await builder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return {
      returns_items,
      total,
      page,
      limit,
    };
  }

  async findReturnsItems(id: string) {
    const returnObj = await this.returnRepo
      .createQueryBuilder('return')
      .leftJoin('return.order', 'order')
      .addSelect(['order.id', 'order.short_id'])
      .leftJoin('order.client', 'client')
      .addSelect(['client.id', 'client.user_name'])
      .leftJoinAndSelect('return.returns_items', 'return_items')
      .leftJoin('return_items.order_item', 'order_item')
      .addSelect(['order_item.id', 'order_item.qty'])
      .leftJoin('order_item.sort', 'sort')
      .addSelect(['sort.id', 'sort.name', 'sort.color', 'sort.size'])
      .leftJoin('sort.product', 'product')
      .addSelect(['product.id', 'product.name', 'product.material'])
      .where('return.id = :id', { id })
      .getOne();

    if (!returnObj) {
      throw new NotFoundException('لا يوجد مرتجع بهذا المعرف.');
    }
    return returnObj;
  }

  async generateShortId() {
    let shortId: string;
    let exists = true;

    while (exists) {
      const random = Math.floor(100000 + Math.random() * 900000);
      shortId = random.toString();

      const existingReturn = await this.returnRepo.findOne({
        where: { short_id: shortId },
      });
      const existingOrder = await this.ordersRepo.findOne({
        where: { short_id: shortId },
      });
      exists = !!existingOrder && !!existingReturn;
    }

    return shortId;
  }

  async searchEngine(
    searchin: 'orders' | 'returns',
    searchwith: string,
    column?: string,
  ) {
    if (searchin === 'orders') {
      const columns = ['order.short_id', 'client.user_name'];
      if (column && !columns.includes(column)) {
        throw new ConflictException('لا يوجد عمود بهذا الاسم');
      }
      const query = this.ordersRepo
        .createQueryBuilder('order')
        .leftJoin('order.client', 'client')
        .addSelect(['client.id', 'client.user_name'])
        .leftJoin('order.payment', 'payment')
        .addSelect(['payment.id', 'payment.status', 'payment.payment_method']);
      if (column) {
        query
          .where(`${column} ILIKE :termStart`, {
            termStart: `${column === 'order.short_id' ? 'ORD-' : ''}${searchwith.toLowerCase()}%`,
          })
          .orWhere(`${column} ILIKE :termEnd`, {
            termEnd: `%${searchwith.toLowerCase()}`,
          });
      } else {
        query
          .where('order.short_id ILIKE :full', {
            full: `ORD-${searchwith}%`,
          })
          .orWhere('order.short_id ILIKE :termEnd', {
            termEnd: `%${searchwith}`,
          })
          .orWhere('client.user_name ILIKE :termStart', {
            termStart: `${searchwith.toLowerCase()}%`,
          })
          .orWhere('client.user_name ILIKE :termEnd', {
            termEnd: `%${searchwith.toLowerCase()}`,
          });
      }

      const [results, total] = await query.getManyAndCount();
      return { results, total };
    } else if (searchin === 'returns') {
      const columns = ['return.short_id', 'client.user_name'];
      if (column && !columns.includes(column)) {
        throw new ConflictException('لا يوجد عمود بهذا الاسم');
      }
      const query = this.returnRepo
        .createQueryBuilder('return')
        .loadRelationCountAndMap(
          'return.returns_items_count',
          'return.returns_items',
        )
        .leftJoin('return.order', 'order')
        .addSelect(['order.id', 'order.short_id'])
        .leftJoin('order.client', 'client')
        .addSelect(['client.id', 'client.user_name']);
      if (column) {
        query
          .where(`${column} ILIKE :termStart`, {
            termStart: `${column === 'return.short_id' ? 'RET-' : ''}${searchwith.toLowerCase()}%`,
          })
          .orWhere(`${column} ILIKE :termEnd`, {
            termEnd: `%${searchwith.toLowerCase()}`,
          });
      } else {
        query
          .where('return.short_id ILIKE :full', {
            full: `RET-${searchwith}%`,
          })
          .orWhere('return.short_id ILIKE :termEnd', {
            termEnd: `%${searchwith}`,
          })
          .orWhere('client.user_name ILIKE :termStart', {
            termStart: `${searchwith.toLowerCase()}%`,
          })
          .orWhere('client.user_name ILIKE :termEnd', {
            termEnd: `%${searchwith.toLowerCase()}`,
          });
      }
      const [results, total] = await query.getManyAndCount();
      return { results, total };
    }
    throw new ConflictException('البحث غير مدعوم لهذه الفئة.');
  }

  async calcReturns() {
    const [retItems, total] = await this.returnsItemsRepo
      .createQueryBuilder('retItem')
      .select(['retItem.id', 'retItem.qty', 'retItem.unit_price'])
      .getManyAndCount();
    let totalReturnsPrices = 0;
    for (const ret of retItems) {
      totalReturnsPrices += ret.unit_price * ret.qty;
    }
    return { totalReturnsPrices, total };
  }

  async calcEarnings() {
    const [orders, countDoneEarning] = await this.ordersRepo
      .createQueryBuilder('order')
      .leftJoin('order.payment', 'payment')
      .where('payment.status = :status', { status: PaidStatusEnum.PAID })
      .select(['order.id', 'order.total_price', 'order.tax', 'order.discount'])
      .getManyAndCount();

    const [notCompletedorders, notCompletedEarning] = await this.ordersRepo
      .createQueryBuilder('order')
      .leftJoin('order.payment', 'payment')
      .where('payment.status = :status', { status: PaidStatusEnum.PENDING })
      .select(['order.id', 'order.total_price', 'order.tax', 'order.discount'])
      .getManyAndCount();

    return {
      paidOrders: await this.countForOrders(orders),
      countPaidOrders: countDoneEarning,
      notPaidOrders: await this.countForOrders(notCompletedorders),
      countNotPaidOrders: notCompletedEarning,
    };
  }
  async countForOrders(orders: OrdersEntity[]) {
    let total = 0;
    for (const order of orders) {
      const totalPriceAfter =
        order.total_price *
          (order.tax && order.tax !== ''
            ? Number(order.tax.slice(0, 2)) / 100 + 1
            : 1) -
        order.discount;
      total += totalPriceAfter;
    }
    return total;
  }
}
