import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createFavoriteDto: CreateFavoriteDto) {
    // Check if document exists
    const document = await this.prisma.document.findUnique({
      where: { id: createFavoriteDto.documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Check if favorite already exists
    const existingFavorite = await this.prisma.favorite.findUnique({
      where: {
        userId_documentId: {
          userId,
          documentId: createFavoriteDto.documentId,
        },
      },
    });

    if (existingFavorite) {
      throw new ConflictException('Document already in favorites');
    }

    const favorite = await this.prisma.favorite.create({
      data: {
        userId,
        documentId: createFavoriteDto.documentId,
      },
      include: {
        document: true,
      },
    });

    return favorite;
  }

  async findAllByUser(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [favorites, total] = await Promise.all([
      this.prisma.favorite.findMany({
        where: { userId },
        include: {
          document: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.favorite.count({ where: { userId } }),
    ]);

    return {
      data: favorites,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async remove(userId: string, documentId: string) {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_documentId: {
          userId,
          documentId,
        },
      },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    await this.prisma.favorite.delete({
      where: {
        userId_documentId: {
          userId,
          documentId,
        },
      },
    });

    return { message: 'Favorite removed successfully' };
  }

  async toggle(userId: string, documentId: string) {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_documentId: {
          userId,
          documentId,
        },
      },
    });

    if (favorite) {
      await this.prisma.favorite.delete({
        where: {
          userId_documentId: {
            userId,
            documentId,
          },
        },
      });
      return { isFavorite: false, message: 'Favorite removed' };
    } else {
      await this.prisma.favorite.create({
        data: {
          userId,
          documentId,
        },
      });
      return { isFavorite: true, message: 'Favorite added' };
    }
  }

  async isFavorite(userId: string, documentId: string) {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_documentId: {
          userId,
          documentId,
        },
      },
    });

    return { isFavorite: !!favorite };
  }
}
