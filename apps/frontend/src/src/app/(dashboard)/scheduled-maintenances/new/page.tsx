'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Switch,
  FormControlLabel,
  CircularProgress,
  Autocomplete,
} from '@mui/material';
import { Save, ArrowBack } from '@mui/icons-material';
import PageHeader from '@/components/PageHeader';
import Widget from '@/components/Widget';
import axiosInstance from '@/lib/axios';
import { useSnackbar } from 'notistack';

export default function NewScheduledMaintenancePage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [machines, setMachines] = useState<any[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    machineId: '',
    frequency: 'monthly',
    nextDueDate: '',
    isActive: true,
  });

  useEffect(() => {
    fetchMachines();
  }, []);

  const fetchMachines = async () => {
    try {
      const response = await axiosInstance.get('/machines');
      setMachines(response.data.data || response.data);
    } catch (error) {
      enqueueSnackbar('Errore nel caricamento dei macchinari', { variant: 'error' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.machineId || !formData.nextDueDate) {
      enqueueSnackbar('Compila tutti i campi obbligatori', { variant: 'warning' });
      return;
    }

    setLoading(true);
    try {
      // Convert date to ISO-8601 DateTime format
      const payload = {
        ...formData,
        nextDueDate: new Date(formData.nextDueDate).toISOString(),
      };

      await axiosInstance.post('/scheduled-maintenances', payload);
      enqueueSnackbar('Manutenzione programmata creata con successo', { variant: 'success' });
      router.push('/scheduled-maintenances');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Errore durante la creazione';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <Box>
      <PageHeader
        title="Nuova Manutenzione Programmata"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Manutenzioni Programmate', href: '/scheduled-maintenances' },
          { label: 'Nuova' },
        ]}
        renderRight={
          <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => router.back()}>
            Indietro
          </Button>
        }
      />

      <Widget>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Titolo"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Es: Controllo periodico freni"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Descrizione"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Descrizione dettagliata della manutenzione..."
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Autocomplete
                options={machines}
                value={selectedMachine}
                onChange={(event, newValue) => {
                  setSelectedMachine(newValue);
                  handleChange('machineId', newValue?.id || '');
                }}
                getOptionLabel={(option) =>
                  `${option.serialNumber} - ${option.manufacturer} ${option.model}`
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Macchinario"
                    required
                    placeholder="Cerca macchinario..."
                  />
                )}
                noOptionsText="Nessun macchinario trovato"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Frequenza</InputLabel>
                <Select
                  value={formData.frequency}
                  label="Frequenza"
                  onChange={(e) => handleChange('frequency', e.target.value)}
                >
                  <MenuItem value="daily">Giornaliera</MenuItem>
                  <MenuItem value="weekly">Settimanale</MenuItem>
                  <MenuItem value="monthly">Mensile</MenuItem>
                  <MenuItem value="quarterly">Trimestrale</MenuItem>
                  <MenuItem value="biannual">Semestrale</MenuItem>
                  <MenuItem value="annual">Annuale</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                type="date"
                label="Prossima Scadenza"
                value={formData.nextDueDate}
                onChange={(e) => handleChange('nextDueDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => handleChange('isActive', e.target.checked)}
                  />
                }
                label="Attiva"
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button variant="outlined" onClick={() => router.back()} disabled={loading}>
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
            </Grid>
          </Grid>
        </form>
      </Widget>
    </Box>
  );
}
