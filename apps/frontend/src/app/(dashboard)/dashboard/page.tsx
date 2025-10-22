'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Grid,
  CircularProgress,
  TextField,
  Button,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  Stack,
  IconButton,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Search,
  CloudUpload,
  TrendingUp,
  Description,
  Visibility,
  Download,
} from '@mui/icons-material';
import PageHeader from '@/components/PageHeader';
import Widget from '@/components/Widget';
import StatCard from '@/components/StatCard';
import { documentsApi } from '@/lib/api';
import { useSnackbar } from 'notistack';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface Document {
  id: string;
  filename: string;
  supplier: string;
  docNumber: string;
  date: string;
  fileSize: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentDocuments, setRecentDocuments] = useState<Document[]>([]);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    thisMonth: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Carica documenti recenti (50 per UI) e statistiche totali
      const [recentDocsResponse, statsResponse] = await Promise.all([
        documentsApi.list({ limit: 50, page: 1 }),
        documentsApi.list({ limit: 1, page: 1 }), // Solo per meta.total
      ]);

      const documents = recentDocsResponse.data.data || recentDocsResponse.data || [];
      const totalDocuments = statsResponse.data.meta?.total || 0;

      // Ordina per data più recente
      const sortedDocs = [...documents].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setRecentDocuments(sortedDocs.slice(0, 10));

      // Estrai fornitori unici dai documenti caricati
      const uniqueSuppliers = [...new Set(documents.map((d: Document) => d.supplier))]
        .filter(Boolean)
        .slice(0, 10);
      setSuppliers(uniqueSuppliers as string[]);

      // Calcola statistiche questo mese usando API filter
      const now = new Date();
      const currentYear = now.getFullYear();
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const currentMonth = monthNames[now.getMonth()];

      const thisMonthResponse = await documentsApi.list({
        year: currentYear,
        month: currentMonth,
        limit: 1
      });
      const thisMonthCount = thisMonthResponse.data.meta?.total || 0;

      setStats({
        total: totalDocuments,
        thisMonth: thisMonthCount,
      });
    } catch (error) {
      enqueueSnackbar('Errore nel caricamento dei dati', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleQuickSearch = (supplier: string) => {
    router.push(`/documents?supplier=${encodeURIComponent(supplier)}`);
  };

  const handlePreview = async (doc: Document) => {
    try {
      setPreviewDoc(doc);
      const response = await documentsApi.getDownloadUrl(doc.id);
      setPreviewUrl(response.data.url);
    } catch (error) {
      enqueueSnackbar('Errore nel caricamento anteprima', { variant: 'error' });
    }
  };

  const handleClosePreview = () => {
    setPreviewDoc(null);
    setPreviewUrl(null);
  };

  const handleDownload = async (id: string) => {
    try {
      const response = await documentsApi.download(id);
      const doc = recentDocuments.find(d => d.id === id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc?.filename || 'document');
      document.body.appendChild(link);
      link.click();
      link.remove();
      enqueueSnackbar('Download avviato', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Errore durante il download', { variant: 'error' });
    }
  };

  if (loading) {
    return (
      <Box>
        <PageHeader title="Dashboard" breadcrumbs={[{ label: 'Dashboard' }]} />
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Gestione Documenti DDT"
        breadcrumbs={[{ label: 'Dashboard' }]}
        renderRight={
          <Button
            variant="contained"
            startIcon={<CloudUpload />}
            onClick={() => router.push('/documents/new')}
          >
            Carica Documenti
          </Button>
        }
      />

      {/* Barra di ricerca principale */}
      <Widget sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Cerca documenti per fornitore, numero, data..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
            endAdornment: (
              <Button variant="contained" onClick={handleSearch} sx={{ mr: -1 }}>
                Cerca
              </Button>
            ),
          }}
        />
      </Widget>

      <Grid container spacing={3}>
        {/* Statistiche */}
        <Grid item xs={12} sm={6}>
          <StatCard
            title="Documenti Totali"
            value={stats.total}
            icon={<Description />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <StatCard
            title="Questo Mese"
            value={stats.thisMonth}
            icon={<TrendingUp />}
            color="success"
          />
        </Grid>

        {/* Ricerca rapida per fornitore */}
        <Grid item xs={12}>
          <Widget>
            <Typography variant="h6" gutterBottom>
              Ricerca Rapida per Fornitore
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {suppliers.map((supplier) => (
                <Chip
                  key={supplier}
                  label={supplier}
                  onClick={() => handleQuickSearch(supplier)}
                  clickable
                  sx={{ mb: 1 }}
                />
              ))}
              {suppliers.length === 0 && (
                <Typography color="text.secondary" sx={{ py: 2 }}>
                  Nessun fornitore disponibile
                </Typography>
              )}
            </Stack>
          </Widget>
        </Grid>

        {/* Documenti recenti */}
        <Grid item xs={12}>
          <Widget>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Documenti Recenti
              </Typography>
              <Button onClick={() => router.push('/documents')}>
                Vedi tutti
              </Button>
            </Box>
            {recentDocuments.length > 0 ? (
              <List>
                {recentDocuments.map((doc) => (
                  <ListItem
                    key={doc.id}
                    disablePadding
                    secondaryAction={
                      <Stack direction="row" spacing={1}>
                        <IconButton
                          size="small"
                          onClick={() => handlePreview(doc)}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDownload(doc.id)}
                        >
                          <Download fontSize="small" />
                        </IconButton>
                      </Stack>
                    }
                  >
                    <ListItemButton onClick={() => handlePreview(doc)}>
                      <ListItemText
                        primary={`${doc.supplier} - ${doc.docNumber}`}
                        secondary={
                          doc.date
                            ? format(new Date(doc.date), 'dd/MM/yyyy', { locale: it })
                            : 'N/A'
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                Nessun documento disponibile. Carica il primo documento!
              </Typography>
            )}
          </Widget>
        </Grid>
      </Grid>

      {/* Modale Anteprima Documento */}
      <Dialog
        open={!!previewDoc}
        onClose={handleClosePreview}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Anteprima: {previewDoc?.supplier} - {previewDoc?.docNumber}
        </DialogTitle>
        <DialogContent>
          {previewUrl ? (
            <Box sx={{ width: '100%', height: '70vh' }}>
              <iframe
                src={previewUrl}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Anteprima documento"
              />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePreview}>Chiudi</Button>
          {previewDoc && (
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={() => {
                handleDownload(previewDoc.id);
                handleClosePreview();
              }}
            >
              Download
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
