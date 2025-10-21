'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Grid,
  Typography,
  CircularProgress,
  IconButton,
  Stack,
  Chip,
  Paper,
  Card,
  CardContent,
  ToggleButtonGroup,
  ToggleButton,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import {
  ArrowBack,
  Download,
  Star,
  StarBorder,
  Visibility,
  Delete,
  Description,
  CalendarMonth,
  TrendingUp,
  ViewList,
  ViewModule,
  Search,
} from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import PageHeader from '@/components/PageHeader';
import Widget from '@/components/Widget';
import StatCard from '@/components/StatCard';
import { documentsApi, favoritesApi } from '@/lib/api';
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
  year: number;
  month: string;
  isFavorite?: boolean;
}

type ViewMode = 'table' | 'grid';

export default function SupplierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const supplierName = decodeURIComponent(params.supplier as string);

  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    thisMonth: 0,
    thisYear: 0,
  });

  useEffect(() => {
    fetchDocuments();
  }, [supplierName]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await documentsApi.list({ supplier: supplierName, limit: 10000 });
      const docs = response.data.data || response.data || [];
      setDocuments(docs);

      // Calcola statistiche
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];

      const thisMonthCount = docs.filter((doc: Document) => {
        const docDate = new Date(doc.date);
        return docDate.getMonth() === currentMonth && docDate.getFullYear() === currentYear;
      }).length;

      const thisYearCount = docs.filter((doc: Document) => {
        const docDate = new Date(doc.date);
        return docDate.getFullYear() === currentYear;
      }).length;

      setStats({
        total: docs.length,
        thisMonth: thisMonthCount,
        thisYear: thisYearCount,
      });
    } catch (error) {
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
    } catch (error) {
      enqueueSnackbar('Errore durante l\'eliminazione', { variant: 'error' });
    }
  };

  const handleDownload = async (id: string) => {
    try {
      const response = await documentsApi.getDownloadUrl(id);
      window.open(response.data.url, '_blank');
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

  const formatFileSize = (bytes: number) => {
    const kb = bytes / 1024;
    return kb > 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${kb.toFixed(2)} KB`;
  };

  // Raggruppa per anno e mese
  const documentsByYear = documents.reduce((acc, doc) => {
    if (!acc[doc.year]) acc[doc.year] = 0;
    acc[doc.year]++;
    return acc;
  }, {} as Record<number, number>);

  const documentsByMonth = documents.reduce((acc, doc) => {
    if (!acc[doc.month]) acc[doc.month] = 0;
    acc[doc.month]++;
    return acc;
  }, {} as Record<string, number>);

  // Filtro documenti per ricerca
  const filteredDocuments = documents.filter(doc => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return doc.docNumber.toLowerCase().includes(query);
  });

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

  const columns: GridColDef[] = [
    {
      field: 'docNumber',
      headerName: 'Numero Documento',
      flex: 1,
      minWidth: 150,
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
      width: 240,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', height: '100%' }}>
          <IconButton
            size="small"
            onClick={() => handleToggleFavorite(params.row.id)}
            title={params.row.isFavorite ? 'Rimuovi preferito' : 'Aggiungi preferito'}
            sx={{
              bgcolor: 'black',
              color: params.row.isFavorite ? '#FFD700' : 'white',
              borderRadius: '6px',
              '&:hover': { bgcolor: 'grey.800' },
            }}
          >
            {params.row.isFavorite ? <Star fontSize="small" /> : <StarBorder fontSize="small" />}
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
            title="Download"
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
        title={supplierName}
        breadcrumbs={[
          { label: 'Fornitori', href: '/suppliers' },
          { label: supplierName }
        ]}
        renderLeft={
          <IconButton onClick={() => router.push('/suppliers')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
        }
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Statistiche */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <StatCard
                title="Totale Documenti"
                value={stats.total}
                icon={<Description />}
                color="primary"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard
                title="Questo Anno"
                value={stats.thisYear}
                icon={<CalendarMonth />}
                color="success"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard
                title="Questo Mese"
                value={stats.thisMonth}
                icon={<TrendingUp />}
                color="warning"
              />
            </Grid>
          </Grid>

          {/* Distribuzione per anno */}
          <Widget>
            <Typography variant="h6" gutterBottom>
              Distribuzione Documenti
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {Object.entries(documentsByYear)
                .sort(([a], [b]) => Number(b) - Number(a))
                .map(([year, count]) => (
                  <Grid item key={year}>
                    <Chip
                      label={`${year}: ${count} doc.`}
                      color="primary"
                      variant="outlined"
                    />
                  </Grid>
                ))}
            </Grid>
          </Widget>

          {/* Lista documenti */}
          <Widget>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                Documenti ({filteredDocuments.length})
              </Typography>
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

            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Cerca per numero documento..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {viewMode === 'table' ? (
              <DataGrid
                rows={filteredDocuments}
                columns={columns}
                autoHeight
                pageSizeOptions={[10, 25, 50, 100]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 25 } },
                  sorting: { sortModel: [{ field: 'date', sort: 'desc' }] },
                }}
                disableRowSelectionOnClick
                sx={{
                  '& .MuiDataGrid-cell:focus': { outline: 'none' },
                  '& .MuiDataGrid-row:hover': { bgcolor: 'action.hover' },
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
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: 'primary.main',
                          boxShadow: 2,
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      <Box sx={{ fontWeight: 600, mb: 1, fontSize: '1.1rem' }}>
                        Doc. {doc.docNumber}
                      </Box>
                      <Box sx={{ fontSize: '0.875rem', color: 'text.secondary', mb: 2 }}>
                        {format(new Date(doc.date), 'dd/MM/yyyy', { locale: it })} • {formatFileSize(doc.fileSize)}
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

            {filteredDocuments.length === 0 && searchQuery && (
              <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                Nessun documento trovato con questa ricerca.
              </Box>
            )}

            {documents.length === 0 && !searchQuery && (
              <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                Nessun documento trovato per questo fornitore.
              </Box>
            )}
          </Widget>
        </>
      )}

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
