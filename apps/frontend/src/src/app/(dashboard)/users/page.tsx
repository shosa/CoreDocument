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
  ToggleButtonGroup,
  ToggleButton,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Add,
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
import UserCard from '@/components/UserCard';
import Widget from '@/components/Widget';
import axiosInstance from '@/lib/axios';
import { useSnackbar } from 'notistack';
import { User } from '@/types';

type ViewMode = 'grid' | 'table';
type SortOption = 'name' | 'email' | 'role' | 'newest' | 'oldest';

interface Filters {
  role: string;
  isActive: string;
}

export default function UsersPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);

  const [filters, setFilters] = useState<Filters>({
    role: '',
    isActive: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/users');
      setUsers(response.data.data || response.data);
    } catch (error: any) {
      enqueueSnackbar('Errore nel caricamento degli utenti', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo utente?')) return;
    try {
      await axiosInstance.delete(`/users/${id}`);
      enqueueSnackbar('Utente eliminato', { variant: 'success' });
      fetchUsers();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Errore durante l'eliminazione";

      if (error.response?.status === 400 || errorMessage.includes('vincoli') || errorMessage.includes('foreign key')) {
        enqueueSnackbar("Impossibile eliminare: l'utente ha operazioni o documenti associati", {
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
      role: '',
      isActive: '',
    });
    setSearchQuery('');
  };

  const handleExportCSV = () => {
    const headers = ['Nome', 'Cognome', 'Email', 'Ruolo', 'Stato'];
    const rows = filteredAndSortedUsers.map((u) => [
      u.firstName,
      u.lastName,
      u.email,
      u.role,
      u.isActive ? 'Attivo' : 'Inattivo',
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `utenti-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportMenuAnchor(null);
    enqueueSnackbar('Export CSV completato', { variant: 'success' });
  };

  const handleExportJSON = () => {
    const data = JSON.stringify(filteredAndSortedUsers, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `utenti-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportMenuAnchor(null);
    enqueueSnackbar('Export JSON completato', { variant: 'success' });
  };

  // Filtraggio
  let filteredUsers = users.filter((user) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      user.firstName?.toLowerCase().includes(searchLower) ||
      user.lastName?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower);

    const matchesRole = !filters.role || user.role === filters.role;
    const matchesActive = !filters.isActive || user.isActive.toString() === filters.isActive;

    return matchesSearch && matchesRole && matchesActive;
  });

  // Ordinamento
  const filteredAndSortedUsers = [...filteredUsers].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      case 'email':
        return (a.email || '').localeCompare(b.email || '');
      case 'role':
        return (a.role || '').localeCompare(b.role || '');
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
      field: 'fullName',
      headerName: 'Nome Completo',
      flex: 1,
      valueGetter: (value, row) => `${row.firstName} ${row.lastName}`,
    },
    { field: 'email', headerName: 'Email', flex: 1 },
    {
      field: 'role',
      headerName: 'Ruolo',
      width: 150,
      renderCell: (params) => {
        const roleColors: Record<string, 'primary' | 'success' | 'default'> = {
          admin: 'primary',
          tecnico: 'success',
          utente: 'default',
        };
        const roleLabels: Record<string, string> = {
          admin: 'Admin',
          tecnico: 'Tecnico',
          utente: 'Utente',
        };
        return <Chip label={roleLabels[params.value] || params.value} color={roleColors[params.value]} size="small" />;
      },
    },
    {
      field: 'isActive',
      headerName: 'Stato',
      width: 120,
      renderCell: (params) => (
        <Chip label={params.value ? 'Attivo' : 'Inattivo'} color={params.value ? 'success' : 'default'} size="small" />
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
            onClick={() => router.push(`/users/${params.row.id}/edit`)}
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
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Utenti"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Utenti' }]}
        renderRight={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<FileDownload />} onClick={(e) => setExportMenuAnchor(e.currentTarget)}>
              Esporta
            </Button>
            <Button variant="contained" startIcon={<Add />} onClick={() => router.push('/users/new')}>
              Aggiungi Utente
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
            placeholder="Cerca per nome, cognome o email..."
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
              <MenuItem value="name">Nome</MenuItem>
              <MenuItem value="email">Email</MenuItem>
              <MenuItem value="role">Ruolo</MenuItem>
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
                <InputLabel>Ruolo</InputLabel>
                <Select value={filters.role} label="Ruolo" onChange={(e) => setFilters({ ...filters, role: e.target.value })}>
                  <MenuItem value="">Tutti</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="tecnico">Tecnico</MenuItem>
                  <MenuItem value="utente">Utente</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Stato</InputLabel>
                <Select value={filters.isActive} label="Stato" onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}>
                  <MenuItem value="">Tutti</MenuItem>
                  <MenuItem value="true">Attivi</MenuItem>
                  <MenuItem value="false">Inattivi</MenuItem>
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
            rows={filteredAndSortedUsers}
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
            {filteredAndSortedUsers.map((user) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={user.id}>
                <UserCard user={user} onEdit={(id) => router.push(`/users/${id}/edit`)} onDelete={handleDelete} />
              </Grid>
            ))}
          </Grid>
        )}

        {!loading && filteredAndSortedUsers.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
            Nessun utente trovato con i filtri selezionati.
          </Box>
        )}
      </Widget>
    </Box>
  );
}
