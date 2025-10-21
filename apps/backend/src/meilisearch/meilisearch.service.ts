import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MeiliSearch } from 'meilisearch';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MeilisearchService implements OnModuleInit {
  private client: MeiliSearch;
  private readonly indexName = 'documents';

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.client = new MeiliSearch({
      host: this.configService.get<string>('MEILISEARCH_HOST') || 'http://localhost:7700',
      apiKey: this.configService.get<string>('MEILISEARCH_API_KEY') || '',
    });
  }

  async onModuleInit() {
    try {
      // Create or get index
      let index;
      try {
        index = await this.client.getIndex(this.indexName);
      } catch (error) {
        await this.client.createIndex(this.indexName, { primaryKey: 'id' });
        index = this.client.index(this.indexName);
      }

      // Configure searchable attributes
      await index.updateSearchableAttributes([
        'supplier',
        'docNumber',
        'fileName',
      ]);

      // Configure filterable attributes
      await index.updateFilterableAttributes([
        'year',
        'month',
        'date',
        'supplier',
        'docNumber',
      ]);

      // Configure sortable attributes
      await index.updateSortableAttributes(['date', 'createdAt']);

      console.log('✅ Meilisearch index configured');

      // Sync all existing documents on startup
      await this.syncAllDocuments();
    } catch (error) {
      console.error('❌ Meilisearch initialization error:', (error as any).message);
    }
  }

  async syncAllDocuments() {
    try {
      const documents = await this.prisma.document.findMany();

      if (documents.length === 0) {
        console.log('⚠️  No documents to sync to Meilisearch');
        return;
      }

      const searchDocuments = documents.map((doc) => ({
        id: doc.id,
        fileName: doc.filename,
        supplier: doc.supplier || '',
        docNumber: doc.docNumber || '',
        date: doc.date ? doc.date.toISOString().split('T')[0] : '',
        month: doc.month || '',
        year: doc.year || 0,
        fileSize: Number(doc.fileSize) || 0,
        createdAt: doc.createdAt.toISOString(),
      }));

      const index = this.client.index(this.indexName);
      await index.addDocuments(searchDocuments, { primaryKey: 'id' });

      console.log(`✅ Synced ${documents.length} documents to Meilisearch`);
    } catch (error) {
      console.error('❌ Meilisearch sync error:', (error as any).message);
    }
  }

  async indexDocument(document: any) {
    try {
      const index = this.client.index(this.indexName);
      await index.addDocuments([
        {
          id: document.id,
          fileName: document.filename || document.fileName, // Support both field names
          supplier: document.supplier || '',
          docNumber: document.docNumber || '',
          date: document.date ? (typeof document.date === 'string' ? document.date.split('T')[0] : document.date.toISOString().split('T')[0]) : '',
          month: document.month || '',
          year: document.year || 0,
          fileSize: Number(document.fileSize) || 0,
          createdAt: document.createdAt ? (typeof document.createdAt === 'string' ? document.createdAt : document.createdAt.toISOString()) : new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error('Meilisearch indexing error:', (error as any).message);
    }
  }

  async deleteDocument(documentId: string) {
    try {
      const index = this.client.index(this.indexName);
      await index.deleteDocument(documentId);
    } catch (error) {
      console.error('Meilisearch delete error:', (error as any).message);
    }
  }

  async searchDocuments(
    query: string,
    filters?: {
      supplier?: string;
      docNumber?: string;
      date?: string;
      month?: string;
      year?: number;
    },
    page: number = 1,
    limit: number = 20,
  ) {
    try {
      const index = this.client.index(this.indexName);

      const filterArray: string[] = [];
      if (filters?.supplier) filterArray.push(`supplier = "${filters.supplier}"`);
      if (filters?.docNumber) filterArray.push(`docNumber = "${filters.docNumber}"`);
      if (filters?.date) filterArray.push(`date = "${filters.date}"`);
      if (filters?.month) filterArray.push(`month = "${filters.month}"`);
      if (filters?.year) filterArray.push(`year = ${filters.year}`);

      const offset = (page - 1) * limit;

      const result = await index.search(query, {
        filter: filterArray.length > 0 ? filterArray : undefined,
        limit,
        offset,
        sort: ['date:desc'],
      });

      return {
        hits: result.hits,
        total: result.estimatedTotalHits || 0,
        page,
        limit,
      };
    } catch (error) {
      console.error('Meilisearch search error:', (error as any).message);
      return {
        hits: [],
        total: 0,
        page,
        limit,
      };
    }
  }
}
