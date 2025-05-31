import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseUUIDPipe,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateSortDto } from './dto/create-sort.dto';
import { UpdateSortDto } from './dto/update-sorts.dto';
import { ReaderGuard } from 'src/guards/reader.guard';
import { OwnerGuard } from 'src/guards/owner.guard';

@Controller('products')
@UseGuards(ReaderGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(OwnerGuard)
  async create(@Body() createProductDto: CreateProductDto) {
    return await this.productsService.create(createProductDto);
  }
  @Get('initialData')
  async inialdata() {
    return await this.productsService.initailData();
  }
  @Get()
  async findAll() {
    return await this.productsService.findAll();
  }
  @Get('/sorts')
  async findAllSorts() {
    return await this.productsService.findAllSorts();
  }

  @Post(':id/sorts')
  @UseGuards(OwnerGuard)
  async createSort(
    @Param('id', new ParseUUIDPipe()) productId: string,
    @Body() createSortDto: CreateSortDto,
  ) {
    return await this.productsService.createSort(productId, createSortDto);
  }

  @Patch('sorts/:id')
  @UseGuards(OwnerGuard)
  async updateSort(
    @Param('id', new ParseUUIDPipe()) sortId: string,
    @Body() updateSortDto: UpdateSortDto,
  ) {
    return await this.productsService.updateSort(sortId, updateSortDto);
  }
  @Delete('sorts/:id')
  @UseGuards(OwnerGuard)
  async deleteSort(@Param('id', new ParseUUIDPipe()) sortId: string) {
    return await this.productsService.deleteSort(sortId);
  }
  @Get('/costs')
  async findAllCosts() {
    return await this.productsService.findAllCosts();
  }

  @Get(':id')
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return await this.productsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(OwnerGuard)
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return await this.productsService.update(id, updateProductDto);
  }
}
