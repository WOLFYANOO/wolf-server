import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { CommonService } from './common.service';

@Controller('common')
export class CommonController {
  constructor(private readonly commonService: CommonService) {}

  @Get('search')
  async searchEngine(
    @Query('searchin') searchin: string,
    @Query('searchwith') searchwith: string,
    @Query('column') column: string,
  ) {
    return await this.commonService.searchEngine(searchin, searchwith, column);
  }
  @Get('calcs')
  async getAllCalcs() {
    return await this.commonService.getAllCalcs();
  }
}
