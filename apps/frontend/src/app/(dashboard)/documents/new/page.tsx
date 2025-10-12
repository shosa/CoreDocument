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
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  CloudUpload,
  ArrowBack,
  Delete,
  Visibility,
  Check,
  Error as ErrorIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/PageHeader';
import Widget from '@/components/Widget';
import { documentsApi } from '@/lib/api';
import { useSnackbar } from 'notistack';

interface FileWithMetadata {
  file: File;
  supplier: string;
  docNumber: string;
  date: string;
}

export default function NewDocumentPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<FileWithMetadata[]>([]);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadResults, setUploadResults] = useState<any | null>(null);

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        supplier: '',
        docNumber: '',
        date: new Date().toISOString().split('T')[0],
      }));
      setFiles([...files, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleMetadataChange = (
    index: number,
    field: 'supplier' | 'docNumber' | 'date',
    value: string
  ) => {
    const updatedFiles = [...files];
    updatedFiles[index][field] = value;
    setFiles(updatedFiles);
  };

  const handlePreview = (file: File) => {
    setPreviewFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleClosePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewFile(null);
    setPreviewUrl(null);
  };

  const validateFiles = (): boolean => {
    if (files.length === 0) {
      enqueueSnackbar('Seleziona almeno un file da caricare', { variant: 'warning' });
      return false;
    }

    for (let i = 0; i < files.length; i++) {
      const fileData = files[i];
      if (!fileData.supplier || !fileData.docNumber || !fileData.date) {
        enqueueSnackbar(
          `Compila tutti i campi per il file: ${fileData.file.name}`,
          { variant: 'warning' }
        );
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateFiles()) return;

    try {
      setLoading(true);
      const uploadData = new FormData();

      // Aggiungi tutti i file
      files.forEach(fileData => {
        uploadData.append('files', fileData.file);
      });

      // Aggiungi metadati come JSON
      const metadata = files.map(fileData => ({
        supplier: fileData.supplier,
        docNumber: fileData.docNumber,
        date: fileData.date,
      }));
      uploadData.append('metadata', JSON.stringify(metadata));

      const response = await documentsApi.bulkUpload(uploadData);
      setUploadResults(response.data);

      if (response.data.failed === 0) {
        enqueueSnackbar(
          `${response.data.success} documenti caricati con successo!`,
          { variant: 'success' }
        );
        setTimeout(() => router.push('/documents'), 2000);
      } else {
        enqueueSnackbar(
          `${response.data.success} caricati, ${response.data.failed} falliti`,
          { variant: 'warning' }
        );
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Errore durante il caricamento';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / 1024 / 1024;
    return mb < 1 ? `${(bytes / 1024).toFixed(2)} KB` : `${mb.toFixed(2)} MB`;
  };

  return (
    <Box>
      <PageHeader
        title="Carica Documenti"
        breadcrumbs={[
          { label: 'Documenti', href: '/documents' },
          { label: 'Carica' },
        ]}
      />

      <Widget>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Area Upload */}
            <Grid item xs={12}>
              <Card
                sx={{
                  border: '2px dashed',
                  borderColor: files.length > 0 ? 'primary.main' : 'grey.300',
                  bgcolor: files.length > 0 ? 'primary.50' : 'grey.50',
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
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                      onChange={handleFilesChange}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="file-upload">
                      <Button variant="contained" component="span">
                        Seleziona File (Multiplo)
                      </Button>
                    </label>
                    {files.length > 0 && (
                      <Typography variant="body1" sx={{ mt: 2, fontWeight: 600 }}>
                        {files.length} file selezionati
                      </Typography>
                    )}
                    {files.length === 0 && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        Formati supportati: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX
                        <br />
                        Puoi selezionare più file contemporaneamente
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Tabella File e Metadati */}
            {files.length > 0 && (
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Compila i metadati (fornitore, numero, data) per ogni file prima di caricare.
                </Alert>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>File</TableCell>
                        <TableCell>Dimensione</TableCell>
                        <TableCell>Fornitore *</TableCell>
                        <TableCell>Numero Doc *</TableCell>
                        <TableCell>Data *</TableCell>
                        <TableCell>Azioni</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {files.map((fileData, index) => (
                        <TableRow key={index}>
                          <TableCell>{fileData.file.name}</TableCell>
                          <TableCell>{formatFileSize(fileData.file.size)}</TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              fullWidth
                              required
                              placeholder="Fornitore"
                              value={fileData.supplier}
                              onChange={(e) =>
                                handleMetadataChange(index, 'supplier', e.target.value)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              fullWidth
                              required
                              placeholder="Numero"
                              value={fileData.docNumber}
                              onChange={(e) =>
                                handleMetadataChange(index, 'docNumber', e.target.value)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              fullWidth
                              required
                              type="date"
                              value={fileData.date}
                              onChange={(e) =>
                                handleMetadataChange(index, 'date', e.target.value)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <IconButton
                                size="small"
                                onClick={() => handlePreview(fileData.file)}
                                title="Anteprima"
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleRemoveFile(index)}
                                title="Rimuovi"
                                color="error"
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            )}

            {/* Risultati Upload */}
            {uploadResults && (
              <Grid item xs={12}>
                <Alert
                  severity={uploadResults.failed === 0 ? 'success' : 'warning'}
                  sx={{ mb: 2 }}
                >
                  <Typography variant="h6" gutterBottom>
                    Risultati Caricamento
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Chip
                      icon={<Check />}
                      label={`${uploadResults.success} caricati`}
                      color="success"
                      variant="outlined"
                    />
                    {uploadResults.failed > 0 && (
                      <Chip
                        icon={<ErrorIcon />}
                        label={`${uploadResults.failed} falliti`}
                        color="error"
                        variant="outlined"
                      />
                    )}
                  </Box>
                  {uploadResults.errors && uploadResults.errors.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Errori:
                      </Typography>
                      {uploadResults.errors.map((err: any, i: number) => (
                        <Typography key={i} variant="body2" color="error">
                          • {err.filename}: {err.error}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Alert>
              </Grid>
            )}

            {/* Pulsanti Azione */}
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
                  startIcon={loading ? <CircularProgress size={20} /> : <CloudUpload />}
                  disabled={loading || files.length === 0}
                >
                  {loading ? 'Caricamento...' : `Carica ${files.length} Documento${files.length > 1 ? 'i' : ''}`}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Widget>

      {/* Modale Anteprima File */}
      <Dialog
        open={!!previewFile}
        onClose={handleClosePreview}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Anteprima: {previewFile?.name}</DialogTitle>
        <DialogContent>
          {previewUrl && previewFile ? (
            <Box sx={{ width: '100%', height: '70vh' }}>
              {previewFile.type.startsWith('image/') ? (
                <img
                  src={previewUrl}
                  alt={previewFile.name}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : previewFile.type === 'application/pdf' ? (
                <iframe
                  src={previewUrl}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  title="Anteprima PDF"
                />
              ) : (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography>Anteprima non disponibile per questo tipo di file</Typography>
                </Box>
              )}
            </Box>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePreview}>Chiudi</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
