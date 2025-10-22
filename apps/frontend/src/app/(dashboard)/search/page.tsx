'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  CircularProgress,
  Grid,
  IconButton,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Search, Download, Delete, FilterList, Clear, Visibility } from '@mui/icons-material';
import PageHeader from '@/components/PageHeader';
import Widget from '@/components/Widget';
import { documentsApi } from '@/lib/api';
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
}

export default function SearchPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Filtri
  const [supplierFilter, setSupplierFilter] = useState('');
  const [yearFilter, setYearFilter] = useState<string>('');
  const [monthFilter, setMonthFilter] = useState('');

  const months = [
    { value: 'January', label: 'Gennaio' },
    { value: 'February', label: 'Febbraio' },
    { value: 'March', label: 'Marzo' },
    { value: 'April', label: 'Aprile' },
    { value: 'May', label: 'Maggio' },
    { value: 'June', label: 'Giugno' },
    { value: 'July', label: 'Luglio' },
    { value: 'August', label: 'Agosto' },
    { value: 'September', label: 'Settembre' },
    { value: 'October', label: 'Ottobre' },
    { value: 'November', label: 'Novembre' },
    { value: 'December', label: 'Dicembre' },
  ];

  useEffect(() => {
    loadFilters();
  }, []);

  const loadFilters = async () => {
    try {
      // Usa endpoint dedicato - molto più efficiente!
      const response = await documentsApi.getFiltersMetadata();
      const { suppliers: uniqueSuppliers, years: uniqueYears } = response.data;

      setSuppliers(uniqueSuppliers || []);
      setYears(uniqueYears || []);
    } catch (error) {
      console.error('Error loading filters:', error);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 1000 };
      if (supplierFilter) params.supplier = supplierFilter;
      if (yearFilter) params.year = parseInt(yearFilter);
      if (monthFilter) params.month = monthFilter;

      const response = await documentsApi.list(params);
      let docs = response.data.data || response.data || [];

      // Filtra localmente per query di testo
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        docs = docs.filter((doc: Document) =>
          doc.supplier?.toLowerCase().includes(query) ||
          doc.docNumber?.toLowerCase().includes(query)
        );
      }

      setResults(docs);
    } catch (error) {
      enqueueSnackbar('Errore durante la ricerca', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSupplierFilter('');
    setYearFilter('');
    setMonthFilter('');
    setResults([]);
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

  const handleDelete = async (id: string) => {
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
    const kb = bytes / 1024;
    return kb > 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${kb.toFixed(2)} KB`;
  };

  return (
    <Box>
      <PageHeader
        title="Ricerca Documenti"
        breadcrumbs={[{ label: 'Ricerca' }]}
      />

      <Widget>
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Cerca per fornitore o numero documento..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSearch()}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
        </Box>

        {/* Filtri avanzati */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
            <FilterList />
            <Box sx={{ fontWeight: 600 }}>Filtri Avanzati</Box>
            {(supplierFilter || yearFilter || monthFilter) && (
              <Chip
                label={`${[supplierFilter, yearFilter, monthFilter].filter(Boolean).length} attivi`}
                size="small"
                color="primary"
              />
            )}
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Fornitore</InputLabel>
                <Select
                  value={supplierFilter}
                  label="Fornitore"
                  onChange={e => setSupplierFilter(e.target.value)}
                >
                  <MenuItem value="">Tutti</MenuItem>
                  {suppliers.map(supplier => (
                    <MenuItem key={supplier} value={supplier}>{supplier}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Anno</InputLabel>
                <Select
                  value={yearFilter}
                  label="Anno"
                  onChange={e => setYearFilter(e.target.value)}
                >
                  <MenuItem value="">Tutti</MenuItem>
                  {years.map(year => (
                    <MenuItem key={year} value={year.toString()}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Mese</InputLabel>
                <Select
                  value={monthFilter}
                  label="Mese"
                  onChange={e => setMonthFilter(e.target.value)}
                >
                  <MenuItem value="">Tutti</MenuItem>
                  {months.map(month => (
                    <MenuItem key={month.value} value={month.value}>{month.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Stack direction="row" spacing={1} sx={{ height: '100%' }}>
                <Button
                  variant="contained"
                  onClick={handleSearch}
                  fullWidth
                  sx={{ height: '40px' }}
                >
                  Cerca
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleClearFilters}
                  sx={{ height: '40px', minWidth: '40px', p: 0 }}
                >
                  <Clear />
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Box>

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

        {!loading && results.length === 0 && (searchQuery || supplierFilter || yearFilter || monthFilter) && (
          <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
            Nessun documento trovato con i filtri selezionati.
          </Box>
        )}

        {!loading && results.length === 0 && !searchQuery && !supplierFilter && !yearFilter && !monthFilter && (
          <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
            Usa i filtri sopra per cercare documenti.
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
