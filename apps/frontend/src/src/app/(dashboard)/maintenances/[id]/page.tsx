'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  Typography,
  Divider,
} from '@mui/material';
import {
  Edit,
  ArrowBack,
  CalendarToday,
  Person,
  Build,
  AttachMoney,
  Construction,
  Description,
} from '@mui/icons-material';
import PageHeader from '@/components/PageHeader';
import axiosInstance from '@/lib/axios';
import { useSnackbar } from 'notistack';
import { Maintenance } from '@/types';

const getMaintenanceTypeColor = (type: string) => {
  switch (type) {
    case 'ordinaria':
      return 'success';
    case 'straordinaria':
      return 'info';
    case 'guasto':
      return 'error';
    case 'riparazione':
      return 'warning';
    default:
      return 'default';
  }
};

const getMaintenanceTypeLabel = (type: string) => {
  switch (type) {
    case 'ordinaria':
      return 'Ordinaria';
    case 'straordinaria':
      return 'Straordinaria';
    case 'guasto':
      return 'Guasto';
    case 'riparazione':
      return 'Riparazione';
    default:
      return type;
  }
};

export default function MaintenanceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [maintenance, setMaintenance] = useState<Maintenance | null>(null);

  useEffect(() => {
    fetchMaintenance();
  }, [params.id]);

  const fetchMaintenance = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/maintenances/${params.id}`);
      setMaintenance(response.data);
    } catch (error: any) {
      enqueueSnackbar('Errore nel caricamento della manutenzione', { variant: 'error' });
      router.push('/maintenances');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!maintenance) {
    return null;
  }

  return (
    <Box>
      <PageHeader
        title="Dettaglio Manutenzione"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Manutenzioni', href: '/maintenances' },
          { label: `Manutenzione #${maintenance.id.slice(0, 8)}` },
        ]}
      />

      {/* Header Card */}
      <Card elevation={0} sx={{ mb: 3, border: 1, borderColor: 'divider', borderRadius: 1 }}>
        <CardContent sx={{ p: 4 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box>
              <Stack direction="row" spacing={2} alignItems="center" mb={1}>
                <Typography variant="h4" fontWeight={700}>
                  Manutenzione #{maintenance.id.slice(0, 8)}
                </Typography>
                <Chip
                  label={getMaintenanceTypeLabel(maintenance.type)}
                  color={getMaintenanceTypeColor(maintenance.type) as any}
                  size="medium"
                />
              </Stack>
              <Typography variant="body1" color="text.secondary">
                Eseguita il {new Date(maintenance.date).toLocaleDateString('it-IT')}
              </Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={() => router.back()}
              >
                Indietro
              </Button>
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={() => router.push(`/maintenances/${params.id}/edit`)}
              >
                Modifica
              </Button>
            </Stack>
          </Stack>

          <Divider sx={{ my: 3 }} />

          {/* Quick Info Grid */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Build sx={{ color: 'primary.main' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Macchinario
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {maintenance.machine?.serialNumber} - {maintenance.machine?.description}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Person sx={{ color: 'primary.main' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Operatore
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {maintenance.operator?.firstName} {maintenance.operator?.lastName}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={2} alignItems="center">
                <CalendarToday sx={{ color: 'primary.main' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Data Intervento
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {new Date(maintenance.date).toLocaleDateString('it-IT', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
            {maintenance.cost && (
              <Grid item xs={12} md={6}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <AttachMoney sx={{ color: 'primary.main' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Costo
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      € {Number(maintenance.cost).toFixed(2)}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Details Grid */}
      <Grid container spacing={3}>
        {/* Work Performed */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                <Construction color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  Lavori Eseguiti
                </Typography>
              </Stack>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {maintenance.workPerformed}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Problem Description */}
        {maintenance.problemDescription && (
          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                  <Description color="primary" />
                  <Typography variant="h6" fontWeight={600}>
                    Descrizione Problema
                  </Typography>
                </Stack>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {maintenance.problemDescription}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Spare Parts */}
        {maintenance.spareParts && (
          <Grid item xs={12}>
            <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} mb={2}>
                  Ricambi Utilizzati
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {maintenance.spareParts}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Machine Link Card */}
        <Grid item xs={12}>
          <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Macchinario Associato
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {maintenance.machine?.description}
                  </Typography>
                  <Stack direction="row" spacing={1} mt={1}>
                    <Chip
                      label={`Matr.: ${maintenance.machine?.serialNumber}`}
                      size="small"
                      variant="outlined"
                    />
                    {maintenance.machine?.manufacturer && (
                      <Chip
                        label={`${maintenance.machine.manufacturer} ${maintenance.machine.model || ''}`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Stack>
                </Box>
                <Button
                  variant="outlined"
                  onClick={() => router.push(`/machines/${maintenance.machineId}`)}
                >
                  Visualizza Macchinario
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
