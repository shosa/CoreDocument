'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Box,
  Button,
  TextField,
  Grid,
  CircularProgress,
  Autocomplete,
  Alert,
  Stack,
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import PageHeader from '@/components/PageHeader';
import Widget from '@/components/Widget';
import { documentsApi } from '@/lib/api';
import { useSnackbar } from 'notistack';
import { format } from 'date-fns';

interface Document {
  id: string;
  filename: string;
  supplier: string;
  docNumber: string;
  date: string;
  month: string;
  year: number;
  fileSize: number;
  fileExtension: string;
}

export default function EditDocumentPage() {
  const router = useRouter();
  const params = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [document, setDocument] = useState<Document | null>(null);

  // Form fields
  const [supplier, setSupplier] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [date, setDate] = useState('');

  // Supplier validation
  const [existingSuppliers, setExistingSuppliers] = useState<string[]>([]);
  const [isNewSupplier, setIsNewSupplier] = useState(false);

  useEffect(() => {
    fetchDocument();
    fetchExistingSuppliers();
  }, [params.id]);

  useEffect(() => {
    checkIfNewSupplier(supplier);
  }, [supplier, existingSuppliers]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      const response = await documentsApi.get(params.id as string);
      const doc = response.data;
      setDocument(doc);
      setSupplier(doc.supplier);
      setDocNumber(doc.docNumber);
      setDate(doc.date.split('T')[0]); // Convert to YYYY-MM-DD format
    } catch (error: any) {
      enqueueSnackbar('Errore nel caricamento del documento', { variant: 'error' });
      router.push('/documents');
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingSuppliers = async () => {
    try {
      const response = await documentsApi.list({ limit: 10000 });
      const docs = response.data.data || response.data || [];

      const uniqueSuppliers = [...new Set(docs.map((d: any) => d.supplier))]
        .filter(Boolean)
        .sort();

      setExistingSuppliers(uniqueSuppliers as string[]);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  const checkIfNewSupplier = (supplierName: string): void => {
    if (!supplierName || supplierName.trim() === '') {
      setIsNewSupplier(false);
      return;
    }
    const isNew = !existingSuppliers.some(s =>
      s.toLowerCase().trim() === supplierName.toLowerCase().trim()
    );
    setIsNewSupplier(isNew);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplier.trim() || !docNumber.trim() || !date) {
      enqueueSnackbar('Compila tutti i campi obbligatori', { variant: 'warning' });
      return;
    }

    try {
      setSaving(true);
      await documentsApi.update(params.id as string, {
        supplier: supplier.trim(),
        docNumber: docNumber.trim(),
        date: date,
      });

      enqueueSnackbar('Documento aggiornato con successo', { variant: 'success' });
      router.push('/documents');
    } catch (error: any) {
      enqueueSnackbar(
        error.response?.data?.message || 'Errore durante l\'aggiornamento',
        { variant: 'error' }
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!document) {
    return null;
  }

  return (
    <Box>
      <PageHeader
        title="Modifica Documento"
        action={
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => router.push('/documents')}
          >
            Annulla
          </Button>
        }
      />

      <Widget>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Info file */}
            <Grid item xs={12}>
              <Alert severity="info">
                <strong>File:</strong> {document.filename} ({(document.fileSize / 1024).toFixed(2)} KB)
              </Alert>
            </Grid>

            {/* Fornitore */}
            <Grid item xs={12} md={4}>
              <Autocomplete
                freeSolo
                options={existingSuppliers}
                value={supplier}
                onInputChange={(_, newValue) => setSupplier(newValue || '')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Fornitore"
                    required
                    helperText="Inizia a digitare per vedere i suggerimenti"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {isNewSupplier && supplier ? (
                            <Warning color="warning" sx={{ mr: 1 }} />
                          ) : supplier && !isNewSupplier ? (
                            <CheckCircle color="success" sx={{ mr: 1 }} />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Grid>

            {/* Numero Documento */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Numero Documento"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                required
              />
            </Grid>

            {/* Data */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Data"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            {/* Warning nuovo fornitore */}
            {isNewSupplier && supplier && (
              <Grid item xs={12}>
                <Alert severity="warning" icon={<Warning />}>
                  <strong>Nuovo Fornitore Rilevato:</strong> "{supplier}" non è presente nel database.
                  Verifica che il nome sia corretto per evitare duplicati.
                </Alert>
              </Grid>
            )}

            {/* Pulsanti */}
            <Grid item xs={12}>
              <Stack direction="row" spacing={2}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<Save />}
                  disabled={saving}
                  size="large"
                >
                  {saving ? 'Salvataggio...' : 'Salva Modifiche'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => router.push('/documents')}
                  disabled={saving}
                  size="large"
                >
                  Annulla
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </form>
      </Widget>
    </Box>
  );
}
