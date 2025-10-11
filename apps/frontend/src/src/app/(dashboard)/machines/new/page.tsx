'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Grid,
  CircularProgress,
} from '@mui/material';
import { Save, ArrowBack } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import PageHeader from '@/components/PageHeader';
import Widget from '@/components/Widget';
import axiosInstance from '@/lib/axios';
import { useSnackbar } from 'notistack';
import { MachineFormData, Type } from '@/types';

const schema = yup.object({
  typeId: yup.string().required('Tipo richiesto'),
  serialNumber: yup.string().required('Matricola richiesta'),
  description: yup.string(),
  manufacturer: yup.string(),
  model: yup.string(),
  yearBuilt: yup.number().nullable().transform((v, o) => (o === '' ? null : v)),
  purchaseDate: yup.string(),
  dealer: yup.string(),
  invoiceReference: yup.string(),
  documentLocation: yup.string(),
});

export default function NewMachinePage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [types, setTypes] = useState<Type[]>([]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<MachineFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      typeId: '',
      serialNumber: '',
      description: '',
      manufacturer: '',
      model: '',
      yearBuilt: undefined,
      purchaseDate: '',
      dealer: '',
      invoiceReference: '',
      documentLocation: '',
    },
  });

  useEffect(() => {
    fetchTypes();
  }, []);

  const fetchTypes = async () => {
    try {
      const response = await axiosInstance.get('/types');
      setTypes(response.data.data || response.data);
    } catch (error: any) {
      enqueueSnackbar('Errore nel caricamento dei tipi', { variant: 'error' });
    }
  };

  const onSubmit = async (data: MachineFormData) => {
    try {
      setLoading(true);

      // Convert date string to ISO DateTime if provided
      const payload = {
        ...data,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate).toISOString() : null,
      };

      await axiosInstance.post('/machines', payload);
      enqueueSnackbar('Macchinario creato con successo', { variant: 'success' });
      router.push('/machines');
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || 'Errore durante la creazione', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Nuovo Macchinario"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Macchinari', href: '/machines' },
          { label: 'Nuovo' },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <Widget>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Controller
                name="typeId"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    select
                    label="Tipo *"
                    error={!!errors.typeId}
                    helperText={errors.typeId?.message}
                  >
                    <MenuItem value={0}>Seleziona un tipo</MenuItem>
                    {types.map((type) => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.name} ({type.category?.name})
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="serialNumber"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Matricola *"
                    error={!!errors.serialNumber}
                    helperText={errors.serialNumber?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Descrizione"
                    multiline
                    rows={3}
                    error={!!errors.description}
                    helperText={errors.description?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="manufacturer"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Produttore"
                    error={!!errors.manufacturer}
                    helperText={errors.manufacturer?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="model"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Modello"
                    error={!!errors.model}
                    helperText={errors.model?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="yearBuilt"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Anno di Costruzione"
                    type="number"
                    error={!!errors.yearBuilt}
                    helperText={errors.yearBuilt?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="purchaseDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Data di Acquisto"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.purchaseDate}
                    helperText={errors.purchaseDate?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="dealer"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Rivenditore"
                    error={!!errors.dealer}
                    helperText={errors.dealer?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="invoiceReference"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Riferimento Fattura"
                    error={!!errors.invoiceReference}
                    helperText={errors.invoiceReference?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="documentLocation"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Locazione Documenti"
                    error={!!errors.documentLocation}
                    helperText={errors.documentLocation?.message}
                  />
                )}
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => router.push('/machines')}
              disabled={loading}
            >
              Annulla
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <Save />}
              disabled={loading}
            >
              Salva
            </Button>
          </Box>
        </Widget>
      </form>
    </Box>
  );
}
