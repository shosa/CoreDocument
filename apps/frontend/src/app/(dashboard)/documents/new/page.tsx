'use client';

export const dynamic = 'force-dynamic';

import { useState, useCallback, useEffect } from 'react';
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
  Description,
  FileUpload,
  Warning,
  CheckCircle,
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
  isNewSupplier: boolean; // indica se è un fornitore nuovo
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
  const [singleIsNewSupplier, setSingleIsNewSupplier] = useState(false);

  // Lista fornitori esistenti caricati dall'API
  const [existingSuppliers, setExistingSuppliers] = useState<string[]>([]);
  const [suppliersLoading, setSuppliersLoading] = useState(true);

  // Carica fornitori esistenti al mount
  useEffect(() => {
    fetchExistingSuppliers();
  }, []);

  const fetchExistingSuppliers = async () => {
    try {
      setSuppliersLoading(true);
      const response = await documentsApi.list({ limit: 10000 });
      const docs = response.data.data || response.data || [];

      // Estrai fornitori unici
      const uniqueSuppliers = [...new Set(docs.map((d: any) => d.supplier))]
        .filter(Boolean)
        .sort();

      setExistingSuppliers(uniqueSuppliers as string[]);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    } finally {
      setSuppliersLoading(false);
    }
  };

  // Controlla se un fornitore è nuovo
  const checkIfNewSupplier = (supplier: string): boolean => {
    if (!supplier || supplier.trim() === '') return false;
    return !existingSuppliers.some(s =>
      s.toLowerCase().trim() === supplier.toLowerCase().trim()
    );
  };

  const handleFilesChange = (selectedFiles: FileList | null) => {
    if (selectedFiles) {
      const newFiles = Array.from(selectedFiles).map(file => ({
        file,
        supplier: '',
        docNumber: '',
        date: new Date().toISOString().split('T')[0],
        isNewSupplier: false,
      }));
      setFiles([...files, ...newFiles]);
    }
  };

  const handleSingleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSingleFile(file);
      // Reset campi
      setSingleSupplier('');
      setSingleDocNumber('');
      setSingleDate(new Date().toISOString().split('T')[0]);
      setSingleIsNewSupplier(false);
    }
  };

  // Handler per cambio fornitore singolo
  const handleSingleSupplierChange = (newValue: string | null) => {
    const value = newValue || '';
    setSingleSupplier(value);
    setSingleIsNewSupplier(checkIfNewSupplier(value));
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
        // Upload singolo
        const file = e.dataTransfer.files[0];
        setSingleFile(file);
        setSingleSupplier('');
        setSingleDocNumber('');
        setSingleDate(new Date().toISOString().split('T')[0]);
        setSingleIsNewSupplier(false);
      } else {
        // Upload multiplo
        handleFilesChange(e.dataTransfer.files);
      }
    }
  }, [tabValue]);

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

    // Se cambia il fornitore, controlla se è nuovo
    if (field === 'supplier') {
      updatedFiles[index].isNewSupplier = checkIfNewSupplier(value);
    }

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

      // Ricarica fornitori per aggiornare la lista
      if (singleIsNewSupplier) {
        await fetchExistingSuppliers();
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

        // Ricarica fornitori
        await fetchExistingSuppliers();

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
                  <Grid item xs={12} md={4}>
                    <Autocomplete
                      freeSolo
                      options={existingSuppliers}
                      value={singleSupplier}
                      onInputChange={(e, newValue) => handleSingleSupplierChange(newValue)}
                      loading={suppliersLoading}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Fornitore"
                          required
                          fullWidth
                          placeholder="Inserisci nome fornitore"
                          helperText={
                            singleIsNewSupplier && singleSupplier
                              ? '⚠️ Nuovo fornitore - Verifica l\'ortografia'
                              : 'Seleziona dalla lista o inserisci nuovo'
                          }
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {suppliersLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                {singleSupplier && (
                                  singleIsNewSupplier ? (
                                    <Warning color="warning" sx={{ mr: 1 }} />
                                  ) : (
                                    <CheckCircle color="success" sx={{ mr: 1 }} />
                                  )
                                )}
                                {params.InputProps.endAdornment}
                              </>
                            ),
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderColor: singleIsNewSupplier && singleSupplier ? 'warning.main' : undefined,
                            }
                          }}
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

                  {/* Alert per nuovo fornitore */}
                  {singleIsNewSupplier && singleSupplier && (
                    <Grid item xs={12}>
                      <Alert severity="warning" icon={<Warning />}>
                        <strong>Nuovo Fornitore Rilevato:</strong> "{singleSupplier}" non è presente nel database.
                        Verifica che il nome sia corretto per evitare duplicati.
                      </Alert>
                    </Grid>
                  )}

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
                            {files.filter(f => f.isNewSupplier).length} con fornitori nuovi
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                          Trascina qui i file oppure clicca per selezionare
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
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell width="25%">File</TableCell>
                          <TableCell width="10%">Dimensione</TableCell>
                          <TableCell width="22%">Fornitore *</TableCell>
                          <TableCell width="18%">Numero Doc *</TableCell>
                          <TableCell width="15%">Data *</TableCell>
                          <TableCell width="10%">Azioni</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {files.map((fileData, index) => (
                          <TableRow
                            key={index}
                            sx={{
                              bgcolor: fileData.isNewSupplier ? 'warning.50' : 'inherit',
                              '&:hover': { bgcolor: fileData.isNewSupplier ? 'warning.100' : 'action.hover' }
                            }}
                          >
                            <TableCell>
                              <Stack direction="row" spacing={1} alignItems="center">
                                {fileData.isNewSupplier && fileData.supplier && (
                                  <Chip
                                    icon={<Warning />}
                                    label="Nuovo"
                                    size="small"
                                    color="warning"
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
                              <Autocomplete
                                freeSolo
                                size="small"
                                options={existingSuppliers}
                                value={fileData.supplier}
                                onInputChange={(e, newValue) =>
                                  handleMetadataChange(index, 'supplier', newValue || '')
                                }
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    size="small"
                                    required
                                    placeholder="Fornitore"
                                    InputProps={{
                                      ...params.InputProps,
                                      endAdornment: (
                                        <>
                                          {fileData.supplier && (
                                            fileData.isNewSupplier ? (
                                              <Warning color="warning" fontSize="small" sx={{ mr: 0.5 }} />
                                            ) : (
                                              <CheckCircle color="success" fontSize="small" sx={{ mr: 0.5 }} />
                                            )
                                          )}
                                          {params.InputProps.endAdornment}
                                        </>
                                      ),
                                    }}
                                  />
                                )}
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

              {/* Alert per fornitori nuovi */}
              {files.some(f => f.isNewSupplier && f.supplier) && (
                <Grid item xs={12}>
                  <Alert severity="warning" icon={<Warning />}>
                    <strong>Attenzione:</strong> {files.filter(f => f.isNewSupplier && f.supplier).length} file hanno fornitori nuovi.
                    Verifica l'ortografia per evitare duplicati nel database.
                  </Alert>
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
