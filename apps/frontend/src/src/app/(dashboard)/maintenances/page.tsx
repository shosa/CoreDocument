'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  IconButton,
  TextField,
  CircularProgress,
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
  Visibility,
  Edit,
  Delete,
  Search,
  ViewModule,
  ViewList,
  FilterList,
  FileDownload,
  GetApp,
} from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import PageHeader from '@/components/PageHeader';
import MaintenanceCard from '@/components/MaintenanceCard';
import Widget from '@/components/Widget';
import axiosInstance from '@/lib/axios';
import { useSnackbar } from 'notistack';
import { Maintenance } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

type ViewMode = 'grid' | 'table';
type SortOption = 'date' | 'machine' | 'type' | 'cost' | 'newest' | 'oldest';

interface Filters {
  type: string;
  machine: string;
}

export default function MaintenancesPage() {
  const router = useRouter();
  const { hasRole } = useAuthStore();
  const { enqueueSnackbar } = useSnackbar();
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);

  const [filters, setFilters] = useState<Filters>({
    type: '',
    machine: '',
  });

  useEffect(() => {
    fetchMaintenances();
    fetchMachines();
  }, []);

  const fetchMaintenances = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/maintenances');
      setMaintenances(response.data.data || response.data);
    } catch (error: any) {
      enqueueSnackbar('Errore nel caricamento delle manutenzioni', { variant: 'error' });
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
    if (!confirm('Sei sicuro di voler eliminare questa manutenzione?')) return;

    try {
      await axiosInstance.delete(`/maintenances/${id}`);
      enqueueSnackbar('Manutenzione eliminata con successo', { variant: 'success' });
      fetchMaintenances();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Errore durante l'eliminazione";
      enqueueSnackbar(errorMessage, { variant: 'error' });
    }
  };

  const handleClearFilters = () => {
    setFilters({
      type: '',
      machine: '',
    });
    setSearchQuery('');
  };

  const handleExportCSV = () => {
    const headers = ['Data', 'Macchinario', 'Tipo', 'Operatore', 'Lavoro Eseguito', 'Costo'];
    const rows = filteredAndSortedMaintenances.map((m) => [
      format(new Date(m.date), 'dd/MM/yyyy'),
      m.machine?.serialNumber || '',
      m.type,
      m.operator ? `${m.operator.firstName} ${m.operator.lastName}` : '',
      m.workPerformed,
      m.cost ? `€${Number(m.cost).toFixed(2)}` : '',
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `manutenzioni-${new Date().toISOString().split('T')[0]}.csv`;
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
    a.download = `manutenzioni-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportMenuAnchor(null);
    enqueueSnackbar('Export JSON completato', { variant: 'success' });
  };

  // Filtraggio
  let filteredMaintenances = maintenances.filter((maintenance) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      maintenance.machine?.serialNumber?.toLowerCase().includes(searchLower) ||
      maintenance.workPerformed?.toLowerCase().includes(searchLower) ||
      maintenance.type?.toLowerCase().includes(searchLower);

    const matchesType = !filters.type || maintenance.type === filters.type;
    const matchesMachine = !filters.machine || maintenance.machine?.id === filters.machine;

    return matchesSearch && matchesType && matchesMachine;
  });

  // Ordinamento
  const filteredAndSortedMaintenances = [...filteredMaintenances].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'machine':
        return (a.machine?.serialNumber || '').localeCompare(b.machine?.serialNumber || '');
      case 'type':
        return (a.type || '').localeCompare(b.type || '');
      case 'cost':
        return (Number(b.cost) || 0) - (Number(a.cost) || 0);
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
    {
      field: 'date',
      headerName: 'Data',
      width: 120,
      valueFormatter: (value) => format(new Date(value), 'dd/MM/yyyy', { locale: it }),
    },
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
      field: 'type',
      headerName: 'Tipo',
      width: 150,
      valueFormatter: (value) => {
        const types: Record<string, string> = {
          ordinaria: 'Ordinaria',
          straordinaria: 'Straordinaria',
          guasto: 'Guasto',
          riparazione: 'Riparazione',
        };
        return types[value] || value;
      },
    },
    {
      field: 'operator',
      headerName: 'Operatore',
      flex: 1,
      minWidth: 150,
      valueGetter: (value, row) => (row.operator ? `${row.operator.firstName} ${row.operator.lastName}` : '-'),
    },
    {
      field: 'workPerformed',
      headerName: 'Lavoro Eseguito',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'cost',
      headerName: 'Costo',
      width: 120,
      valueFormatter: (value) => (value ? `€${Number(value).toFixed(2)}` : '-'),
    },
    {
      field: 'actions',
      headerName: 'Azioni',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', height: '100%' }}>
          <IconButton
            size="small"
            onClick={() => router.push(`/maintenances/${params.row.id}`)}
            title="Visualizza"
            sx={{
              bgcolor: 'black',
              color: 'white',
              borderRadius: '6px',
              '&:hover': { bgcolor: 'grey.800' },
            }}
          >
            <Visibility fontSize="small" />
          </IconButton>
          {hasRole(['admin', 'tecnico']) && (
            <IconButton
              size="small"
              onClick={() => router.push(`/maintenances/${params.row.id}/edit`)}
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
          )}
          {hasRole('admin') && (
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
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Manutenzioni"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Manutenzioni' }]}
        renderRight={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<FileDownload />} onClick={(e) => setExportMenuAnchor(e.currentTarget)}>
              Esporta
            </Button>
            {hasRole(['admin', 'tecnico']) && (
              <Button variant="contained" startIcon={<Add />} onClick={() => router.push('/maintenances/new')}>
                Aggiungi Manutenzione
              </Button>
            )}
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
            placeholder="Cerca per macchinario, tipo o descrizione..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
            sx={{ flex: 1, minWidth: 250 }}
          />

          <ToggleButtonGroup value={viewMode} exclusive onChange={(e, newMode) => newMode && setViewMode(newMode)} size="small">
            <ToggleButton value="table" aria-label="vista tabella">
              <ViewList />
            </ToggleButton>
            <ToggleButton value="grid" aria-label="vista griglia">
              <ViewModule />
            </ToggleButton>
          </ToggleButtonGroup>

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Ordina per</InputLabel>
            <Select value={sortBy} label="Ordina per" onChange={(e) => setSortBy(e.target.value as SortOption)}>
              <MenuItem value="date">Data</MenuItem>
              <MenuItem value="machine">Macchinario</MenuItem>
              <MenuItem value="type">Tipo</MenuItem>
              <MenuItem value="cost">Costo</MenuItem>
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
                <InputLabel>Tipo</InputLabel>
                <Select value={filters.type} label="Tipo" onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
                  <MenuItem value="">Tutti</MenuItem>
                  <MenuItem value="ordinaria">Ordinaria</MenuItem>
                  <MenuItem value="straordinaria">Straordinaria</MenuItem>
                  <MenuItem value="guasto">Guasto</MenuItem>
                  <MenuItem value="riparazione">Riparazione</MenuItem>
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
        ) : viewMode === 'table' ? (
          <DataGrid
            rows={filteredAndSortedMaintenances}
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
            {filteredAndSortedMaintenances.map((maintenance) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={maintenance.id}>
                <MaintenanceCard
                  maintenance={maintenance}
                  onView={(id) => router.push(`/maintenances/${id}`)}
                  onEdit={hasRole(['admin', 'tecnico']) ? (id) => router.push(`/maintenances/${id}/edit`) : undefined}
                  onDelete={hasRole('admin') ? handleDelete : undefined}
                />
              </Grid>
            ))}
          </Grid>
        )}

        {!loading && filteredAndSortedMaintenances.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
            Nessuna manutenzione trovata con i filtri selezionati.
          </Box>
        )}
      </Widget>
    </Box>
  );
}
