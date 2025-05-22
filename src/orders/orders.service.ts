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
    if (!Array.isArray(parseData)) {
      throw new BadRequestException('Product sort is not an array.');
    }
    if (parseData.length === 0) {
      throw new BadRequestException('Product sort is empty.');
    }
    const order = this.ordersRepo.create({
      client,
      total_price: 0,
      tax,
      discount,
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
    if (discount > total_price) {
      await this.ordersRepo.delete({ id: savedOrder.id });
      throw new ConflictException(
        'لا يمكن ان يكون الخصم اكبر من الفاتورة كاملة.',
      );
    }
    for (const item of orderItemsPrepare) {
      await this.productsService.updateSort(item.sort.id, {
        qty: item.sort.qty - item.qty,
      });
      await this.productsService.update(item.product.id, {
        qty: item.product.qty - item.qty,
      });
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
    return {
      done: true,
      message: 'تم إنشاء الطلب بنجاح',
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
      .leftJoinAndSelect('item.sort', 'sort')
      .leftJoinAndSelect('sort.product', 'product')
      .where('order.id = :id', { id })
      .select([
        'order.id',
        'order.total_price',
        'order.created_at',
        'item.id',
        'item.qty',
        'item.unit_price',
        'sort.id',
        'sort.name',
        'sort.size',
        'sort.color',
        'product.id',
        'product.name',
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
  async returnOneItem(itemId: string, qty: number, reason?: string) {
    const item = await this.ItemsRepo.findOne({
      where: { id: itemId },
      relations: ['sort'],
    });
    if (!item) throw new NotFoundException('الصنف المراد ارجاعه غير موجود.');
    if (item.qty < qty)
      throw new ConflictException(
        'الكمية المراد ارجاعها اكبر من الكمية الفعلية للطلب.',
      );
    const itemReady = { ...item, qty: item.qty - qty };
    const returnReady = this.returnRepo.create({
      order_item: itemReady,
      qty,
      reason,
    });
    try {
      await this.ItemsRepo.save(itemReady);
      await this.returnRepo.save(returnReady);
      await this.productsService.updateSort(item.sort.id, {
        qty: qty + item.sort.qty,
      });
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(ErrorMsg);
    }
  }
}
