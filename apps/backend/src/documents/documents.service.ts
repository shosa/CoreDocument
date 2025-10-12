import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MinioService } from '../minio/minio.service';
import { MeilisearchService } from '../meilisearch/meilisearch.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { QueryDocumentDto } from './dto/query-document.dto';

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private minio: MinioService,
    private meilisearch: MeilisearchService,
  ) {}

  async create(
    createDocumentDto: CreateDocumentDto,
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Parse date and extract components
    const docDate = new Date(createDocumentDto.date);
    const year = docDate.getFullYear();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const month = monthNames[docDate.getMonth()];

    // Upload file to MinIO with supplier and docNumber for proper naming
    const { filePath, fileName } = await this.minio.uploadDocument(
      file,
      docDate,
      createDocumentDto.supplier,
      createDocumentDto.docNumber,
    );

    // Create document in database
    const document = await this.prisma.document.create({
      data: {
        filename: fileName,
        minioKey: filePath,
        supplier: createDocumentDto.supplier || '',
        docNumber: createDocumentDto.docNumber || '',
        date: docDate,
        month: month,
        year: year,
        fileSize: BigInt(file.size),
        fileExtension: file.originalname.split('.').pop() || '',
      },
    });

    // Index in Meilisearch
    await this.meilisearch.indexDocument(document);

    return document;
  }

  async bulkCreate(files: Express.Multer.File[], metadata: any[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    if (metadata.length !== files.length) {
      throw new BadRequestException('Metadata count must match files count');
    }

    const results = [];
    const errors = [];

    // Process each file with its metadata
    for (let i = 0; i < files.length; i++) {
      try {
        const file = files[i];
        const meta = metadata[i];

        // Validate metadata
        if (!meta.date || !meta.supplier || !meta.docNumber) {
          errors.push({
            filename: file.originalname,
            error: 'Missing required metadata (date, supplier, or docNumber)',
          });
          continue;
        }

        const docDate = new Date(meta.date);
        if (isNaN(docDate.getTime())) {
          errors.push({
            filename: file.originalname,
            error: 'Invalid date format',
          });
          continue;
        }

        const year = docDate.getFullYear();
        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const month = monthNames[docDate.getMonth()];

        // Upload file to MinIO with supplier and docNumber for proper naming
        const { filePath, fileName } = await this.minio.uploadDocument(
          file,
          docDate,
          meta.supplier,
          meta.docNumber,
        );

        // Create document in database
        const document = await this.prisma.document.create({
          data: {
            filename: fileName,
            minioKey: filePath,
            supplier: meta.supplier,
            docNumber: meta.docNumber,
            date: docDate,
            month: month,
            year: year,
            fileSize: BigInt(file.size),
            fileExtension: file.originalname.split('.').pop() || '',
          },
        });

        // Index in Meilisearch
        await this.meilisearch.indexDocument(document);

        results.push(document);
      } catch (error) {
        errors.push({
          filename: files[i].originalname,
          error: error.message || 'Upload failed',
        });
      }
    }

    return {
      success: results.length,
      failed: errors.length,
      results,
      errors,
    };
  }

  async findAll(query: QueryDocumentDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.supplier) {
      where.supplier = { contains: query.supplier, mode: 'insensitive' };
    }
    if (query.docNumber) {
      where.docNumber = { contains: query.docNumber, mode: 'insensitive' };
    }
    if (query.date) {
      where.date = new Date(query.date);
    }
    if (query.month) {
      where.month = query.month;
    }
    if (query.year) {
      where.year = query.year;
    }

    const [documents, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
      }),
      this.prisma.document.count({ where }),
    ]);

    return {
      data: documents,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  async update(id: string, updateDocumentDto: UpdateDocumentDto) {
    const document = await this.findOne(id);

    const updateData: any = {};

    if (updateDocumentDto.supplier !== undefined) {
      updateData.supplier = updateDocumentDto.supplier;
    }
    if (updateDocumentDto.docNumber !== undefined) {
      updateData.docNumber = updateDocumentDto.docNumber;
    }
    if (updateDocumentDto.date) {
      const docDate = new Date(updateDocumentDto.date);
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      updateData.date = docDate;
      updateData.month = monthNames[docDate.getMonth()];
      updateData.year = docDate.getFullYear();
    }

    const updatedDocument = await this.prisma.document.update({
      where: { id },
      data: updateData,
    });

    // Update in Meilisearch
    await this.meilisearch.indexDocument(updatedDocument);

    return updatedDocument;
  }

  async remove(id: string) {
    const document = await this.findOne(id);

    // Delete file from MinIO
    try {
      await this.minio.deleteFile(document.minioKey);
    } catch (error) {
      console.error('Error deleting file from MinIO:', error);
    }

    // Delete from database
    await this.prisma.document.delete({
      where: { id },
    });

    // Delete from Meilisearch
    await this.meilisearch.deleteDocument(String(id));

    return { message: 'Document deleted successfully' };
  }

  async getDownloadUrl(id: string) {
    const document = await this.findOne(id);
    const url = await this.minio.getFileUrl(document.minioKey, 3600);
    return { url, fileName: document.filename };
  }

  async getFileStream(id: string) {
    const document = await this.findOne(id);
    const stream = await this.minio.getFileStream(document.minioKey);
    return { stream, fileName: document.filename };
  }
}
