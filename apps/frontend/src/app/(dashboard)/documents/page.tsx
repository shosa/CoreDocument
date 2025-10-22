'use client';

// Force dynamic rendering - questa pagina usa useSearchParams e API calls
export const dynamic = 'force-dynamic';

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
  Collapse,
  Paper,
  Autocomplete,
  Typography,
} from '@mui/material';
import {
  Add,
  Delete,
  Download,
  Edit,
  Search as SearchIcon,
  ViewModule,
  ViewList,
  FilterList,
  Visibility,
  Clear,
  ExpandMore,
  ExpandLess,
  FileDownload,
} from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import PageHeader from '@/components/PageHeader';
import Widget from '@/components/Widget';
import { documentsApi } from '@/lib/api';
import { useSnackbar } from 'notistack';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { useAuthStore } from '@/store/authStore';

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
  const { enqueueSnackbar } = useSnackbar();
  const { isAuthenticated } = useAuthStore();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [showFilters, setShowFilters] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [bulkDownloadDialog, setBulkDownloadDialog] = useState(false);

  // Filtri
  const [supplierFilter, setSupplierFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [docNumberFilter, setDocNumberFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');

  // Filtri per bulk download
  const [bulkSupplier, setBulkSupplier] = useState('');
  const [bulkDateFrom, setBulkDateFrom] = useState('');
  const [bulkDateTo, setBulkDateTo] = useState('');

  // Liste per filtri (caricate da TUTTO il database)
  const [allSuppliers, setAllSuppliers] = useState<string[]>([]);
  const [allYears, setAllYears] = useState<number[]>([]);

  // Traccia l'URL corrente per detectare cambiamenti da Global Search
  const [currentUrl, setCurrentUrl] = useState('');

  // Initialize filters from URL query params (usando window.location per evitare useSearchParams)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const supplierParam = params.get('supplier');
      const yearParam = params.get('year');
      const docIdParam = params.get('docId');

      if (supplierParam) setSupplierFilter(supplierParam);
      if (yearParam) setYearFilter(yearParam);

      // Se c'è docId, carica quel documento e apri preview
      if (docIdParam) {
        loadAndPreviewDocument(docIdParam);
      }

      // Salva URL corrente
      setCurrentUrl(window.location.href);
    }
  }, []);

  // Monitora cambiamenti URL (per navigazione da Global Search mentre sei già su /documents)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkUrlChange = setInterval(() => {
      if (window.location.href !== currentUrl) {
        setCurrentUrl(window.location.href);

        const params = new URLSearchParams(window.location.search);
        const docIdParam = params.get('docId');

        if (docIdParam) {
          loadAndPreviewDocument(docIdParam);
        }
      }
    }, 100);

    return () => clearInterval(checkUrlChange);
  }, [currentUrl]);

  // Carica liste filtri al mount
  useEffect(() => {
    loadFilterOptions();
  }, []);

  // Fetch documenti quando cambiano filtri
  useEffect(() => {
    fetchDocuments();
  }, [supplierFilter, yearFilter, monthFilter, searchQuery]);

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

      const params: any = { limit: 10000 };

      // Se c'è una ricerca testuale, usa Meilisearch
      if (searchQuery && searchQuery.trim()) {
        params.q = searchQuery;
        if (supplierFilter) params.supplier = supplierFilter;
        if (yearFilter) params.year = parseInt(yearFilter);
        if (monthFilter) params.month = monthFilter;

        const response = await documentsApi.search(params);
        setDocuments(response.data.data || response.data);
        return;
      }

      // Controlla se ci sono filtri attivi (escluso searchQuery già gestito)
      const hasActiveFilters = supplierFilter || yearFilter || monthFilter || docNumberFilter || dateFromFilter || dateToFilter;

      if (supplierFilter) {
        params.supplier = supplierFilter;
      }
      if (yearFilter) {
        params.year = parseInt(yearFilter);
      }
      if (monthFilter) {
        params.month = monthFilter;
      }

      // Se nessun filtro è impostato, mostra solo mese corrente
      if (!hasActiveFilters) {
        const now = new Date();
        const currentYear = now.getFullYear();
        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const currentMonth = monthNames[now.getMonth()];

        params.year = currentYear;
        params.month = currentMonth;
      }

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

  const loadAndPreviewDocument = async (docId: string) => {
    try {
      // Carica il documento specifico
      const response = await documentsApi.get(docId);
      const doc = response.data;

      // Aggiungi alla lista se non c'è già
      setDocuments(prev => {
        const exists = prev.find(d => d.id === docId);
        return exists ? prev : [doc, ...prev];
      });

      // Apri preview
      setPreviewDoc(doc);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003/api';
      setPreviewUrl(`${apiUrl}/documents/${doc.id}/view`);
    } catch (error) {
      enqueueSnackbar('Documento non trovato', { variant: 'error' });
    }
  };

  const handlePreview = async (doc: Document) => {
    try {
      setPreviewDoc(doc);
      // Usa l'endpoint /api/documents/:id/view che fa da proxy
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003/api';
      setPreviewUrl(`${apiUrl}/documents/${doc.id}/view`);
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

  const handleBulkDownload = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003/api';
      const params = new URLSearchParams();

      if (bulkSupplier) params.append('supplier', bulkSupplier);
      if (bulkDateFrom) params.append('dateFrom', bulkDateFrom);
      if (bulkDateTo) params.append('dateTo', bulkDateTo);

      const url = `${apiUrl}/documents/bulk-download/zip?${params.toString()}`;

      // Apri il download in una nuova finestra
      window.open(url, '_blank');

      enqueueSnackbar('Download ZIP avviato', { variant: 'success' });
      setBulkDownloadDialog(false);
    } catch (error) {
      enqueueSnackbar('Errore durante il download bulk', { variant: 'error' });
    }
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
      width: 200,
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
          {isAuthenticated && (
            <>
              <IconButton
                size="small"
                onClick={() => router.push(`/documents/${params.row.id}/edit`)}
                title="Modifica"
                sx={{
                  bgcolor: 'black',
                  color: 'white',
                  borderRadius: '6px',
                  '&:hover': { bgcolor: 'grey.800' },
                }}
              >
                <Edit fontSize="small" />
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
            </>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Documenti"
        renderRight={
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<FileDownload />}
              onClick={() => setBulkDownloadDialog(true)}
            >
              Download ZIP
            </Button>
            {isAuthenticated && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => router.push('/documents/new')}
              >
                Carica Nuovo
              </Button>
            )}
          </Stack>
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

        {/* Info documenti visualizzati */}
        {!supplierFilter && !yearFilter && !monthFilter && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Visualizzazione documenti del mese corrente. Usa i filtri per cercare in altri periodi.
            </Typography>
          </Box>
        )}

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
            {!supplierFilter && !yearFilter && !monthFilter && ' (mese corrente)'}
          </Typography>
          {!supplierFilter && !yearFilter && !monthFilter && (
            <Typography variant="caption" color="text.secondary">
              Usa i filtri per cercare documenti in altri periodi
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
                    {isAuthenticated && (
                      <>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); router.push(`/documents/${doc.id}/edit`); }}>
                          <Edit />
                        </IconButton>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}>
                          <Delete />
                        </IconButton>
                      </>
                    )}
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

      {/* Dialog Bulk Download */}
      <Dialog
        open={bulkDownloadDialog}
        onClose={() => setBulkDownloadDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Download ZIP Documenti</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Scarica più documenti in formato ZIP. Puoi filtrare per fornitore e/o periodo.
          </Typography>

          <Stack spacing={3}>
            <Autocomplete
              options={allSuppliers}
              value={bulkSupplier}
              onChange={(_, newValue) => setBulkSupplier(newValue || '')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Fornitore (opzionale)"
                  placeholder="Seleziona fornitore"
                />
              )}
            />

            <TextField
              label="Data da"
              type="date"
              value={bulkDateFrom}
              onChange={(e) => setBulkDateFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <TextField
              label="Data a"
              type="date"
              value={bulkDateTo}
              onChange={(e) => setBulkDateTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <Typography variant="caption" color="text.secondary">
              Lascia i campi vuoti per scaricare tutti i documenti. I file saranno organizzati per fornitore/anno/mese.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDownloadDialog(false)}>Annulla</Button>
          <Button
            variant="contained"
            startIcon={<FileDownload />}
            onClick={handleBulkDownload}
          >
            Scarica ZIP
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
