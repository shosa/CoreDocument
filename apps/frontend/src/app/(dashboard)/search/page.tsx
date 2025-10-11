'use client';

import { useState } from 'react';
import {
  Box,
  TextField,
  CircularProgress,
  Grid,
  IconButton,
  Stack,
} from '@mui/material';
import { Search, Download, Star, StarBorder, Delete } from '@mui/icons-material';
import PageHeader from '@/components/PageHeader';
import Widget from '@/components/Widget';
import { documentsApi, favoritesApi } from '@/lib/api';
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

export default function SearchPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      const response = await documentsApi.search(searchQuery);
      setResults(response.data.data || response.data);
    } catch (error) {
      enqueueSnackbar('Errore durante la ricerca', { variant: 'error' });
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
      setResults(results.map(doc =>
        doc.id === id ? { ...doc, isFavorite: !doc.isFavorite } : doc
      ));
      enqueueSnackbar('Preferito aggiornato', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Errore', { variant: 'error' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Sei sicuro di voler eliminare questo documento?')) return;
    try {
      await documentsApi.delete(id);
      setResults(results.filter(doc => doc.id !== id));
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
        title="Ricerca Documenti"
        breadcrumbs={[{ label: 'Ricerca' }]}
      />

      <Widget>
        <TextField
          fullWidth
          placeholder="Cerca documenti per nome, fornitore, numero documento..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSearch()}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
          sx={{ mb: 3 }}
        />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {results.map(doc => (
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
                    {format(new Date(doc.date), 'dd/MM/yyyy')} - {formatFileSize(doc.fileSize)}
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <IconButton size="small" onClick={() => handleToggleFavorite(doc.id)}>
                      {doc.isFavorite ? <Star color="primary" /> : <StarBorder />}
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

        {!loading && results.length === 0 && searchQuery && (
          <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
            Nessun documento trovato.
          </Box>
        )}
      </Widget>
    </Box>
  );
}
