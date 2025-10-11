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
import { Save, ArrowBack, Upload } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import PageHeader from '@/components/PageHeader';
import Widget from '@/components/Widget';
import axiosInstance from '@/lib/axios';
import { useSnackbar } from 'notistack';
import { Machine } from '@/types';

export default function NewDocumentPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [file, setFile] = useState<File | null>(null);

  const { control, handleSubmit, watch } = useForm({
    defaultValues: {
      machineId: 0,
      documentCategory: 'altro',
    },
  });

  useEffect(() => {
    fetchMachines();
  }, []);

  const fetchMachines = async () => {
    try {
      const response = await axiosInstance.get('/machines');
      setMachines(response.data.data || response.data);
    } catch (error: any) {
      enqueueSnackbar('Errore nel caricamento dei macchinari', { variant: 'error' });
    }
  };

  const onSubmit = async (data: any) => {
    if (!file) {
      enqueueSnackbar('Seleziona un file', { variant: 'error' });
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('machineId', data.machineId.toString());
      formData.append('documentCategory', data.documentCategory);

      await axiosInstance.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      enqueueSnackbar('Documento caricato con successo', { variant: 'success' });
      router.push('/documents');
    } catch (error: any) {
      enqueueSnackbar('Errore durante il caricamento', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Carica Documento"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Documenti', href: '/documents' },
          { label: 'Nuovo' },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <Widget>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Controller
                name="machineId"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth select label="Macchinario *">
                    <MenuItem value={0}>Seleziona macchinario</MenuItem>
                    {machines.map((machine) => (
                      <MenuItem key={machine.id} value={machine.id}>
                        {machine.serialNumber} - {machine.type?.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="documentCategory"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth select label="Categoria *">
                    <MenuItem value="manuale_uso">Manuale d'uso</MenuItem>
                    <MenuItem value="certificazione_ce">Certificazione CE</MenuItem>
                    <MenuItem value="scheda_tecnica">Scheda Tecnica</MenuItem>
                    <MenuItem value="fattura_acquisto">Fattura Acquisto</MenuItem>
                    <MenuItem value="altro">Altro</MenuItem>
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Button variant="outlined" component="label" startIcon={<Upload />} fullWidth>
                {file ? file.name : 'Seleziona File'}
                <input
                  type="file"
                  hidden
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </Button>
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => router.push('/documents')}
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
              Carica
            </Button>
          </Box>
        </Widget>
      </form>
    </Box>
  );
}
