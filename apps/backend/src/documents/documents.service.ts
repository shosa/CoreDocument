import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MinioService } from '../minio/minio.service';
import { MeilisearchService } from '../meilisearch/meilisearch.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { QueryDocumentDto } from './dto/query-document.dto';
import archiver from 'archiver';
import { Readable } from 'stream';

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

  async getFiltersMetadata() {
    // Query database per ottenere solo i valori unici di anni e fornitori
    // Molto più efficiente che caricare tutti i documenti!

    const [suppliersResult, yearsResult] = await Promise.all([
      // Ottieni fornitori unici
      this.prisma.document.findMany({
        select: { supplier: true },
        distinct: ['supplier'],
        orderBy: { supplier: 'asc' },
      }),
      // Ottieni anni unici
      this.prisma.document.findMany({
        select: { year: true },
        distinct: ['year'],
        orderBy: { year: 'desc' },
      }),
    ]);

    const suppliers = suppliersResult
      .map(d => d.supplier)
      .filter(Boolean);

    const years = yearsResult
      .map(d => d.year)
      .filter(Boolean);

    return {
      suppliers,
      years,
    };
  }

  async findAll(query: QueryDocumentDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.supplier) {
      where.supplier = { contains: query.supplier };
    }
    if (query.docNumber) {
      where.docNumber = { contains: query.docNumber };
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

    // Range di date per bulk download
    if (query.dateFrom || query.dateTo) {
      where.date = {};
      if (query.dateFrom) {
        where.date.gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        where.date.lte = new Date(query.dateTo);
      }
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
    let needsFileRename = false;
    let newSupplier = document.supplier;
    let newDocNumber = document.docNumber;
    let newDate = new Date(document.date);

    if (updateDocumentDto.supplier !== undefined) {
      updateData.supplier = updateDocumentDto.supplier;
      newSupplier = updateDocumentDto.supplier;
      needsFileRename = true;
    }
    if (updateDocumentDto.docNumber !== undefined) {
      updateData.docNumber = updateDocumentDto.docNumber;
      newDocNumber = updateDocumentDto.docNumber;
      needsFileRename = true;
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
      newDate = docDate;
      needsFileRename = true;
    }

    // Se cambia supplier, docNumber o date, dobbiamo rinominare il file su MinIO
    if (needsFileRename) {
      try {
        // Scarica il file esistente
        const fileStream = await this.minio.getFileStream(document.minioKey);
        const chunks: Buffer[] = [];
        for await (const chunk of fileStream) {
          chunks.push(chunk);
        }
        const fileBuffer = Buffer.concat(chunks);

        // Ottieni l'estensione dal filename originale
        const fileExtension = document.filename.split('.').pop() || 'pdf';
        const fileStat = await this.minio.getFileStat(document.minioKey);

        // Crea file object per uploadDocument
        const fileObj: Express.Multer.File = {
          buffer: fileBuffer,
          originalname: document.filename,
          mimetype: fileStat.metaData['content-type'] || 'application/pdf',
          size: fileStat.size,
        } as any;

        // Upload con nuovo nome
        const { filePath: newFilePath, fileName: newFileName } = await this.minio.uploadDocument(
          fileObj,
          newDate,
          newSupplier,
          newDocNumber,
        );

        // Elimina vecchio file
        await this.minio.deleteFile(document.minioKey);

        // Aggiorna i dati con nuovo path e filename
        updateData.minioKey = newFilePath;
        updateData.filename = newFileName;
      } catch (error) {
        console.error('Error renaming file on MinIO:', error);
        throw new Error('Failed to rename file on MinIO');
      }
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

    // Determina il MIME type dall'estensione del file
    const ext = document.fileExtension?.toLowerCase();
    let mimeType = 'application/octet-stream';

    const mimeMap: Record<string, string> = {
      'pdf': 'application/pdf',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'txt': 'text/plain',
    };

    if (ext && mimeMap[ext]) {
      mimeType = mimeMap[ext];
    }

    return { stream, fileName: document.filename, mimeType };
  }

  async bulkDownloadZip(query: QueryDocumentDto) {
    // Usa findAll per ottenere i documenti filtrati
    const result = await this.findAll(query);
    const documents = Array.isArray(result) ? result : result.data || [];

    if (documents.length === 0) {
      throw new NotFoundException('Nessun documento trovato con i filtri specificati');
    }

    // Crea lo stream ZIP
    const archive = archiver('zip', {
      zlib: { level: 9 }, // Massima compressione
    });

    // Gestione errori
    archive.on('error', (err) => {
      throw err;
    });

    // Aggiungi ogni documento allo ZIP
    for (const doc of documents) {
      try {
        const fileStream = await this.minio.getFileStream(doc.minioKey);

        // Converti lo stream in buffer per evitare problemi con archiver
        const chunks: Buffer[] = [];
        for await (const chunk of fileStream) {
          chunks.push(chunk);
        }
        const fileBuffer = Buffer.concat(chunks);

        // Crea una struttura di cartelle: fornitore/anno/mese/file
        const folderPath = `${doc.supplier}/${doc.year}/${doc.month}`;
        archive.append(fileBuffer, { name: `${folderPath}/${doc.filename}` });
      } catch (error) {
        console.error(`Errore scaricando file ${doc.filename}:`, error);
        // Continua con gli altri file anche se uno fallisce
      }
    }

    // Finalizza lo ZIP
    archive.finalize();

    return archive;
  }
}
