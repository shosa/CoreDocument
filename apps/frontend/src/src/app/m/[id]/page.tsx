'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Box,
  Container,
  Card,
  Typography,
  TextField,
  MenuItem,
  Button,
  CircularProgress,
  Grid,
} from '@mui/material';
import { Build, Save } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import axiosInstance from '@/lib/axios';
import { useSnackbar } from 'notistack';
import { Machine, MaintenanceFormData } from '@/types';

export default function QuickMaintenancePage() {
  const params = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const [machine, setMachine] = useState<Machine | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { control, handleSubmit } = useForm<Partial<MaintenanceFormData>>({
    defaultValues: {
      machineId: Number(params.id),
      date: new Date().toISOString().split('T')[0],
      type: 'ordinaria',
      workPerformed: '',
      problemDescription: '',
    },
  });

  useEffect(() => {
    fetchMachine();
  }, [params.id]);

  const fetchMachine = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/machines/${params.id}`);
      setMachine(response.data);
    } catch (error: any) {
      enqueueSnackbar('Errore nel caricamento del macchinario', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: Partial<MaintenanceFormData>) => {
    try {
      setSubmitting(true);
      // Assume operatorId from query or use a default public user
      const maintenanceData = {
        ...data,
        operatorId: 1, // Default operator for quick maintenance
      };
      await axiosInstance.post('/maintenances', maintenanceData);
      enqueueSnackbar('Manutenzione registrata con successo', { variant: 'success' });
    } catch (error: any) {
      enqueueSnackbar('Errore durante la registrazione', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!machine) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5">Macchinario non trovato</Typography>
        </Card>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 4 }}>
          <Build sx={{ fontSize: 48, color: 'primary.main', mr: 2 }} />
          <Typography variant="h4" fontWeight={700}>
            CoreDocument
          </Typography>
        </Box>

        <Card sx={{ p: 4, mb: 3 }}>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Registrazione Rapida Manutenzione
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Macchinario: {machine.serialNumber}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tipo: {machine.type?.name}
          </Typography>
        </Card>

        <Card sx={{ p: 4 }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="date"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Data"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth select label="Tipo">
                      <MenuItem value="ordinaria">Ordinaria</MenuItem>
                      <MenuItem value="straordinaria">Straordinaria</MenuItem>
                      <MenuItem value="guasto">Guasto</MenuItem>
                      <MenuItem value="riparazione">Riparazione</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="problemDescription"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Descrizione Problema (opzionale)"
                      multiline
                      rows={3}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="workPerformed"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Lavoro Eseguito *"
                      multiline
                      rows={4}
                      required
                    />
                  )}
                />
              </Grid>
            </Grid>

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              startIcon={submitting ? <CircularProgress size={20} /> : <Save />}
              disabled={submitting}
              sx={{ mt: 3 }}
            >
              Registra Manutenzione
            </Button>
          </form>
        </Card>
      </Container>
    </Box>
  );
}
