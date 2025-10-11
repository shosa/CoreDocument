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
  CircularProgress,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import PageHeader from '@/components/PageHeader';
import Widget from '@/components/Widget';
import axiosInstance from '@/lib/axios';
import { useSnackbar } from 'notistack';
import { Category, CategoryFormData } from '@/types';
import { useForm, Controller } from 'react-hook-form';

export default function CategoriesPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { control, handleSubmit, reset } = useForm<CategoryFormData>({
    defaultValues: { name: '', description: '' },
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/categories');
      setCategories(response.data.data || response.data);
    } catch (error: any) {
      enqueueSnackbar('Errore nel caricamento', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingId(category.id);
      reset({ name: category.name, description: category.description || '' });
    } else {
      setEditingId(null);
      reset({ name: '', description: '' });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    reset({ name: '', description: '' });
  };

  const onSubmit = async (data: CategoryFormData) => {
    try {
      if (editingId) {
        await axiosInstance.patch(`/categories/${editingId}`, data);
        enqueueSnackbar('Categoria aggiornata', { variant: 'success' });
      } else {
        await axiosInstance.post('/categories', data);
        enqueueSnackbar('Categoria creata', { variant: 'success' });
      }
      fetchCategories();
      handleCloseDialog();
    } catch (error: any) {
      enqueueSnackbar('Errore durante il salvataggio', { variant: 'error' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Sei sicuro di voler eliminare questa categoria?')) return;
    try {
      await axiosInstance.delete(`/categories/${id}`);
      enqueueSnackbar('Categoria eliminata', { variant: 'success' });
      fetchCategories();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Errore durante l\'eliminazione';

      if (error.response?.status === 400 || errorMessage.includes('vincoli') || errorMessage.includes('foreign key')) {
        enqueueSnackbar('Impossibile eliminare: la categoria è utilizzata da altri elementi', {
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
        title="Categorie"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Categorie' }]}
        renderRight={
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
            Aggiungi Categoria
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
            rows={categories}
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
          <DialogTitle>{editingId ? 'Modifica Categoria' : 'Nuova Categoria'}</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
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
