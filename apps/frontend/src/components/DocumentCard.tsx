'use client';

import { Card, CardContent, CardActions, Box, Typography, Chip, IconButton, Tooltip } from '@mui/material';
import { Delete, Download, Description, PictureAsPdf, Image, InsertDriveFile } from '@mui/icons-material';
import { Document } from '@/types';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface DocumentCardProps {
  document: Document;
  onDownload?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function DocumentCard({ document, onDownload, onDelete }: DocumentCardProps) {
  const categoryLabels: Record<string, string> = {
    manuale_uso: "Manuale d'uso",
    certificazione_ce: 'Certificazione CE',
    scheda_tecnica: 'Scheda Tecnica',
    fattura_acquisto: 'Fattura Acquisto',
    altro: 'Altro',
  };

  const categoryColors: Record<string, 'primary' | 'success' | 'warning' | 'info' | 'default'> = {
    manuale_uso: 'info',
    certificazione_ce: 'success',
    scheda_tecnica: 'primary',
    fattura_acquisto: 'warning',
    altro: 'default',
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return <PictureAsPdf sx={{ fontSize: 48, color: 'error.main' }} />;
    if (mimeType.includes('image')) return <Image sx={{ fontSize: 48, color: 'info.main' }} />;
    if (mimeType.includes('text')) return <Description sx={{ fontSize: 48, color: 'primary.main' }} />;
    return <InsertDriveFile sx={{ fontSize: 48, color: 'text.secondary' }} />;
  };

  const formatFileSize = (bytes: number) => {
    const kb = bytes / 1024;
    return kb > 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${kb.toFixed(2)} KB`;
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          {getFileIcon(document.mimeType || '')}
        </Box>

        <Typography
          variant="subtitle1"
          fontWeight={600}
          sx={{
            mb: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={document.fileName}
        >
          {document.fileName}
        </Typography>

        <Chip
          label={categoryLabels[document.documentCategory] || document.documentCategory}
          color={categoryColors[document.documentCategory] || 'default'}
          size="small"
          sx={{ mb: 2 }}
        />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Macchinario
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {document.machine ?
                `${document.machine.model || document.machine.manufacturer || ''} (${document.machine.serialNumber})`.trim()
                : '-'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Dimensione
              </Typography>
              <Typography variant="body2">{formatFileSize(document.fileSize || 0)}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Caricato il
              </Typography>
              <Typography variant="body2">
                {format(new Date(document.uploadedAt || new Date()), 'dd/MM/yyyy', { locale: it })}
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
        {onDownload && (
          <Tooltip title="Scarica">
            <IconButton
              size="small"
              onClick={() => onDownload(document.id)}
              sx={{
                bgcolor: 'black',
                color: 'white',
                borderRadius: '6px',
                '&:hover': { bgcolor: 'grey.800' },
              }}
            >
              <Download fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

        {onDelete && (
          <Tooltip title="Elimina">
            <IconButton
              size="small"
              onClick={() => onDelete(document.id)}
              sx={{
                bgcolor: 'black',
                color: 'white',
                borderRadius: '6px',
                '&:hover': { bgcolor: 'grey.800' },
              }}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </CardActions>
    </Card>
  );
}
