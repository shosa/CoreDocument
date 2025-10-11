import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { DocumentsModule } from './documents/documents.module';
import { FavoritesModule } from './favorites/favorites.module';
import { SearchModule } from './search/search.module';
import { MinioModule } from './minio/minio.module';
import { MeilisearchModule } from './meilisearch/meilisearch.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    DocumentsModule,
    FavoritesModule,
    SearchModule,
    MinioModule,
    MeilisearchModule,
  ],
})
export class AppModule {}
