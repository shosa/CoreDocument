import { Injectable } from '@nestjs/common';
import { MeilisearchService } from '../meilisearch/meilisearch.service';
import { SearchQueryDto } from './dto/search-query.dto';

@Injectable()
export class SearchService {
  constructor(private meilisearch: MeilisearchService) {}

  async search(searchQuery: SearchQueryDto) {
    const filters: any = {};

    if (searchQuery.supplier) {
      filters.supplier = searchQuery.supplier;
    }
    if (searchQuery.docNumber) {
      filters.docNumber = searchQuery.docNumber;
    }
    if (searchQuery.date) {
      filters.date = searchQuery.date;
    }
    if (searchQuery.month) {
      filters.month = searchQuery.month;
    }
    if (searchQuery.year) {
      filters.year = searchQuery.year;
    }

    const result = await this.meilisearch.searchDocuments(
      searchQuery.q || '',
      filters,
      searchQuery.page || 1,
      searchQuery.limit || 20,
    );

    return {
      data: result.hits,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }
}
