'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Grid,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Card,
  CardContent,
  Divider,
  Chip,
  TextField,
  MenuItem,
  Paper,
  Stack,
  Avatar,
} from '@mui/material';
import {
  Edit,
  QrCode2,
  Close,
  Build,
  Category as CategoryIcon,
  Factory,
  CalendarMonth,
  Receipt,
  Description,
  CloudUpload,
  Download,
  Delete,
  Visibility,
} from '@mui/icons-material';
import PageHeader from '@/components/PageHeader';
import Widget from '@/components/Widget';
import axiosInstance from '@/lib/axios';
import { useSnackbar } from 'notistack';
import { Machine, Maintenance, Document } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import QRCode from 'qrcode';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function MachineDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { hasRole } = useAuthStore();
  const { enqueueSnackbar } = useSnackbar();
  const [machine, setMachine] = useState<Machine | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentCategory, setDocumentCategory] = useState('');

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

  const handleGenerateQR = async () => {
    try {
      const url = `${window.location.origin}/m/${params.id}`;
      const qrUrl = await QRCode.toDataURL(url, { width: 400 });
      setQrCodeUrl(qrUrl);
      setQrDialogOpen(true);
    } catch (error) {
      enqueueSnackbar('Errore nella generazione del QR code', { variant: 'error' });
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !documentCategory) {
      enqueueSnackbar('Seleziona un file e una categoria', { variant: 'warning' });
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('machineId', params.id as string);
      formData.append('documentCategory', documentCategory);

      await axiosInstance.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      enqueueSnackbar('Documento caricato con successo', { variant: 'success' });
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setDocumentCategory('');
      fetchMachine(); // Refresh data
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || 'Errore durante il caricamento', {
        variant: 'error',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadDocument = async (doc: Document) => {
    try {
      const response = await axiosInstance.get(`/documents/${doc.id}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      enqueueSnackbar('Errore durante il download', { variant: 'error' });
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo documento?')) return;

    try {
      await axiosInstance.delete(`/documents/${docId}`);
      enqueueSnackbar('Documento eliminato', { variant: 'success' });
      fetchMachine();
    } catch (error) {
      enqueueSnackbar('Errore durante l\'eliminazione', { variant: 'error' });
    }
  };

  const maintenanceColumns: GridColDef[] = [
    {
      field: 'date',
      headerName: 'Data',
      width: 120,
      valueFormatter: (value) => format(new Date(value), 'dd/MM/yyyy', { locale: it }),
    },
    {
      field: 'type',
      headerName: 'Tipo',
      width: 150,
      renderCell: (params) => {
        const colors: Record<string, any> = {
          ordinaria: 'success',
          straordinaria: 'info',
          guasto: 'error',
          riparazione: 'warning',
        };
        const labels: Record<string, string> = {
          ordinaria: 'Ordinaria',
          straordinaria: 'Straordinaria',
          guasto: 'Guasto',
          riparazione: 'Riparazione',
        };
        return (
          <Chip
            label={labels[params.value] || params.value}
            color={colors[params.value] || 'default'}
            size="small"
          />
        );
      },
    },
    {
      field: 'workPerformed',
      headerName: 'Lavoro Eseguito',
      flex: 1,
    },
    {
      field: 'cost',
      headerName: 'Costo',
      width: 120,
      valueFormatter: (value) => (value ? `€${Number(value).toFixed(2)}` : '-'),
    },
    {
      field: 'actions',
      headerName: 'Azioni',
      width: 80,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <IconButton
            size="small"
            onClick={() => router.push(`/maintenances/${params.id}`)}
            title="Visualizza"
            sx={{
              bgcolor: 'black',
              color: 'white',
              borderRadius: '6px',
              '&:hover': { bgcolor: 'grey.800' },
            }}
          >
            <Visibility fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  const documentColumns: GridColDef[] = [
    {
      field: 'fileName',
      headerName: 'Nome File',
      flex: 1,
    },
    {
      field: 'documentCategory',
      headerName: 'Categoria',
      width: 180,
      renderCell: (params) => {
        const categories: Record<string, string> = {
          manuale_uso: "Manuale d'uso",
          certificazione_ce: 'Certificazione CE',
          scheda_tecnica: 'Scheda Tecnica',
          fattura_acquisto: 'Fattura Acquisto',
          altro: 'Altro',
        };
        return <Chip label={categories[params.value] || params.value} size="small" />;
      },
    },
    {
      field: 'fileSize',
      headerName: 'Dimensione',
      width: 120,
      valueFormatter: (value) => {
        const kb = value / 1024;
        return kb > 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${kb.toFixed(2)} KB`;
      },
    },
    {
      field: 'uploadedAt',
      headerName: 'Caricato il',
      width: 150,
      valueFormatter: (value) => format(new Date(value), 'dd/MM/yyyy HH:mm', { locale: it }),
    },
    {
      field: 'actions',
      headerName: 'Azioni',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', height: '100%' }}>
          <IconButton
            size="small"
            onClick={() => handleDownloadDocument(params.row)}
            title="Scarica"
            sx={{
              bgcolor: 'black',
              color: 'white',
              borderRadius: '6px',
              '&:hover': { bgcolor: 'grey.800' },
            }}
          >
            <Download fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDeleteDocument(params.id as string)}
            title="Elimina"
            sx={{
              bgcolor: 'black',
              color: 'white',
              borderRadius: '6px',
              '&:hover': { bgcolor: 'grey.800' },
            }}
          >
            <Delete fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!machine) {
    return (
      <Box>
        <Typography>Macchinario non trovato</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={machine.description || `Macchinario ${machine.serialNumber}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Macchinari', href: '/machines' },
          { label: machine.serialNumber },
        ]}
      />

      {/* Header Card con info principali */}
      <Card elevation={0} sx={{ mb: 3, border: 1, borderColor: 'divider', borderRadius: 1 }}>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="h4" fontWeight={700} gutterBottom>
                    {machine.description}
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                    <Chip
                     
                      label={`${machine.manufacturer} ${machine.model}`}
                      variant="outlined"
                    />
                    <Chip
                    
                      label={machine.type?.category?.name || 'N/A'}
                      color="primary"
                      variant="outlined"
                    />
                    <Chip label={machine.type?.name || 'N/A'} variant="outlined" />
                  </Stack>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Matricola
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {machine.serialNumber}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Anno
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {machine.yearBuilt || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Data Acquisto
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {machine.purchaseDate
                        ? format(new Date(machine.purchaseDate), 'dd/MM/yyyy', { locale: it })
                        : '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Rivenditore
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {machine.dealer || '-'}
                    </Typography>
                  </Grid>
                </Grid>
              </Stack>
            </Grid>

            <Grid item xs={12} md={4}>
              <Stack spacing={1.5}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<Build />}
                  onClick={() => router.push(`/maintenances/new?machineId=${params.id}`)}
                  size="large"
                >
                  Nuova Manutenzione
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<QrCode2 />}
                  onClick={handleGenerateQR}
                >
                  Genera QR Code
                </Button>
                {hasRole(['admin', 'tecnico']) && (
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<Edit />}
                    onClick={() => router.push(`/machines/${params.id}/edit`)}
                  >
                    Modifica Scheda
                  </Button>
                )}
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs Content */}
      <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
        <Tabs
          value={tabValue}
          onChange={(_, v) => setTabValue(v)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab label="Dettagli Tecnici" />
          <Tab
            label={`Storico Manutenzioni (${machine.maintenances?.length || 0})`}
            icon={<Build fontSize="small" />}
            iconPosition="start"
          />
          <Tab
            label={`Documenti (${machine.documents?.length || 0})`}
            icon={<Description fontSize="small" />}
            iconPosition="start"
          />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={4}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Informazioni Generali
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Categoria
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {machine.type?.category?.name || '-'}
                  </Typography>
                </Stack>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Tipo Macchinario
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {machine.type?.name || '-'}
                  </Typography>
                </Stack>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Numero Seriale
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {machine.serialNumber}
                  </Typography>
                </Stack>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Produttore
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {machine.manufacturer || '-'}
                  </Typography>
                </Stack>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Modello
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {machine.model || '-'}
                  </Typography>
                </Stack>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Anno di Costruzione
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {machine.yearBuilt || '-'}
                  </Typography>
                </Stack>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Data di Acquisto
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {machine.purchaseDate
                      ? format(new Date(machine.purchaseDate), 'dd MMMM yyyy', { locale: it })
                      : '-'}
                  </Typography>
                </Stack>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Rivenditore
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {machine.dealer || '-'}
                  </Typography>
                </Stack>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Riferimento Fattura
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {machine.invoiceReference || '-'}
                  </Typography>
                </Stack>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Locazione Documenti
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {machine.documentLocation || '-'}
                  </Typography>
                </Stack>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom fontWeight={600} sx={{ mt: 2 }}>
                  Descrizione
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Typography variant="body1">{machine.description || 'Nessuna descrizione'}</Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 2 }}>
            {machine.maintenances && machine.maintenances.length > 0 ? (
              <DataGrid
                rows={machine.maintenances}
                columns={maintenanceColumns}
                autoHeight
                pageSizeOptions={[10, 25, 50]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 10 } },
                  sorting: { sortModel: [{ field: 'date', sort: 'desc' }] },
                }}
                disableRowSelectionOnClick
                sx={{
                  border: 0,
                  '& .MuiDataGrid-cell': { borderColor: 'divider' },
                  '& .MuiDataGrid-columnHeaders': {
                    bgcolor: 'background.default',
                    borderColor: 'divider',
                  },
                }}
              />
            ) : (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Build sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Nessuna manutenzione registrata
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Build />}
                  onClick={() => router.push(`/maintenances/new?machineId=${params.id}`)}
                  sx={{ mt: 2 }}
                >
                  Registra Prima Manutenzione
                </Button>
              </Box>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 2 }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<CloudUpload />}
                onClick={() => setUploadDialogOpen(true)}
              >
                Carica Documento
              </Button>
            </Box>

            {machine.documents && machine.documents.length > 0 ? (
              <DataGrid
                rows={machine.documents}
                columns={documentColumns}
                autoHeight
                pageSizeOptions={[10, 25, 50]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 10 } },
                  sorting: { sortModel: [{ field: 'uploadedAt', sort: 'desc' }] },
                }}
                disableRowSelectionOnClick
                sx={{
                  border: 0,
                  '& .MuiDataGrid-cell': { borderColor: 'divider' },
                  '& .MuiDataGrid-columnHeaders': {
                    bgcolor: 'background.default',
                    borderColor: 'divider',
                  },
                }}
              />
            ) : (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Description sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Nessun documento caricato
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Carica manuali, certificazioni, schede tecniche e altri documenti
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<CloudUpload />}
                  onClick={() => setUploadDialogOpen(true)}
                >
                  Carica Primo Documento
                </Button>
              </Box>
            )}
          </Box>
        </TabPanel>
      </Card>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onClose={() => setQrDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          QR Code Macchinario
          <IconButton
            onClick={() => setQrDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', p: 2 }}>
            {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code" style={{ maxWidth: '100%' }} />}
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Scansiona questo QR code per accedere rapidamente alla registrazione manutenzione
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              {`${window.location.origin}/m/${params.id}`}
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Upload Document Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => !uploading && setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Carica Documento
          <IconButton
            onClick={() => setUploadDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
            disabled={uploading}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              select
              label="Categoria Documento"
              value={documentCategory}
              onChange={(e) => setDocumentCategory(e.target.value)}
              fullWidth
              required
            >
              <MenuItem value="manuale_uso">Manuale d'uso</MenuItem>
              <MenuItem value="certificazione_ce">Certificazione CE</MenuItem>
              <MenuItem value="scheda_tecnica">Scheda Tecnica</MenuItem>
              <MenuItem value="fattura_acquisto">Fattura Acquisto</MenuItem>
              <MenuItem value="altro">Altro</MenuItem>
            </TextField>

            <Box>
              <input
                accept="*/*"
                style={{ display: 'none' }}
                id="file-upload"
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              <label htmlFor="file-upload">
                <Button
                  variant="outlined"
                  component="span"
                  fullWidth
                  startIcon={<CloudUpload />}
                  sx={{ py: 2 }}
                >
                  {selectedFile ? selectedFile.name : 'Seleziona File'}
                </Button>
              </label>
              {selectedFile && (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                  Dimensione: {(selectedFile.size / 1024).toFixed(2)} KB
                </Typography>
              )}
            </Box>

            <Button
              variant="contained"
              onClick={handleFileUpload}
              disabled={!selectedFile || !documentCategory || uploading}
              fullWidth
              size="large"
            >
              {uploading ? 'Caricamento...' : 'Carica Documento'}
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
}