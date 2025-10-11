'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  Typography,
  Alert,
} from '@mui/material';
import { CloudUpload, ArrowBack } from '@mui/icons-material';
import PageHeader from '@/components/PageHeader';
import Widget from '@/components/Widget';
import { documentsApi } from '@/lib/api';
import { useSnackbar } from 'notistack';

export default function NewDocumentPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    supplier: '',
    docNumber: '',
    date: '',
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      enqueueSnackbar('Seleziona un file da caricare', { variant: 'warning' });
      return;
    }

    if (!formData.supplier || !formData.docNumber || !formData.date) {
      enqueueSnackbar('Compila tutti i campi obbligatori', { variant: 'warning' });
      return;
    }

    try {
      setLoading(true);
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('supplier', formData.supplier);
      uploadData.append('docNumber', formData.docNumber);
      uploadData.append('date', formData.date);

      await documentsApi.create(uploadData);
      enqueueSnackbar('Documento caricato con successo', { variant: 'success' });
      router.push('/documents');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Errore durante il caricamento';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Carica Nuovo Documento"
        breadcrumbs={[
          { label: 'Documenti', href: '/documents' },
          { label: 'Nuovo' },
        ]}
      />

      <Widget>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card
                sx={{
                  border: '2px dashed',
                  borderColor: file ? 'primary.main' : 'grey.300',
                  bgcolor: file ? 'primary.50' : 'grey.50',
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'primary.50',
                  },
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      py: 4,
                    }}
                  >
                    <CloudUpload sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                    <input
                      type="file"
                      id="file-upload"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="file-upload">
                      <Button variant="contained" component="span">
                        Seleziona File
                      </Button>
                    </label>
                    {file && (
                      <Typography variant="body1" sx={{ mt: 2, fontWeight: 600 }}>
                        {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </Typography>
                    )}
                    {!file && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        Formati supportati: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Fornitore"
                name="supplier"
                value={formData.supplier}
                onChange={handleInputChange}
                placeholder="Es: Fornitore SRL"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Numero Documento"
                name="docNumber"
                value={formData.docNumber}
                onChange={handleInputChange}
                placeholder="Es: DDT-2024-001"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                type="date"
                label="Data Documento"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Alert severity="info">
                Il documento verrà salvato in MinIO e indicizzato in Meilisearch per una ricerca veloce.
              </Alert>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2 }}>
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
                  startIcon={<CloudUpload />}
                  disabled={loading}
                >
                  {loading ? 'Caricamento...' : 'Carica Documento'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Widget>
    </Box>
  );
}
