import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class MinioService implements OnModuleInit {
  private client: Minio.Client;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    this.bucketName = this.configService.get<string>('MINIO_BUCKET_NAME') || 'coredocument-files';

    this.client = new Minio.Client({
      endPoint: this.configService.get<string>('MINIO_ENDPOINT') || 'localhost',
      port: parseInt(this.configService.get<string>('MINIO_PORT') || '9000', 10),
      useSSL: this.configService.get<string>('MINIO_USE_SSL') === 'true',
      accessKey: this.configService.get<string>('MINIO_ROOT_USER') || this.configService.get<string>('MINIO_ACCESS_KEY') || 'minioadmin',
      secretKey: this.configService.get<string>('MINIO_ROOT_PASSWORD') || this.configService.get<string>('MINIO_SECRET_KEY') || 'minioadmin',
    });
  }

  async onModuleInit() {
    try {
      const exists = await this.client.bucketExists(this.bucketName);
      if (!exists) {
        await this.client.makeBucket(this.bucketName, 'us-east-1');
        console.log(`✅ MinIO bucket '${this.bucketName}' created`);
      } else {
        console.log(`✅ MinIO bucket '${this.bucketName}' already exists`);
      }
    } catch (error) {
      console.error('❌ MinIO initialization error:', (error as any).message);
    }
  }

  /**
   * Upload a document file to MinIO
   * Path structure: documents/{year}/{month}/{day}/{filename}
   */
  async uploadDocument(
    file: Express.Multer.File,
    date: Date,
  ): Promise<{ filePath: string; fileName: string }> {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.originalname}`;
    const filePath = `documents/${year}/${month}/${day}/${fileName}`;

    await this.client.putObject(this.bucketName, filePath, file.buffer, file.size, {
      'Content-Type': file.mimetype,
    });

    return { filePath, fileName: file.originalname };
  }

  async deleteFile(filePath: string): Promise<void> {
    await this.client.removeObject(this.bucketName, filePath);
  }

  async getFileUrl(filePath: string, expirySeconds: number = 3600): Promise<string> {
    return this.client.presignedGetObject(this.bucketName, filePath, expirySeconds);
  }

  async getFileStream(filePath: string): Promise<any> {
    return this.client.getObject(this.bucketName, filePath);
  }

  async getFileStat(filePath: string): Promise<Minio.BucketItemStat> {
    return this.client.statObject(this.bucketName, filePath);
  }
}
