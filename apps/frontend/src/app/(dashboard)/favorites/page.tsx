'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  CircularProgress,
  Grid,
  IconButton,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import { Download, Star, Delete, Visibility } from '@mui/icons-material';
import PageHeader from '@/components/PageHeader';
import Widget from '@/components/Widget';
import { favoritesApi, documentsApi } from '@/lib/api';
import { useSnackbar } from 'notistack';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface Document {
  id: string;
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
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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

  const handlePreview = async (doc: Document) => {
    try {
      setPreviewDoc(doc);
      const response = await documentsApi.getDownloadUrl(doc.id);
      setPreviewUrl(response.data.url);
    } catch (error) {
      enqueueSnackbar('Errore nel caricamento anteprima', { variant: 'error' });
    }
  };

  const handleClosePreview = () => {
    setPreviewDoc(null);
    setPreviewUrl(null);
  };

  const handleDownload = async (id: string) => {
    try {
      const response = await documentsApi.getDownloadUrl(id);
      window.open(response.data.url, '_blank');
      enqueueSnackbar('Download avviato', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Errore durante il download', { variant: 'error' });
    }
  };

  const handleRemoveFavorite = async (id: string) => {
    try {
      await favoritesApi.toggle(id);
      setFavorites(favorites.filter(doc => doc.id !== id));
      enqueueSnackbar('Rimosso dai preferiti', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Errore', { variant: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo documento?')) return;
    try {
      await documentsApi.delete(id);
      setFavorites(favorites.filter(doc => doc.id !== id));
      enqueueSnackbar('Documento eliminato', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Errore durante l\'eliminazione', { variant: 'error' });
    }
  };

  const formatFileSize = (bytes: number) => {
    const kb = bytes / 1024;
    return kb > 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${kb.toFixed(2)} KB`;
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
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: 2,
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <Box sx={{ fontWeight: 600, mb: 1, fontSize: '1.1rem' }}>
                    {doc.supplier}
                  </Box>
                  <Box sx={{ fontSize: '0.875rem', color: 'text.secondary', mb: 1 }}>
                    Doc. {doc.docNumber}
                  </Box>
                  <Box sx={{ fontSize: '0.875rem', color: 'text.secondary', mb: 2 }}>
                    {format(new Date(doc.date), 'dd/MM/yyyy', { locale: it })} • {formatFileSize(doc.fileSize)}
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <IconButton size="small" onClick={() => handleRemoveFavorite(doc.id)}>
                      <Star color="primary" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handlePreview(doc)}>
                      <Visibility />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDownload(doc.id)}>
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

      {/* Modale Anteprima Documento */}
      <Dialog
        open={!!previewDoc}
        onClose={handleClosePreview}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Anteprima: {previewDoc?.supplier} - {previewDoc?.docNumber}
        </DialogTitle>
        <DialogContent>
          {previewUrl ? (
            <Box sx={{ width: '100%', height: '70vh' }}>
              <iframe
                src={previewUrl}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Anteprima documento"
              />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePreview}>Chiudi</Button>
          {previewDoc && (
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={() => {
                handleDownload(previewDoc.id);
                handleClosePreview();
              }}
            >
              Download
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
