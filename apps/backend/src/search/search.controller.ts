import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(@Query() queryParams: SearchQueryDto, @Query('query') queryString?: string) {
    // Support both 'q' and 'query' parameters
    const searchQuery = { ...queryParams, q: queryParams.q || queryString || '' };
    return this.searchService.search(searchQuery);
  }
}
