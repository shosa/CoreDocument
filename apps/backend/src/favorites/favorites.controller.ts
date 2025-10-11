import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post()
  async create(
    @CurrentUser() user: any,
    @Body() createFavoriteDto: CreateFavoriteDto,
  ) {
    return this.favoritesService.create(user.id, createFavoriteDto);
  }

  @Get()
  async findAll(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.favoritesService.findAllByUser(user.id, pageNum, limitNum);
  }

  @Delete(':documentId')
  async remove(@CurrentUser() user: any, @Param('documentId') documentId: string) {
    return this.favoritesService.remove(user.id, +documentId);
  }

  @Post(':documentId/toggle')
  async toggle(@CurrentUser() user: any, @Param('documentId') documentId: string) {
    return this.favoritesService.toggle(user.id, +documentId);
  }

  @Get(':documentId/check')
  async check(@CurrentUser() user: any, @Param('documentId') documentId: string) {
    return this.favoritesService.isFavorite(user.id, +documentId);
  }
}
