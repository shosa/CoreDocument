'use client';

import { useEffect, useState } from 'react';
import { Box, Grid, CircularProgress } from '@mui/material';
import {
  Description as DocumentIcon,
  Star as FavoriteIcon,
  TrendingUp as TrendingIcon,
  InsertDriveFile as FileIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/PageHeader';
import Widget from '@/components/Widget';
import StatCard from '@/components/StatCard';
import { documentsApi, favoritesApi } from '@/lib/api';
import { useSnackbar } from 'notistack';

interface Stats {
  totalDocuments: number;
  totalFavorites: number;
  documentsThisMonth: number;
  documentsThisYear: number;
}

export default function DashboardPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalDocuments: 0,
    totalFavorites: 0,
    documentsThisMonth: 0,
    documentsThisYear: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);

      const [documentsResponse, favoritesResponse] = await Promise.all([
        documentsApi.list(),
        favoritesApi.list(),
      ]);

      const documents = documentsResponse.data.data || documentsResponse.data;
      const favorites = favoritesResponse.data.data || favoritesResponse.data;

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const documentsThisMonth = documents.filter((doc: any) => {
        const docDate = new Date(doc.date);
        return docDate.getMonth() === currentMonth && docDate.getFullYear() === currentYear;
      }).length;

      const documentsThisYear = documents.filter((doc: any) => {
        const docDate = new Date(doc.date);
        return docDate.getFullYear() === currentYear;
      }).length;

      setStats({
        totalDocuments: documents.length,
        totalFavorites: favorites.length,
        documentsThisMonth,
        documentsThisYear,
      });
    } catch (error) {
      enqueueSnackbar('Errore nel caricamento delle statistiche', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Dashboard"
        breadcrumbs={[{ label: 'Dashboard' }]}
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Documenti Totali"
              value={stats.totalDocuments}
              icon={<DocumentIcon />}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Preferiti"
              value={stats.totalFavorites}
              icon={<FavoriteIcon />}
              color="secondary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Documenti Questo Mese"
              value={stats.documentsThisMonth}
              icon={<TrendingIcon />}
              color="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Documenti Quest'Anno"
              value={stats.documentsThisYear}
              icon={<FileIcon />}
              color="info"
            />
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
