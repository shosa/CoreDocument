# CoreDocument Backend

NestJS backend for CoreDocument - Document Management System with MinIO storage and Meilisearch integration.

## Features

- **Document Management**: Upload, retrieve, update, and delete documents
- **File Storage**: MinIO object storage with organized path structure
- **Search**: Fast full-text search powered by Meilisearch
- **Favorites**: User-specific document favorites
- **Authentication**: JWT-based authentication
- **File Downloads**: Streaming downloads and presigned URLs

## Project Structure

```
src/
├── main.ts                      # Application entry point (Port 3002)
├── app.module.ts                # Root module
├── auth/                        # JWT Authentication
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── auth.controller.ts
│   ├── dto/
│   │   └── login.dto.ts
│   ├── guards/
│   │   └── jwt-auth.guard.ts
│   ├── strategies/
│   │   ├── jwt.strategy.ts
│   │   └── local.strategy.ts
│   └── decorators/
│       └── current-user.decorator.ts
├── prisma/                      # Prisma ORM
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── minio/                       # MinIO Service
│   ├── minio.module.ts
│   └── minio.service.ts
├── meilisearch/                 # Meilisearch Service
│   ├── meilisearch.module.ts
│   └── meilisearch.service.ts
├── documents/                   # Document CRUD
│   ├── documents.module.ts
│   ├── documents.service.ts
│   ├── documents.controller.ts
│   └── dto/
│       ├── create-document.dto.ts
│       ├── update-document.dto.ts
│       └── query-document.dto.ts
├── favorites/                   # User Favorites
│   ├── favorites.module.ts
│   ├── favorites.service.ts
│   ├── favorites.controller.ts
│   └── dto/
│       └── create-favorite.dto.ts
└── search/                      # Meilisearch Integration
    ├── search.module.ts
    ├── search.service.ts
    ├── search.controller.ts
    └── dto/
        └── search-query.dto.ts
```

## API Endpoints

### Authentication

- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Documents

- `POST /api/documents` - Upload document (multipart/form-data)
- `GET /api/documents` - List documents (with filters)
- `GET /api/documents/:id` - Get document by ID
- `PATCH /api/documents/:id` - Update document metadata
- `DELETE /api/documents/:id` - Delete document
- `GET /api/documents/:id/download` - Download document (streaming)
- `GET /api/documents/:id/download-url` - Get presigned download URL

### Favorites

- `POST /api/favorites` - Add document to favorites
- `GET /api/favorites` - Get user's favorite documents
- `DELETE /api/favorites/:documentId` - Remove from favorites
- `POST /api/favorites/:documentId/toggle` - Toggle favorite status
- `GET /api/favorites/:documentId/check` - Check if document is favorited

### Search

- `GET /api/search` - Search documents with filters

## Query Parameters

### Documents List/Search

- `supplier` - Filter by supplier name
- `docNumber` - Filter by document number
- `date` - Filter by exact date (YYYY-MM-DD)
- `month` - Filter by month name
- `year` - Filter by year
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

### Search

- `q` - Search query (searches in supplier, docNumber, fileName)
- All document filters above also apply

## MinIO Path Structure

Documents are stored in MinIO with the following path structure:

```
documents/{year}/{month}/{day}/{timestamp}-{filename}
```

Example:
```
documents/2025/10/10/1728561234567-invoice-001.pdf
```

## Key Features from Python Version

### Document Upload

- Accepts PDF and image files
- Automatically extracts date components (year, month, day)
- Stores file in MinIO with organized path structure
- Saves metadata in MySQL via Prisma
- Indexes in Meilisearch for fast search

### Search Capabilities

- Full-text search across supplier, document number, and filename
- Filter by supplier, document number, date, month, year
- Pagination support
- Sorted by date (descending)

### Favorites System

- User-specific favorites
- Toggle favorite status
- List favorite documents with pagination
- Check if document is favorited

### File Downloads

- Streaming downloads for efficient memory usage
- Presigned URLs for direct MinIO access
- Original filename preservation

## Environment Variables

Required environment variables:

```env
# Database
DATABASE_URL=mysql://user:password@localhost:3306/coredocument

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
MINIO_BUCKET_NAME=coredocument-files

# Meilisearch
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_API_KEY=

# App
APP_PORT=3002
APP_URL=http://localhost:3000
```

## Usage

1. Install dependencies:
```bash
npm install
```

2. Generate Prisma client:
```bash
npx prisma generate
```

3. Run migrations:
```bash
npx prisma migrate dev
```

4. Start the server:
```bash
npm run dev
```

The backend will be available at `http://localhost:3002/api`

## Notable Differences from CoreMachine

1. **Port**: 3002 (vs 3001 for CoreMachine)
2. **Focus**: Document management vs Machine management
3. **File Storage**: All files stored in MinIO (CoreMachine has optional local storage)
4. **Search Fields**: Optimized for document attributes (supplier, docNumber, date)
5. **User System**: Simplified favorites per user (vs Windows username in Python version)

## Development Notes

- All imports use relative paths from `src/` (not `@/`)
- CORS enabled for frontend on port 3000
- Global validation pipe enabled
- API prefix: `/api`
- File upload uses `multer` middleware
- Streaming downloads for large files
