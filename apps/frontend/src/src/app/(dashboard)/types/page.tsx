'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import PageHeader from '@/components/PageHeader';
import Widget from '@/components/Widget';
import axiosInstance from '@/lib/axios';
import { useSnackbar } from 'notistack';
import { Type, TypeFormData, Category } from '@/types';
import { useForm, Controller } from 'react-hook-form';

export default function TypesPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [types, setTypes] = useState<Type[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { control, handleSubmit, reset } = useForm<TypeFormData>({
    defaultValues: { categoryId: 0, name: '', description: '' },
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [typesRes, catsRes] = await Promise.all([
        axiosInstance.get('/types'),
        axiosInstance.get('/categories'),
      ]);
      setTypes(typesRes.data.data || typesRes.data);
      setCategories(catsRes.data.data || catsRes.data);
    } catch (error: any) {
      enqueueSnackbar('Errore nel caricamento', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (type?: Type) => {
    if (type) {
      setEditingId(type.id);
      reset({ categoryId: type.categoryId, name: type.name, description: type.description || '' });
    } else {
      setEditingId(null);
      reset({ categoryId: 0, name: '', description: '' });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
  };

  const onSubmit = async (data: TypeFormData) => {
    try {
      if (editingId) {
        await axiosInstance.patch(`/types/${editingId}`, data);
        enqueueSnackbar('Tipo aggiornato', { variant: 'success' });
      } else {
        await axiosInstance.post('/types', data);
        enqueueSnackbar('Tipo creato', { variant: 'success' });
      }
      fetchData();
      handleCloseDialog();
    } catch (error: any) {
      enqueueSnackbar('Errore durante il salvataggio', { variant: 'error' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Sei sicuro di voler eliminare questo tipo?')) return;
    try {
      await axiosInstance.delete(`/types/${id}`);
      enqueueSnackbar('Tipo eliminato', { variant: 'success' });
      fetchData();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Errore durante l\'eliminazione';

      if (error.response?.status === 400 || errorMessage.includes('vincoli') || errorMessage.includes('foreign key')) {
        enqueueSnackbar('Impossibile eliminare: il tipo è utilizzato da macchinari esistenti', {
          variant: 'error',
          autoHideDuration: 5000,
        });
      } else {
        enqueueSnackbar(errorMessage, { variant: 'error' });
      }
    }
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Nome', flex: 1 },
    {
      field: 'category',
      headerName: 'Categoria',
      flex: 1,
      valueGetter: (value, row) => row.category?.name || '-',
    },
    { field: 'description', headerName: 'Descrizione', flex: 2 },
    {
      field: 'actions',
      headerName: 'Azioni',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', height: '100%' }}>
          <IconButton
            size="small"
            onClick={() => handleOpenDialog(params.row)}
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
        title="Tipi"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Tipi' }]}
        renderRight={
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
            Aggiungi Tipo
          </Button>
        }
      />

      <Widget>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid
            rows={types}
            columns={columns}
            autoHeight
            pageSizeOptions={[10, 25]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            disableRowSelectionOnClick
            sx={{ border: 0 }}
          />
        )}
      </Widget>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{editingId ? 'Modifica Tipo' : 'Nuovo Tipo'}</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth select label="Categoria *">
                    <MenuItem value={0}>Seleziona categoria</MenuItem>
                    {categories.map((cat) => (
                      <MenuItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
              <Controller
                name="name"
                control={control}
                render={({ field }) => <TextField {...field} fullWidth label="Nome *" />}
              />
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Descrizione" multiline rows={3} />
                )}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Annulla</Button>
            <Button type="submit" variant="contained">
              Salva
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
