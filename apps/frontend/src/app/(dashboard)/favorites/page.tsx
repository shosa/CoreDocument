'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  CircularProgress,
  Grid,
  IconButton,
  Stack,
} from '@mui/material';
import { Download, Star, Delete } from '@mui/icons-material';
import PageHeader from '@/components/PageHeader';
import Widget from '@/components/Widget';
import { favoritesApi, documentsApi } from '@/lib/api';
import { useSnackbar } from 'notistack';
import { format } from 'date-fns';

interface Document {
  id: number;
  filename: string;
  supplier: string;
  docNumber: string;
  date: string;
  fileSize: number;
  isFavorite?: boolean;
}

export default function FavoritesPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [favorites, setFavorites] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const response = await favoritesApi.list();
      setFavorites(response.data.data || response.data);
    } catch (error) {
      enqueueSnackbar('Errore nel caricamento dei preferiti', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (id: number, filename: string) => {
    try {
      const response = await documentsApi.download(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      enqueueSnackbar('Download avviato', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Errore durante il download', { variant: 'error' });
    }
  };

  const handleToggleFavorite = async (id: number) => {
    try {
      await favoritesApi.toggle(id);
      fetchFavorites();
      enqueueSnackbar('Rimosso dai preferiti', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Errore', { variant: 'error' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Sei sicuro di voler eliminare questo documento?')) return;
    try {
      await documentsApi.delete(id);
      fetchFavorites();
      enqueueSnackbar('Documento eliminato', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Errore durante l\'eliminazione', { variant: 'error' });
    }
  };

  const formatFileSize = (bytes: number) => {
    const numBytes = Number(bytes);
    const kb = numBytes / 1024;
    return kb > 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${kb.toFixed(2)} KB`;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Data non valida';
      return format(date, 'dd/MM/yyyy');
    } catch {
      return 'Data non valida';
    }
  };

  return (
    <Box>
      <PageHeader
        title="Documenti Preferiti"
        breadcrumbs={[{ label: 'Preferiti' }]}
      />

      <Widget>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {favorites.map(doc => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={doc.id}>
                <Box
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    '&:hover': { borderColor: 'primary.main' }
                  }}
                >
                  <Box sx={{ fontWeight: 600, mb: 1 }}>{doc.filename}</Box>
                  <Box sx={{ fontSize: '0.875rem', color: 'text.secondary', mb: 1 }}>
                    {doc.supplier} - {doc.docNumber}
                  </Box>
                  <Box sx={{ fontSize: '0.875rem', color: 'text.secondary', mb: 2 }}>
                    {formatDate(doc.date)} - {formatFileSize(doc.fileSize)}
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <IconButton size="small" onClick={() => handleToggleFavorite(doc.id)}>
                      <Star color="primary" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDownload(doc.id, doc.filename)}>
                      <Download />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(doc.id)}>
                      <Delete />
                    </IconButton>
                  </Stack>
                </Box>
              </Grid>
            ))}
          </Grid>
        )}

        {!loading && favorites.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
            Nessun documento nei preferiti.
          </Box>
        )}
      </Widget>
    </Box>
  );
}
