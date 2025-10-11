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
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Add,
  Delete,
  Download,
  Search,
  ViewModule,
  ViewList,
  FilterList,
  FileDownload,
  GetApp,
} from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import PageHeader from '@/components/PageHeader';
import DocumentCard from '@/components/DocumentCard';
import Widget from '@/components/Widget';
import axiosInstance from '@/lib/axios';
import { useSnackbar } from 'notistack';
import { Document } from '@/types';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

type ViewMode = 'grid' | 'table';
type SortOption = 'fileName' | 'date' | 'size' | 'category' | 'newest' | 'oldest';

interface Filters {
  documentCategory: string;
  machine: string;
}

export default function DocumentsPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);

  const [filters, setFilters] = useState<Filters>({
    documentCategory: '',
    machine: '',
  });

  useEffect(() => {
    fetchDocuments();
    fetchMachines();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/documents');
      setDocuments(response.data.data || response.data);
    } catch (error: any) {
      enqueueSnackbar('Errore nel caricamento dei documenti', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchMachines = async () => {
    try {
      const response = await axiosInstance.get('/machines');
      setMachines(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching machines:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo documento?')) return;
    try {
      await axiosInstance.delete(`/documents/${id}`);
      enqueueSnackbar('Documento eliminato', { variant: 'success' });
      fetchDocuments();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Errore durante l'eliminazione";
      enqueueSnackbar(errorMessage, { variant: 'error' });
    }
  };

  const handleDownload = async (id: string) => {
    try {
      const response = await axiosInstance.get(`/documents/${id}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const doc = documents.find(d => String(d.id) === String(id));
      link.setAttribute('download', doc?.fileName || 'download');
      document.body.appendChild(link);
      link.click();
      link.remove();
      enqueueSnackbar('Download avviato', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Errore durante il download', { variant: 'error' });
    }
  };

  const handleClearFilters = () => {
    setFilters({
      documentCategory: '',
      machine: '',
    });
    setSearchQuery('');
  };

  const handleExportCSV = () => {
    const headers = ['Nome File', 'Macchinario', 'Categoria', 'Dimensione', 'Data Caricamento'];
    const rows = filteredAndSortedDocuments.map(d => [
      d.fileName,
      d.machine?.serialNumber || '',
      categoryLabels[d.documentCategory] || d.documentCategory,
      formatFileSize(d.fileSize || 0),
      format(new Date(d.uploadedAt || new Date()), 'dd/MM/yyyy'),
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `documenti-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportMenuAnchor(null);
    enqueueSnackbar('Export CSV completato', { variant: 'success' });
  };

  const handleExportJSON = () => {
    const data = JSON.stringify(filteredAndSortedDocuments, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `documenti-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportMenuAnchor(null);
    enqueueSnackbar('Export JSON completato', { variant: 'success' });
  };

  const categoryLabels: Record<string, string> = {
    manuale_uso: "Manuale d'uso",
    certificazione_ce: 'Certificazione CE',
    scheda_tecnica: 'Scheda Tecnica',
    fattura_acquisto: 'Fattura Acquisto',
    altro: 'Altro',
  };

  const formatFileSize = (bytes: number) => {
    const kb = bytes / 1024;
    return kb > 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${kb.toFixed(2)} KB`;
  };

  // Filtraggio
  let filteredDocuments = documents.filter(document => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      document.fileName?.toLowerCase().includes(searchLower) ||
      document.machine?.serialNumber?.toLowerCase().includes(searchLower);

    const matchesCategory =
      !filters.documentCategory || document.documentCategory === filters.documentCategory;
    const matchesMachine =
      !filters.machine || String(document.machine?.id) === String(filters.machine);

    return matchesSearch && matchesCategory && matchesMachine;
  });

  // Ordinamento
  const filteredAndSortedDocuments = [...filteredDocuments].sort((a, b) => {
    switch (sortBy) {
      case 'fileName':
        return (a.fileName || '').localeCompare(b.fileName || '');
      case 'date':
        return new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime();
      case 'size':
        return (b.fileSize || 0) - (a.fileSize || 0);
      case 'category':
        return (a.documentCategory || '').localeCompare(b.documentCategory || '');
      case 'newest':
        return new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime();
      case 'oldest':
        return new Date(a.uploadedAt || 0).getTime() - new Date(b.uploadedAt || 0).getTime();
      default:
        return 0;
    }
  });

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  const columns: GridColDef[] = [
    { field: 'fileName', headerName: 'Nome File', flex: 1 },
    {
      field: 'machine',
      headerName: 'Macchinario',
      flex: 1,
      minWidth: 200,
      valueGetter: (value, row) => {
        const machine = row.machine;
        if (!machine) return '-';
        const model = machine.model || machine.manufacturer || '';
        const serial = machine.serialNumber || '';
        return model ? `${model} (${serial})` : serial;
      },
    },
    {
      field: 'documentCategory',
      headerName: 'Categoria',
      width: 180,
      valueFormatter: value => categoryLabels[value] || value,
    },
    {
      field: 'fileSize',
      headerName: 'Dimensione',
      width: 120,
      valueFormatter: value => formatFileSize(value),
    },
    {
      field: 'uploadedAt',
      headerName: 'Caricato il',
      width: 150,
      valueFormatter: value => format(new Date(value), 'dd/MM/yyyy', { locale: it }),
    },
    {
      field: 'actions',
      headerName: 'Azioni',
      width: 120,
      sortable: false,
      renderCell: params => (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', height: '100%' }}>
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
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Documenti' }]}
        renderRight={
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<FileDownload />}
              onClick={e => setExportMenuAnchor(e.currentTarget)}
            >
              Esporta
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => router.push('/documents/new')}
            >
              Carica Documento
            </Button>
          </Stack>
        }
      />

      <Menu
        anchorEl={exportMenuAnchor}
        open={Boolean(exportMenuAnchor)}
        onClose={() => setExportMenuAnchor(null)}
      >
        <MenuItem onClick={handleExportCSV}>
          <ListItemIcon>
            <GetApp fontSize="small" />
          </ListItemIcon>
          <ListItemText>Esporta CSV</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleExportJSON}>
          <ListItemIcon>
            <GetApp fontSize="small" />
          </ListItemIcon>
          <ListItemText>Esporta JSON</ListItemText>
        </MenuItem>
      </Menu>

      <Widget>
        {/* Toolbar */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            fullWidth
            placeholder="Cerca per nome file o macchinario..."
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

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Ordina per</InputLabel>
            <Select
              value={sortBy}
              label="Ordina per"
              onChange={e => setSortBy(e.target.value as SortOption)}
            >
              <MenuItem value="fileName">Nome File</MenuItem>
              <MenuItem value="date">Data Caricamento</MenuItem>
              <MenuItem value="size">Dimensione</MenuItem>
              <MenuItem value="category">Categoria</MenuItem>
              <MenuItem value="newest">Più recenti</MenuItem>
              <MenuItem value="oldest">Più vecchi</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Filtri */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Box
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterList />
              <Box sx={{ fontWeight: 600 }}>Filtri</Box>
              {activeFiltersCount > 0 && (
                <Chip label={`${activeFiltersCount} attivi`} size="small" color="primary" />
              )}
            </Box>
            {activeFiltersCount > 0 && (
              <Button size="small" onClick={handleClearFilters}>
                Pulisci filtri
              </Button>
            )}
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Categoria</InputLabel>
                <Select
                  value={filters.documentCategory}
                  label="Categoria"
                  onChange={e => setFilters({ ...filters, documentCategory: e.target.value })}
                >
                  <MenuItem value="">Tutte</MenuItem>
                  <MenuItem value="manuale_uso">Manuale d'uso</MenuItem>
                  <MenuItem value="certificazione_ce">Certificazione CE</MenuItem>
                  <MenuItem value="scheda_tecnica">Scheda Tecnica</MenuItem>
                  <MenuItem value="fattura_acquisto">Fattura Acquisto</MenuItem>
                  <MenuItem value="altro">Altro</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Macchinario</InputLabel>
                <Select
                  value={filters.machine}
                  label="Macchinario"
                  onChange={e => setFilters({ ...filters, machine: e.target.value })}
                >
                  <MenuItem value="">Tutti</MenuItem>
                  {machines.map(machine => (
                    <MenuItem key={machine.id} value={machine.id}>
                      {machine.serialNumber}
                    </MenuItem>
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
            rows={filteredAndSortedDocuments}
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
            {filteredAndSortedDocuments.map(document => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={document.id}>
                <DocumentCard
                  document={document}
                  onDownload={handleDownload}
                  onDelete={handleDelete}
                />
              </Grid>
            ))}
          </Grid>
        )}

        {!loading && filteredAndSortedDocuments.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
            Nessun documento trovato con i filtri selezionati.
          </Box>
        )}
      </Widget>
    </Box>
  );
}
