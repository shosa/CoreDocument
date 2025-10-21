'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  Collapse,
  Paper,
  Autocomplete,
  Typography,
} from '@mui/material';
import {
  Add,
  Delete,
  Download,
  Search as SearchIcon,
  ViewModule,
  ViewList,
  FilterList,
  Visibility,
  Clear,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import PageHeader from '@/components/PageHeader';
import Widget from '@/components/Widget';
import { documentsApi } from '@/lib/api';
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
}

const MONTHS = [
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

export default function DocumentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { enqueueSnackbar } = useSnackbar();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [showFilters, setShowFilters] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Filtri
  const [supplierFilter, setSupplierFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [docNumberFilter, setDocNumberFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');

  // Liste per filtri (caricate da TUTTO il database)
  const [allSuppliers, setAllSuppliers] = useState<string[]>([]);
  const [allYears, setAllYears] = useState<number[]>([]);

  // Initialize filters from URL query params
  useEffect(() => {
    const supplierParam = searchParams.get('supplier');
    const yearParam = searchParams.get('year');
    if (supplierParam) setSupplierFilter(supplierParam);
    if (yearParam) setYearFilter(yearParam);
  }, [searchParams]);

  // Carica liste filtri al mount
  useEffect(() => {
    loadFilterOptions();
  }, []);

  // Fetch documenti quando cambiano filtri
  useEffect(() => {
    fetchDocuments();
  }, [supplierFilter, yearFilter, monthFilter]);

  const loadFilterOptions = async () => {
    try {
      // Usa endpoint dedicato - molto più efficiente!
      const response = await documentsApi.getFiltersMetadata();
      const { suppliers, years } = response.data;

      setAllSuppliers(suppliers || []);
      setAllYears(years || []);
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      // Se non ci sono filtri, carica solo gli ultimi 25 documenti
      // Altrimenti carica fino a 1000 risultati filtrati
      const defaultLimit = (supplierFilter || yearFilter || monthFilter) ? 1000 : 25;
      const params: any = { limit: defaultLimit };

      if (supplierFilter) params.supplier = supplierFilter;
      if (yearFilter) params.year = parseInt(yearFilter);
      if (monthFilter) params.month = monthFilter;

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
      // Ricarica anche le opzioni filtri
      loadFilterOptions();
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

  const handleClearFilters = () => {
    setSupplierFilter('');
    setYearFilter('');
    setMonthFilter('');
    setDocNumberFilter('');
    setDateFromFilter('');
    setDateToFilter('');
    setSearchQuery('');
  };

  const formatFileSize = (bytes: number) => {
    const kb = bytes / 1024;
    return kb > 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${kb.toFixed(2)} KB`;
  };

  // Filtraggio avanzato locale
  const filteredDocuments = documents.filter(doc => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      doc.supplier?.toLowerCase().includes(searchLower) ||
      doc.docNumber?.toLowerCase().includes(searchLower) ||
      doc.filename?.toLowerCase().includes(searchLower);

    const matchesDocNumber =
      !docNumberFilter ||
      doc.docNumber?.toLowerCase().includes(docNumberFilter.toLowerCase());

    const matchesDateFrom =
      !dateFromFilter || new Date(doc.date) >= new Date(dateFromFilter);

    const matchesDateTo =
      !dateToFilter || new Date(doc.date) <= new Date(dateToFilter);

    return matchesSearch && matchesDocNumber && matchesDateFrom && matchesDateTo;
  });

  const activeFiltersCount = [
    supplierFilter,
    yearFilter,
    monthFilter,
    docNumberFilter,
    dateFromFilter,
    dateToFilter,
    searchQuery
  ].filter(Boolean).length;

  const columns: GridColDef[] = [
    {
      field: 'supplier',
      headerName: 'Fornitore',
      flex: 1,
      minWidth: 180,
    },
    {
      field: 'docNumber',
      headerName: 'Numero Documento',
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
      width: 160,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', height: '100%' }}>
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
        title="Documenti"
        action={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => router.push('/documents/new')}
          >
            Carica Nuovo
          </Button>
        }
      />

      <Widget>
        {/* Barra Ricerca e Controlli */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Cerca per fornitore, numero documento o nome file..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.disabled' }} />,
                  endAdornment: searchQuery && (
                    <IconButton size="small" onClick={() => setSearchQuery('')}>
                      <Clear fontSize="small" />
                    </IconButton>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  variant={showFilters ? 'contained' : 'outlined'}
                  startIcon={showFilters ? <ExpandLess /> : <ExpandMore />}
                  onClick={() => setShowFilters(!showFilters)}
                  endIcon={activeFiltersCount > 0 && (
                    <Chip label={activeFiltersCount} size="small" color="primary" />
                  )}
                >
                  Filtri Avanzati
                </Button>
                <ToggleButtonGroup
                  value={viewMode}
                  exclusive
                  onChange={(_, newMode) => newMode && setViewMode(newMode)}
                  size="small"
                >
                  <ToggleButton value="table">
                    <ViewList />
                  </ToggleButton>
                  <ToggleButton value="grid">
                    <ViewModule />
                  </ToggleButton>
                </ToggleButtonGroup>
              </Stack>
            </Grid>
          </Grid>
        </Box>

        {/* Pannello Filtri Avanzati */}
        <Collapse in={showFilters}>
          <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Autocomplete
                  options={allSuppliers}
                  value={supplierFilter}
                  onChange={(_, newValue) => setSupplierFilter(newValue || '')}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Fornitore"
                      size="small"
                      placeholder="Tutti"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Anno</InputLabel>
                  <Select
                    value={yearFilter}
                    label="Anno"
                    onChange={(e) => setYearFilter(e.target.value)}
                  >
                    <MenuItem value="">Tutti</MenuItem>
                    {allYears.map(year => (
                      <MenuItem key={year} value={year.toString()}>{year}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Mese</InputLabel>
                  <Select
                    value={monthFilter}
                    label="Mese"
                    onChange={(e) => setMonthFilter(e.target.value)}
                    disabled={!yearFilter}
                  >
                    <MenuItem value="">Tutti</MenuItem>
                    {MONTHS.map(month => (
                      <MenuItem key={month.value} value={month.value}>{month.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Numero Documento"
                  placeholder="es. DDT001"
                  value={docNumberFilter}
                  onChange={(e) => setDocNumberFilter(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={1.5}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Data Da"
                  value={dateFromFilter}
                  onChange={(e) => setDateFromFilter(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={1.5}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Data A"
                  value={dateToFilter}
                  onChange={(e) => setDateToFilter(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<Clear />}
                onClick={handleClearFilters}
                disabled={activeFiltersCount === 0}
              >
                Cancella Filtri
              </Button>
            </Box>
          </Paper>
        </Collapse>

        {/* Risultati */}
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {filteredDocuments.length} documento{filteredDocuments.length !== 1 ? 'i' : ''}
            {!supplierFilter && !yearFilter && !monthFilter && ' (ultimi 25)'}
          </Typography>
          {!supplierFilter && !yearFilter && !monthFilter && (
            <Typography variant="caption" color="text.secondary">
              Usa i filtri per cercare documenti specifici
            </Typography>
          )}
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : viewMode === 'table' ? (
          <DataGrid
            rows={filteredDocuments}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 25 },
              },
            }}
            pageSizeOptions={[25, 50, 100]}
            disableRowSelectionOnClick
            sx={{ minHeight: 400 }}
            localeText={{
              noRowsLabel: 'Nessun documento trovato',
              MuiTablePagination: {
                labelRowsPerPage: 'Righe per pagina:',
              },
            }}
          />
        ) : (
          <Grid container spacing={2}>
            {filteredDocuments.map((doc) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={doc.id}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 2,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    '&:hover': {
                      boxShadow: 4,
                      cursor: 'pointer',
                    },
                  }}
                  onClick={() => handlePreview(doc)}
                >
                  <Typography variant="subtitle2" gutterBottom noWrap>
                    {doc.supplier}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {doc.docNumber}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    {format(new Date(doc.date), 'dd/MM/yyyy', { locale: it })}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatFileSize(doc.fileSize)}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 'auto', pt: 2 }}>
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
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Widget>

      {/* Modale Anteprima */}
      <Dialog
        open={!!previewDoc}
        onClose={handleClosePreview}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {previewDoc?.supplier} - {previewDoc?.docNumber}
        </DialogTitle>
        <DialogContent>
          {previewUrl ? (
            <Box sx={{ width: '100%', height: '70vh' }}>
              <iframe
                src={previewUrl}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Anteprima Documento"
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
              onClick={() => handleDownload(previewDoc.id)}
            >
              Scarica
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
