import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { QueryDocumentDto } from './dto/query-document.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard) // Solo admin possono caricare
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Body() createDocumentDto: CreateDocumentDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.documentsService.create(createDocumentDto, file);
  }

  @Post('bulk-upload')
  @UseGuards(JwtAuthGuard) // Solo admin possono caricare
  @UseInterceptors(FilesInterceptor('files', 50)) // Max 50 files
  async bulkUpload(
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    // body.metadata è un JSON string con array di metadati per ogni file
    const metadata = JSON.parse(body.metadata || '[]');
    return this.documentsService.bulkCreate(files, metadata);
  }

  @Get('metadata/filters')
  // Accesso pubblico - nessun guard
  async getFiltersMetadata() {
    return this.documentsService.getFiltersMetadata();
  }

  @Get()
  // Accesso pubblico - nessun guard
  async findAll(@Query() query: QueryDocumentDto) {
    return this.documentsService.findAll(query);
  }

  @Get(':id')
  // Accesso pubblico - nessun guard
  async findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard) // Solo admin possono modificare
  async update(
    @Param('id') id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
  ) {
    return this.documentsService.update(id, updateDocumentDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard) // Solo admin possono eliminare
  async remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }

  @Get(':id/download-url')
  // Accesso pubblico - nessun guard
  async getDownloadUrl(@Param('id') id: string) {
    return this.documentsService.getDownloadUrl(id);
  }

  @Get(':id/download')
  // Accesso pubblico - nessun guard
  async download(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    const { stream, fileName } = await this.documentsService.getFileStream(id);

    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    });

    return new StreamableFile(stream);
  }
}
