'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  IconButton,
  Chip,
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Stack,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { Add, Edit, Delete, Search, FilterList, FileDownload, GetApp } from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import PageHeader from '@/components/PageHeader';
import Widget from '@/components/Widget';
import axiosInstance from '@/lib/axios';
import { useSnackbar } from 'notistack';
import { ScheduledMaintenance } from '@/types';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

type SortOption = 'title' | 'date' | 'frequency' | 'newest' | 'oldest';

interface Filters {
  frequency: string;
  isActive: string;
  machine: string;
}

export default function ScheduledMaintenancesPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [maintenances, setMaintenances] = useState<ScheduledMaintenance[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);

  const [filters, setFilters] = useState<Filters>({
    frequency: '',
    isActive: '',
    machine: '',
  });

  useEffect(() => {
    fetchMaintenances();
    fetchMachines();
  }, []);

  const fetchMaintenances = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/scheduled-maintenances');
      setMaintenances(response.data.data || response.data);
    } catch (error: any) {
      enqueueSnackbar('Errore nel caricamento', { variant: 'error' });
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
    if (!confirm('Sei sicuro di voler eliminare questa manutenzione programmata?')) return;
    try {
      await axiosInstance.delete(`/scheduled-maintenances/${id}`);
      enqueueSnackbar('Eliminata con successo', { variant: 'success' });
      fetchMaintenances();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Errore durante l'eliminazione";
      enqueueSnackbar(errorMessage, { variant: 'error' });
    }
  };

  const handleClearFilters = () => {
    setFilters({
      frequency: '',
      isActive: '',
      machine: '',
    });
    setSearchQuery('');
  };

  const handleExportCSV = () => {
    const headers = ['Titolo', 'Macchinario', 'Frequenza', 'Prossima Scadenza', 'Stato'];
    const rows = filteredAndSortedMaintenances.map((m) => [
      m.title,
      m.machine?.serialNumber || '',
      frequencyLabels[m.frequency] || m.frequency,
      format(new Date(m.nextDueDate), 'dd/MM/yyyy'),
      m.isActive ? 'Attiva' : 'Inattiva',
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `manutenzioni-programmate-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportMenuAnchor(null);
    enqueueSnackbar('Export CSV completato', { variant: 'success' });
  };

  const handleExportJSON = () => {
    const data = JSON.stringify(filteredAndSortedMaintenances, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `manutenzioni-programmate-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportMenuAnchor(null);
    enqueueSnackbar('Export JSON completato', { variant: 'success' });
  };

  const frequencyLabels: Record<string, string> = {
    daily: 'Giornaliera',
    weekly: 'Settimanale',
    monthly: 'Mensile',
    quarterly: 'Trimestrale',
    biannual: 'Semestrale',
    annual: 'Annuale',
  };

  // Filtraggio
  let filteredMaintenances = maintenances.filter((maintenance) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      maintenance.title?.toLowerCase().includes(searchLower) ||
      maintenance.machine?.serialNumber?.toLowerCase().includes(searchLower) ||
      maintenance.description?.toLowerCase().includes(searchLower);

    const matchesFrequency = !filters.frequency || maintenance.frequency === filters.frequency;
    const matchesActive = !filters.isActive || maintenance.isActive.toString() === filters.isActive;
    const matchesMachine = !filters.machine || maintenance.machine?.id === filters.machine;

    return matchesSearch && matchesFrequency && matchesActive && matchesMachine;
  });

  // Ordinamento
  const filteredAndSortedMaintenances = [...filteredMaintenances].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return (a.title || '').localeCompare(b.title || '');
      case 'date':
        return new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime();
      case 'frequency':
        return (a.frequency || '').localeCompare(b.frequency || '');
      case 'newest':
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      case 'oldest':
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      default:
        return 0;
    }
  });

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  const columns: GridColDef[] = [
    { field: 'title', headerName: 'Titolo', flex: 1 },
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
      field: 'frequency',
      headerName: 'Frequenza',
      width: 150,
      valueFormatter: (value) => frequencyLabels[value] || value,
    },
    {
      field: 'nextDueDate',
      headerName: 'Prossima Scadenza',
      width: 150,
      valueFormatter: (value) => format(new Date(value), 'dd/MM/yyyy', { locale: it }),
    },
    {
      field: 'isActive',
      headerName: 'Stato',
      width: 120,
      renderCell: (params) => (
        <Chip label={params.value ? 'Attiva' : 'Inattiva'} color={params.value ? 'success' : 'default'} size="small" />
      ),
    },
    {
      field: 'actions',
      headerName: 'Azioni',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', height: '100%' }}>
          <IconButton
            size="small"
            onClick={() => router.push(`/scheduled-maintenances/${params.row.id}/edit`)}
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
        title="Manutenzioni Programmate"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Manutenzioni Programmate' }]}
        renderRight={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<FileDownload />} onClick={(e) => setExportMenuAnchor(e.currentTarget)}>
              Esporta
            </Button>
            <Button variant="contained" startIcon={<Add />} onClick={() => router.push('/scheduled-maintenances/new')}>
              Aggiungi
            </Button>
          </Stack>
        }
      />

      <Menu anchorEl={exportMenuAnchor} open={Boolean(exportMenuAnchor)} onClose={() => setExportMenuAnchor(null)}>
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
            placeholder="Cerca per titolo, macchinario o descrizione..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
            sx={{ flex: 1, minWidth: 250 }}
          />

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Ordina per</InputLabel>
            <Select value={sortBy} label="Ordina per" onChange={(e) => setSortBy(e.target.value as SortOption)}>
              <MenuItem value="title">Titolo</MenuItem>
              <MenuItem value="date">Prossima Scadenza</MenuItem>
              <MenuItem value="frequency">Frequenza</MenuItem>
              <MenuItem value="newest">Più recenti</MenuItem>
              <MenuItem value="oldest">Più vecchi</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Filtri */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterList />
              <Box sx={{ fontWeight: 600 }}>Filtri</Box>
              {activeFiltersCount > 0 && <Chip label={`${activeFiltersCount} attivi`} size="small" color="primary" />}
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
                <InputLabel>Frequenza</InputLabel>
                <Select value={filters.frequency} label="Frequenza" onChange={(e) => setFilters({ ...filters, frequency: e.target.value })}>
                  <MenuItem value="">Tutte</MenuItem>
                  <MenuItem value="daily">Giornaliera</MenuItem>
                  <MenuItem value="weekly">Settimanale</MenuItem>
                  <MenuItem value="monthly">Mensile</MenuItem>
                  <MenuItem value="quarterly">Trimestrale</MenuItem>
                  <MenuItem value="biannual">Semestrale</MenuItem>
                  <MenuItem value="annual">Annuale</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Stato</InputLabel>
                <Select value={filters.isActive} label="Stato" onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}>
                  <MenuItem value="">Tutte</MenuItem>
                  <MenuItem value="true">Attive</MenuItem>
                  <MenuItem value="false">Inattive</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Macchinario</InputLabel>
                <Select value={filters.machine} label="Macchinario" onChange={(e) => setFilters({ ...filters, machine: e.target.value })}>
                  <MenuItem value="">Tutti</MenuItem>
                  {machines.map((machine) => (
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
        ) : (
          <DataGrid
            rows={filteredAndSortedMaintenances}
            columns={columns}
            autoHeight
            pageSizeOptions={[10, 25, 50]}
            initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
            disableRowSelectionOnClick
            sx={{
              border: 0,
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid',
                borderColor: 'divider',
              },
            }}
          />
        )}

        {!loading && filteredAndSortedMaintenances.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
            Nessuna manutenzione programmata trovata con i filtri selezionati.
          </Box>
        )}
      </Widget>
    </Box>
  );
}
