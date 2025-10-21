'use client';

import { useState, useCallback } from 'react';
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
  Tabs,
  Tab,
  LinearProgress,
  Autocomplete,
  Stack,
} from '@mui/material';
import {
  CloudUpload,
  ArrowBack,
  Delete,
  Visibility,
  Check,
  Error as ErrorIcon,
  AutoAwesome,
  Description,
  FileUpload,
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
  parsed: boolean; // indica se i dati sono stati auto-compilati
}

interface UploadProgress {
  current: number;
  total: number;
  percentage: number;
}

export default function NewDocumentPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [files, setFiles] = useState<FileWithMetadata[]>([]);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadResults, setUploadResults] = useState<any | null>(null);
  const [tabValue, setTabValue] = useState(0); // 0 = Singolo, 1 = Multiplo
  const [dragActive, setDragActive] = useState(false);

  // Per upload singolo
  const [singleFile, setSingleFile] = useState<File | null>(null);
  const [singleSupplier, setSingleSupplier] = useState('');
  const [singleDocNumber, setSingleDocNumber] = useState('');
  const [singleDate, setSingleDate] = useState(new Date().toISOString().split('T')[0]);

  // Lista fornitori per autocomplete (simulata - in produzione verrebbe da API)
  const [knownSuppliers, setKnownSuppliers] = useState<string[]>([]);

  // Parsing intelligente del nome file
  const parseFileName = (filename: string): Partial<FileWithMetadata> => {
    // Rimuovi estensione
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');

    // Pattern comuni:
    // 1. FORNITORE_NUM123_20250115
    // 2. FORNITORE - NUM123 - 2025-01-15
    // 3. NUM123_FORNITORE_15-01-2025

    let supplier = '';
    let docNumber = '';
    let date = '';

    // Prova pattern 1: underscore separato
    const pattern1 = /^([^_]+)_([^_]+)_(\d{8})$/;
    const match1 = nameWithoutExt.match(pattern1);
    if (match1) {
      supplier = match1[1].trim();
      docNumber = match1[2].trim();
      const dateStr = match1[3];
      // Converti YYYYMMDD in YYYY-MM-DD
      date = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
      return { supplier, docNumber, date, parsed: true };
    }

    // Prova pattern 2: con trattini e spazi
    const pattern2 = /^([^-]+)\s*-\s*([^-]+)\s*-\s*(\d{4}[-/]\d{2}[-/]\d{2})$/;
    const match2 = nameWithoutExt.match(pattern2);
    if (match2) {
      supplier = match2[1].trim();
      docNumber = match2[2].trim();
      date = match2[3].replace(/\//g, '-');
      return { supplier, docNumber, date, parsed: true };
    }

    // Prova pattern 3: numero prima del fornitore
    const pattern3 = /^([A-Z0-9]+)_([^_]+)_(\d{2}[-/]\d{2}[-/]\d{4})$/;
    const match3 = nameWithoutExt.match(pattern3);
    if (match3) {
      docNumber = match3[1].trim();
      supplier = match3[2].trim();
      const dateStr = match3[3];
      // Converti DD-MM-YYYY in YYYY-MM-DD
      const parts = dateStr.split(/[-/]/);
      date = `${parts[2]}-${parts[1]}-${parts[0]}`;
      return { supplier, docNumber, date, parsed: true };
    }

    // Se non riesce il parsing, prova almeno a estrarre numeri per docNumber
    const numberMatch = nameWithoutExt.match(/\d+/);
    if (numberMatch) {
      docNumber = numberMatch[0];
    }

    // Prova a estrarre il fornitore (prima parola in maiuscolo)
    const words = nameWithoutExt.split(/[_\s-]+/);
    if (words.length > 0) {
      supplier = words[0];
    }

    return {
      supplier,
      docNumber,
      date: new Date().toISOString().split('T')[0],
      parsed: !!(supplier || docNumber),
    };
  };

  const handleFilesChange = (selectedFiles: FileList | null) => {
    if (selectedFiles) {
      const newFiles = Array.from(selectedFiles).map(file => {
        const parsed = parseFileName(file.name);
        return {
          file,
          supplier: parsed.supplier || '',
          docNumber: parsed.docNumber || '',
          date: parsed.date || new Date().toISOString().split('T')[0],
          parsed: parsed.parsed || false,
        };
      });
      setFiles([...files, ...newFiles]);

      // Mostra notifica se i dati sono stati auto-compilati
      const parsedCount = newFiles.filter(f => f.parsed).length;
      if (parsedCount > 0) {
        enqueueSnackbar(
          `${parsedCount} file con dati auto-compilati! Controlla e modifica se necessario.`,
          { variant: 'info' }
        );
      }
    }
  };

  const handleSingleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSingleFile(file);

      // Auto-compila se possibile
      const parsed = parseFileName(file.name);
      if (parsed.supplier) setSingleSupplier(parsed.supplier);
      if (parsed.docNumber) setSingleDocNumber(parsed.docNumber);
      if (parsed.date) setSingleDate(parsed.date);

      if (parsed.parsed) {
        enqueueSnackbar('Dati auto-compilati dal nome file! Controlla e modifica se necessario.', {
          variant: 'info',
        });
      }
    }
  };

  // Drag & Drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (tabValue === 0) {
        // Upload singolo - prendi solo il primo file
        const file = e.dataTransfer.files[0];
        setSingleFile(file);
        const parsed = parseFileName(file.name);
        if (parsed.supplier) setSingleSupplier(parsed.supplier);
        if (parsed.docNumber) setSingleDocNumber(parsed.docNumber);
        if (parsed.date) setSingleDate(parsed.date);
      } else {
        // Upload multiplo
        handleFilesChange(e.dataTransfer.files);
      }
    }
  }, [tabValue, files]);

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

  const validateSingleFile = (): boolean => {
    if (!singleFile) {
      enqueueSnackbar('Seleziona un file da caricare', { variant: 'warning' });
      return false;
    }
    if (!singleSupplier || !singleDocNumber || !singleDate) {
      enqueueSnackbar('Compila tutti i campi obbligatori', { variant: 'warning' });
      return false;
    }
    return true;
  };

  const validateMultipleFiles = (): boolean => {
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

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateSingleFile()) return;

    try {
      setLoading(true);
      setUploadProgress({ current: 0, total: 1, percentage: 0 });

      const uploadData = new FormData();
      uploadData.append('files', singleFile!);
      uploadData.append('metadata', JSON.stringify([{
        supplier: singleSupplier,
        docNumber: singleDocNumber,
        date: singleDate,
      }]));

      const response = await documentsApi.bulkUpload(uploadData);

      setUploadProgress({ current: 1, total: 1, percentage: 100 });

      enqueueSnackbar('Documento caricato con successo!', { variant: 'success' });

      // Aggiungi il fornitore alla lista se non esiste
      if (!knownSuppliers.includes(singleSupplier)) {
        setKnownSuppliers([...knownSuppliers, singleSupplier]);
      }

      setTimeout(() => router.push('/documents'), 1500);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Errore durante il caricamento';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setLoading(false);
      setUploadProgress(null);
    }
  };

  const handleMultipleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateMultipleFiles()) return;

    try {
      setLoading(true);
      setUploadProgress({ current: 0, total: files.length, percentage: 0 });

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

      setUploadProgress({ current: files.length, total: files.length, percentage: 100 });

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
      setTimeout(() => setUploadProgress(null), 2000);
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
        {/* Tabs per Singolo/Multiplo */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab
              icon={<Description />}
              iconPosition="start"
              label="Upload Singolo"
            />
            <Tab
              icon={<FileUpload />}
              iconPosition="start"
              label="Upload Multiplo (Bulk)"
            />
          </Tabs>
        </Box>

        {/* Upload Progress */}
        {uploadProgress && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Caricamento in corso... {uploadProgress.current} di {uploadProgress.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {uploadProgress.percentage}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={uploadProgress.percentage}
              sx={{ height: 8, borderRadius: 1 }}
            />
          </Box>
        )}

        {/* TAB 0: UPLOAD SINGOLO */}
        {tabValue === 0 && (
          <form onSubmit={handleSingleSubmit}>
            <Grid container spacing={3}>
              {/* Drag & Drop Area */}
              <Grid item xs={12}>
                <Card
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  sx={{
                    border: '2px dashed',
                    borderColor: dragActive ? 'primary.main' : singleFile ? 'success.main' : 'grey.300',
                    bgcolor: dragActive ? 'primary.50' : singleFile ? 'success.50' : 'grey.50',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'primary.50',
                      transform: 'scale(1.01)',
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
                      <CloudUpload
                        sx={{
                          fontSize: 64,
                          color: singleFile ? 'success.main' : 'primary.main',
                          mb: 2
                        }}
                      />
                      <input
                        type="file"
                        id="single-file-upload"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                        onChange={handleSingleFileChange}
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="single-file-upload">
                        <Button
                          variant="contained"
                          component="span"
                          startIcon={<CloudUpload />}
                        >
                          Seleziona File
                        </Button>
                      </label>
                      {singleFile ? (
                        <Box sx={{ mt: 2, textAlign: 'center' }}>
                          <Chip
                            label={singleFile.name}
                            color="success"
                            onDelete={() => setSingleFile(null)}
                            sx={{ maxWidth: 400 }}
                          />
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {formatFileSize(singleFile.size)}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                          Trascina qui il file oppure clicca per selezionare
                          <br />
                          Formati supportati: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Form Metadati */}
              {singleFile && (
                <>
                  <Grid item xs={12}>
                    <Alert severity="info" icon={<AutoAwesome />}>
                      I dati sono stati auto-compilati dal nome del file. Verifica e modifica se necessario.
                    </Alert>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Autocomplete
                      freeSolo
                      options={knownSuppliers}
                      value={singleSupplier}
                      onInputChange={(e, newValue) => setSingleSupplier(newValue)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Fornitore"
                          required
                          fullWidth
                          placeholder="Nome fornitore"
                          helperText="Inserisci o seleziona dalla lista"
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      required
                      label="Numero Documento"
                      placeholder="es. DDT001234"
                      value={singleDocNumber}
                      onChange={(e) => setSingleDocNumber(e.target.value)}
                      helperText="Numero identificativo del documento"
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      required
                      type="date"
                      label="Data Documento"
                      value={singleDate}
                      onChange={(e) => setSingleDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      helperText="Data del documento"
                    />
                  </Grid>

                  {/* Preview del file */}
                  <Grid item xs={12}>
                    <Button
                      variant="outlined"
                      startIcon={<Visibility />}
                      onClick={() => handlePreview(singleFile)}
                    >
                      Anteprima Documento
                    </Button>
                  </Grid>
                </>
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
                    size="large"
                    startIcon={loading ? <CircularProgress size={20} /> : <CloudUpload />}
                    disabled={loading || !singleFile}
                  >
                    {loading ? 'Caricamento...' : 'Carica Documento'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        )}

        {/* TAB 1: UPLOAD MULTIPLO */}
        {tabValue === 1 && (
          <form onSubmit={handleMultipleSubmit}>
            <Grid container spacing={3}>
              {/* Area Upload Multiplo */}
              <Grid item xs={12}>
                <Card
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  sx={{
                    border: '2px dashed',
                    borderColor: dragActive ? 'primary.main' : files.length > 0 ? 'success.main' : 'grey.300',
                    bgcolor: dragActive ? 'primary.50' : files.length > 0 ? 'success.50' : 'grey.50',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
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
                      <CloudUpload
                        sx={{
                          fontSize: 64,
                          color: files.length > 0 ? 'success.main' : 'primary.main',
                          mb: 2
                        }}
                      />
                      <input
                        type="file"
                        id="file-upload"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                        onChange={(e) => handleFilesChange(e.target.files)}
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="file-upload">
                        <Button
                          variant="contained"
                          component="span"
                          startIcon={<FileUpload />}
                        >
                          Seleziona File (Multipli)
                        </Button>
                      </label>
                      {files.length > 0 ? (
                        <Box sx={{ mt: 2, textAlign: 'center' }}>
                          <Chip
                            label={`${files.length} file selezionati`}
                            color="success"
                            icon={<Check />}
                          />
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {files.filter(f => f.parsed).length} con dati auto-compilati
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                          Trascina qui i file oppure clicca per selezionare
                          <br />
                          Puoi selezionare più file contemporaneamente
                          <br />
                          <strong>Tip:</strong> Nomina i file come "FORNITORE_NUM123_20250115.pdf" per auto-compilazione
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Tabella File e Metadati */}
              {files.length > 0 && (
                <>
                  <Grid item xs={12}>
                    <Alert severity="info" icon={<AutoAwesome />}>
                      {files.filter(f => f.parsed).length > 0 && (
                        <>
                          <strong>{files.filter(f => f.parsed).length}</strong> file con dati auto-compilati dal nome!
                          {' '}
                        </>
                      )}
                      Verifica e compila i campi mancanti prima di caricare.
                    </Alert>
                  </Grid>
                  <Grid item xs={12}>
                    <TableContainer component={Paper} variant="outlined">
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell width="25%">File</TableCell>
                            <TableCell width="10%">Dimensione</TableCell>
                            <TableCell width="20%">Fornitore *</TableCell>
                            <TableCell width="20%">Numero Doc *</TableCell>
                            <TableCell width="15%">Data *</TableCell>
                            <TableCell width="10%">Azioni</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {files.map((fileData, index) => (
                            <TableRow
                              key={index}
                              sx={{
                                bgcolor: fileData.parsed ? 'success.50' : 'inherit',
                                '&:hover': { bgcolor: fileData.parsed ? 'success.100' : 'action.hover' }
                              }}
                            >
                              <TableCell>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  {fileData.parsed && (
                                    <Chip
                                      icon={<AutoAwesome />}
                                      label="Auto"
                                      size="small"
                                      color="success"
                                      sx={{ height: 20 }}
                                    />
                                  )}
                                  <Typography variant="body2" noWrap>
                                    {fileData.file.name}
                                  </Typography>
                                </Stack>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {formatFileSize(fileData.file.size)}
                                </Typography>
                              </TableCell>
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
                </>
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
                    size="large"
                    startIcon={loading ? <CircularProgress size={20} /> : <CloudUpload />}
                    disabled={loading || files.length === 0}
                  >
                    {loading ? 'Caricamento...' : `Carica ${files.length} Documento${files.length > 1 ? 'i' : ''}`}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        )}
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
