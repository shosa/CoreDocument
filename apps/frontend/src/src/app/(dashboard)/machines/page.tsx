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
import MachineCard from '@/components/MachineCard';
import Widget from '@/components/Widget';
import axiosInstance from '@/lib/axios';
import { useSnackbar } from 'notistack';
import { Machine } from '@/types';
import { useAuthStore } from '@/store/authStore';

type ViewMode = 'grid' | 'table';
type SortOption = 'serialNumber' | 'manufacturer' | 'model' | 'yearBuilt' | 'newest' | 'oldest';

interface Filters {
  category: string;
  type: string;
  manufacturer: string;
  yearBuilt: string;
}

export default function MachinesPage() {
  const router = useRouter();
  const { hasRole } = useAuthStore();
  const { enqueueSnackbar } = useSnackbar();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [sortBy, setSortBy] = useState<SortOption>('serialNumber');
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);

  const [filters, setFilters] = useState<Filters>({
    category: '',
    type: '',
    manufacturer: '',
    yearBuilt: '',
  });

  const [categories, setCategories] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);

  useEffect(() => {
    fetchMachines();
    fetchCategories();
  }, []);

  const fetchMachines = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/machines');
      setMachines(response.data.data || response.data);
    } catch (error: any) {
      enqueueSnackbar('Errore nel caricamento dei macchinari', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axiosInstance.get('/categories');
      setCategories(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    if (filters.category) {
      const category = categories.find((c) => c.id === filters.category);
      setTypes(category?.types || []);
      setFilters((prev) => ({ ...prev, type: '' }));
    } else {
      setTypes([]);
    }
  }, [filters.category, categories]);

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo macchinario?')) return;

    try {
      await axiosInstance.delete(`/machines/${id}`);
      enqueueSnackbar('Macchinario eliminato con successo', { variant: 'success' });
      fetchMachines();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Errore durante l'eliminazione";

      if (error.response?.status === 400 || errorMessage.includes('vincoli') || errorMessage.includes('foreign key')) {
        enqueueSnackbar('Impossibile eliminare: il macchinario ha documenti o manutenzioni associate', {
          variant: 'error',
          autoHideDuration: 5000,
        });
      } else {
        enqueueSnackbar(errorMessage, { variant: 'error' });
      }
    }
  };

  const handleClearFilters = () => {
    setFilters({
      category: '',
      type: '',
      manufacturer: '',
      yearBuilt: '',
    });
    setSearchQuery('');
  };

  const handleExportCSV = () => {
    const headers = ['Matricola', 'Tipo', 'Categoria', 'Produttore', 'Modello', 'Anno'];
    const rows = filteredAndSortedMachines.map((m) => [
      m.serialNumber,
      m.type?.name || '',
      m.type?.category?.name || '',
      m.manufacturer,
      m.model,
      m.yearBuilt || '',
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `macchinari-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportMenuAnchor(null);
    enqueueSnackbar('Export CSV completato', { variant: 'success' });
  };

  const handleExportJSON = () => {
    const data = JSON.stringify(filteredAndSortedMachines, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `macchinari-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportMenuAnchor(null);
    enqueueSnackbar('Export JSON completato', { variant: 'success' });
  };

  // Filtraggio
  let filteredMachines = machines.filter((machine) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      machine.serialNumber?.toLowerCase().includes(searchLower) ||
      machine.manufacturer?.toLowerCase().includes(searchLower) ||
      machine.model?.toLowerCase().includes(searchLower) ||
      machine.type?.name?.toLowerCase().includes(searchLower);

    const matchesCategory = !filters.category || machine.type?.categoryId === filters.category;
    const matchesType = !filters.type || machine.type?.id === filters.type;
    const matchesManufacturer = !filters.manufacturer || machine.manufacturer === filters.manufacturer;
    const matchesYear = !filters.yearBuilt || machine.yearBuilt?.toString() === filters.yearBuilt;

    return matchesSearch && matchesCategory && matchesType && matchesManufacturer && matchesYear;
  });

  // Ordinamento
  const filteredAndSortedMachines = [...filteredMachines].sort((a, b) => {
    switch (sortBy) {
      case 'serialNumber':
        return (a.serialNumber || '').localeCompare(b.serialNumber || '');
      case 'manufacturer':
        return (a.manufacturer || '').localeCompare(b.manufacturer || '');
      case 'model':
        return (a.model || '').localeCompare(b.model || '');
      case 'yearBuilt':
        return (a.yearBuilt || 0) - (b.yearBuilt || 0);
      case 'newest':
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      case 'oldest':
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      default:
        return 0;
    }
  });

  // Opzioni uniche per i filtri
  const uniqueManufacturers = Array.from(new Set(machines.map((m) => m.manufacturer).filter(Boolean)));
  const uniqueYears = Array.from(new Set(machines.map((m) => m.yearBuilt).filter(Boolean))).sort((a, b) => b - a);

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  const columns: GridColDef[] = [
    {
      field: 'serialNumber',
      headerName: 'Matricola',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'type',
      headerName: 'Tipo',
      flex: 1,
      minWidth: 150,
      valueGetter: (value, row) => row.type?.name || '-',
    },
    {
      field: 'category',
      headerName: 'Categoria',
      flex: 1,
      minWidth: 150,
      valueGetter: (value, row) => row.type?.category?.name || '-',
    },
    {
      field: 'manufacturer',
      headerName: 'Produttore',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'model',
      headerName: 'Modello',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'yearBuilt',
      headerName: 'Anno',
      width: 100,
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
            onClick={() => router.push(`/machines/${params.row.id}`)}
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
              onClick={() => router.push(`/machines/${params.row.id}/edit`)}
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
        title="Macchinari"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Macchinari' }]}
        renderRight={
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<FileDownload />}
              onClick={(e) => setExportMenuAnchor(e.currentTarget)}
            >
              Esporta
            </Button>
            {hasRole('admin') && (
              <Button variant="contained" startIcon={<Add />} onClick={() => router.push('/machines/new')}>
                Aggiungi Macchinario
              </Button>
            )}
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
        {/* Toolbar: Search + View Toggle + Sort */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            fullWidth
            placeholder="Cerca per matricola, produttore, modello o tipo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
            <Select value={sortBy} label="Ordina per" onChange={(e) => setSortBy(e.target.value as SortOption)}>
              <MenuItem value="serialNumber">Matricola</MenuItem>
              <MenuItem value="manufacturer">Produttore</MenuItem>
              <MenuItem value="model">Modello</MenuItem>
              <MenuItem value="yearBuilt">Anno</MenuItem>
              <MenuItem value="newest">Più recenti</MenuItem>
              <MenuItem value="oldest">Più vecchi</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Filtri avanzati */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
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
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Categoria</InputLabel>
                <Select
                  value={filters.category}
                  label="Categoria"
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                >
                  <MenuItem value="">Tutte</MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small" disabled={!filters.category}>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={filters.type}
                  label="Tipo"
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                >
                  <MenuItem value="">Tutti</MenuItem>
                  {types.map((type) => (
                    <MenuItem key={type.id} value={type.id}>
                      {type.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Produttore</InputLabel>
                <Select
                  value={filters.manufacturer}
                  label="Produttore"
                  onChange={(e) => setFilters({ ...filters, manufacturer: e.target.value })}
                >
                  <MenuItem value="">Tutti</MenuItem>
                  {uniqueManufacturers.map((mfr) => (
                    <MenuItem key={mfr} value={mfr}>
                      {mfr}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Anno</InputLabel>
                <Select
                  value={filters.yearBuilt}
                  label="Anno"
                  onChange={(e) => setFilters({ ...filters, yearBuilt: e.target.value })}
                >
                  <MenuItem value="">Tutti</MenuItem>
                  {uniqueYears.map((year) => (
                    <MenuItem key={year} value={year.toString()}>
                      {year}
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
            rows={filteredAndSortedMachines}
            columns={columns}
            autoHeight
            pageSizeOptions={[10, 25, 50, 100]}
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
            {filteredAndSortedMachines.map((machine) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={machine.id}>
                <MachineCard
                  machine={machine}
                  onView={(id) => router.push(`/machines/${id}`)}
                  onEdit={hasRole(['admin', 'tecnico']) ? (id) => router.push(`/machines/${id}/edit`) : undefined}
                  onDelete={hasRole('admin') ? handleDelete : undefined}
                  onQRCode={(id) => router.push(`/machines/${id}`)}
                />
              </Grid>
            ))}
          </Grid>
        )}

        {!loading && filteredAndSortedMachines.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
            Nessun macchinario trovato con i filtri selezionati.
          </Box>
        )}
      </Widget>
    </Box>
  );
}
