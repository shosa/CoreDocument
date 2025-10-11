'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Grid,
  CircularProgress,
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
} from '@mui/material';
import { Save, ArrowBack } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import PageHeader from '@/components/PageHeader';
import axiosInstance from '@/lib/axios';
import { useSnackbar } from 'notistack';
import { MaintenanceFormData, Machine, User } from '@/types';
import { useAuthStore } from '@/store/authStore';

const schema = yup.object({
  machineId: yup.string().required('Macchinario richiesto'),
  operatorId: yup.string().required('Operatore richiesto'),
  date: yup.string().required('Data richiesta'),
  type: yup.string().required('Tipo richiesto'),
  problemDescription: yup.string(),
  workPerformed: yup.string().required('Lavoro eseguito richiesto'),
  spareParts: yup.string(),
  cost: yup.number().nullable().transform((v, o) => (o === '' ? null : v)),
});

export default function NewMaintenancePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedMachineId = searchParams.get('machineId');
  const { user } = useAuthStore();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [operators, setOperators] = useState<User[]>([]);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<MaintenanceFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      machineId: preSelectedMachineId || '',
      operatorId: user?.id || '',
      date: new Date().toISOString().split('T')[0],
      type: 'ordinaria',
      problemDescription: '',
      workPerformed: '',
      spareParts: '',
      cost: undefined,
    },
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (preSelectedMachineId && machines.length > 0) {
      const machine = machines.find((m) => m.id === preSelectedMachineId);
      if (machine) {
        setSelectedMachine(machine);
        setValue('machineId', preSelectedMachineId);
      }
    }
  }, [preSelectedMachineId, machines]);

  const fetchData = async () => {
    try {
      const [machinesRes, usersRes] = await Promise.all([
        axiosInstance.get('/machines'),
        axiosInstance.get('/users'),
      ]);
      setMachines(Array.isArray(machinesRes.data) ? machinesRes.data : []);
      setOperators(Array.isArray(usersRes.data) ? usersRes.data : []);
    } catch (error: any) {
      enqueueSnackbar('Errore nel caricamento dei dati', { variant: 'error' });
    }
  };

  const onSubmit = async (data: MaintenanceFormData) => {
    try {
      setLoading(true);

      // Convert date to ISO DateTime
      const payload = {
        ...data,
        date: new Date(data.date).toISOString(),
      };

      await axiosInstance.post('/maintenances', payload);
      enqueueSnackbar('Manutenzione creata con successo', { variant: 'success' });

      // Redirect back to machine detail if came from there
      if (preSelectedMachineId) {
        router.push(`/machines/${preSelectedMachineId}`);
      } else {
        router.push('/maintenances');
      }
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || 'Errore durante la creazione', {
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title={
          selectedMachine
            ? `Nuova Manutenzione - ${selectedMachine.description}`
            : 'Nuova Manutenzione'
        }
        breadcrumbs={
          preSelectedMachineId
            ? ['Dashboard', 'Macchinari', selectedMachine?.serialNumber || '', 'Nuova Manutenzione']
            : ['Dashboard', 'Manutenzioni', 'Nuova']
        }
      />

      {/* Machine Info Card - Solo se pre-selezionato */}
      {selectedMachine && (
        <Card elevation={0} sx={{ mb: 3, border: 1, borderColor: 'divider', borderRadius: 1 }}>
          <CardContent>
            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">
                Macchinario Selezionato
              </Typography>
              <Typography variant="h6" fontWeight={600}>
                {selectedMachine.description}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip
                  label={`Matr.: ${selectedMachine.serialNumber}`}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label={`${selectedMachine.manufacturer} ${selectedMachine.model}`}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label={selectedMachine.type?.name || 'N/A'}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
          <CardContent sx={{ p: 4 }}>
            <Grid container spacing={3}>
              {/* Solo se NON è pre-selezionato */}
              {!preSelectedMachineId && (
                <Grid item xs={12}>
                  <Controller
                    name="machineId"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        select
                        fullWidth
                        label="Macchinario *"
                        error={!!errors.machineId}
                        helperText={errors.machineId?.message}
                      >
                        <MenuItem value="">Seleziona macchinario</MenuItem>
                        {machines.map((machine) => (
                          <MenuItem key={machine.id} value={machine.id}>
                            {machine.serialNumber} - {machine.description}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                </Grid>
              )}

              <Grid item xs={12} md={6}>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      label="Tipo Manutenzione *"
                      error={!!errors.type}
                      helperText={errors.type?.message}
                    >
                      <MenuItem value="ordinaria">Ordinaria</MenuItem>
                      <MenuItem value="straordinaria">Straordinaria</MenuItem>
                      <MenuItem value="guasto">Guasto</MenuItem>
                      <MenuItem value="riparazione">Riparazione</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="date"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="date"
                      fullWidth
                      label="Data Intervento *"
                      InputLabelProps={{ shrink: true }}
                      error={!!errors.date}
                      helperText={errors.date?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="operatorId"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      label="Operatore *"
                      error={!!errors.operatorId}
                      helperText={errors.operatorId?.message}
                    >
                      <MenuItem value="">Seleziona operatore</MenuItem>
                      {operators.map((op) => (
                        <MenuItem key={op.id} value={op.id}>
                          {op.firstName} {op.lastName}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="cost"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="number"
                      fullWidth
                      label="Costo (€)"
                      inputProps={{ step: '0.01', min: '0' }}
                      error={!!errors.cost}
                      helperText={errors.cost?.message}
                    />
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
                      multiline
                      rows={3}
                      label="Descrizione Problema"
                      placeholder="Descrivi il problema riscontrato (opzionale)"
                      error={!!errors.problemDescription}
                      helperText={errors.problemDescription?.message}
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
                      multiline
                      rows={4}
                      label="Lavori Eseguiti *"
                      placeholder="Descrivi nel dettaglio i lavori eseguiti"
                      error={!!errors.workPerformed}
                      helperText={errors.workPerformed?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="spareParts"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      multiline
                      rows={2}
                      label="Ricambi Utilizzati"
                      placeholder="Elenca i ricambi utilizzati (opzionale)"
                      error={!!errors.spareParts}
                      helperText={errors.spareParts?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    startIcon={<ArrowBack />}
                    onClick={() => router.back()}
                  >
                    Annulla
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<Save />}
                    disabled={loading}
                    size="large"
                  >
                    {loading ? 'Salvataggio...' : 'Salva Manutenzione'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </form>
    </Box>
  );
}
