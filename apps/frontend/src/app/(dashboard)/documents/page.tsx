'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  IconButton,
  CircularProgress,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add,
  Delete,
  Download,
  Search,
  ViewModule,
  ViewList,
  FilterList,
  Star,
  StarBorder,
  Visibility,
} from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import PageHeader from '@/components/PageHeader';
import Widget from '@/components/Widget';
import { documentsApi, favoritesApi } from '@/lib/api';
import { useSnackbar } from 'notistack';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

type ViewMode = 'grid' | 'table';

interface Document {
  id: string;
  filename: string;
  supplier: string;
  docNumber: string;
  date: string;
  month: string;
  year: number;
  fileSize: number;
  fileExtension: string;
  createdAt: string;
  isFavorite?: boolean;
}

export default function DocumentsPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, [supplierFilter, yearFilter]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (supplierFilter) params.supplier = supplierFilter;
      if (yearFilter) params.year = yearFilter;

      const response = await documentsApi.list(params);
      setDocuments(response.data.data || response.data);
    } catch (error: any) {
      enqueueSnackbar('Errore nel caricamento dei documenti', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo documento?')) return;
    try {
      await documentsApi.delete(id);
      enqueueSnackbar('Documento eliminato', { variant: 'success' });
      fetchDocuments();
    } catch (error: any) {
      enqueueSnackbar('Errore durante l\'eliminazione', { variant: 'error' });
    }
  };

  const handleDownload = async (id: string) => {
    try {
      const response = await documentsApi.download(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const doc = documents.find(d => d.id === id);
      link.setAttribute('download', doc?.filename || 'document');
      document.body.appendChild(link);
      link.click();
      link.remove();
      enqueueSnackbar('Download avviato', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Errore durante il download', { variant: 'error' });
    }
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      await favoritesApi.toggle(id);
      fetchDocuments();
      enqueueSnackbar('Preferito aggiornato', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Errore', { variant: 'error' });
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

  const formatFileSize = (bytes: number) => {
    const kb = bytes / 1024;
    return kb > 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${kb.toFixed(2)} KB`;
  };

  // Get unique suppliers and years
  const suppliers = [...new Set(documents.map(d => d.supplier))].filter(Boolean).sort();
  const years = [...new Set(documents.map(d => d.year))].sort((a, b) => b - a);

  // Filtraggio
  const filteredDocuments = documents.filter(doc => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      doc.filename?.toLowerCase().includes(searchLower) ||
      doc.supplier?.toLowerCase().includes(searchLower) ||
      doc.docNumber?.toLowerCase().includes(searchLower);

    return matchesSearch;
  });

  const columns: GridColDef[] = [
    {
      field: 'filename',
      headerName: 'Nome File',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'supplier',
      headerName: 'Fornitore',
      width: 180,
    },
    {
      field: 'docNumber',
      headerName: 'Numero Doc',
      width: 150,
    },
    {
      field: 'date',
      headerName: 'Data',
      width: 120,
      valueFormatter: (value) => format(new Date(value), 'dd/MM/yyyy', { locale: it }),
    },
    {
      field: 'fileSize',
      headerName: 'Dimensione',
      width: 120,
      valueFormatter: (value) => formatFileSize(value),
    },
    {
      field: 'actions',
      headerName: 'Azioni',
      width: 200,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', height: '100%' }}>
          <IconButton
            size="small"
            onClick={() => handleToggleFavorite(params.row.id)}
            title={params.row.isFavorite ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
          >
            {params.row.isFavorite ? <Star color="primary" fontSize="small" /> : <StarBorder fontSize="small" />}
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handlePreview(params.row)}
            title="Anteprima"
            sx={{
              bgcolor: 'black',
              color: 'white',
              borderRadius: '6px',
              '&:hover': { bgcolor: 'grey.800' },
            }}
          >
            <Visibility fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDownload(params.row.id)}
            title="Scarica"
            sx={{
              bgcolor: 'black',
              color: 'white',
              borderRadius: '6px',
              '&:hover': { bgcolor: 'grey.800' },
            }}
          >
            <Download fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDelete(params.row.id)}
            title="Elimina"
            sx={{
              bgcolor: 'black',
              color: 'white',
              borderRadius: '6px',
              '&:hover': { bgcolor: 'grey.800' },
            }}
          >
            <Delete fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Documenti DDT Arrivo Merce"
        breadcrumbs={[{ label: 'Documenti' }]}
        renderRight={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => router.push('/documents/new')}
          >
            Carica Documento
          </Button>
        }
      />

      <Widget>
        {/* Toolbar */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            fullWidth
            placeholder="Cerca per nome, fornitore o numero documento..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
            sx={{ flex: 1, minWidth: 250 }}
          />

          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, newMode) => newMode && setViewMode(newMode)}
            size="small"
          >
            <ToggleButton value="table" aria-label="vista tabella">
              <ViewList />
            </ToggleButton>
            <ToggleButton value="grid" aria-label="vista griglia">
              <ViewModule />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Filtri */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
            <FilterList />
            <Box sx={{ fontWeight: 600 }}>Filtri</Box>
            {(supplierFilter || yearFilter) && (
              <Chip
                label={`${[supplierFilter, yearFilter].filter(Boolean).length} attivi`}
                size="small"
                color="primary"
              />
            )}
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
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

            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Anno</InputLabel>
                <Select
                  value={yearFilter}
                  label="Anno"
                  onChange={e => setYearFilter(e.target.value)}
                >
                  <MenuItem value="">Tutti</MenuItem>
                  {years.map(year => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        {/* Contenuto */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : viewMode === 'table' ? (
          <DataGrid
            rows={filteredDocuments}
            columns={columns}
            autoHeight
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 25 } },
            }}
            disableRowSelectionOnClick
            sx={{
              border: 0,
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid',
                borderColor: 'divider',
              },
            }}
          />
        ) : (
          <Grid container spacing={3}>
            {filteredDocuments.map(doc => (
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

        {!loading && filteredDocuments.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
            Nessun documento trovato.
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
          Anteprima: {previewDoc?.filename}
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
              Scarica
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
