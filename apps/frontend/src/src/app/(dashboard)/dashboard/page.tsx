'use client';

import { useEffect, useState } from 'react';
import { Grid, Box, Typography, CircularProgress } from '@mui/material';
import {
  PrecisionManufacturing,
  Build,
  Description,
  People,
  TrendingUp,
} from '@mui/icons-material';
import PageHeader from '@/components/PageHeader';
import Widget from '@/components/Widget';
import axiosInstance from '@/lib/axios';
import { useSnackbar } from 'notistack';
import { DashboardStats, Maintenance, Machine } from '@/types';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import MainFooterLogo from '@/components/MainFooterLogo';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  trend?: number;
}

function StatCard({ title, value, icon, color, trend }: StatCardProps) {
  return (
    <Widget>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h3" fontWeight={700}>
            {value}
          </Typography>
          {trend !== undefined && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <TrendingUp sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
              <Typography variant="caption" color="success.main">
                +{trend}% vs mese scorso
              </Typography>
            </Box>
          )}
        </Box>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: 2,
            bgcolor: `${color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color,
          }}
        >
          {icon}
        </Box>
      </Box>
    </Widget>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentMaintenances, setRecentMaintenances] = useState<Maintenance[]>([]);
  const [recentMachines, setRecentMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch data from different endpoints
      const [machinesRes, maintenancesRes, documentsRes, usersRes] = await Promise.all([
        axiosInstance.get('/machines'),
        axiosInstance.get('/maintenances'),
        axiosInstance.get('/documents'),
        axiosInstance.get('/users'),
      ]);

      // Calculate stats
      const calculatedStats: DashboardStats = {
        totalMachines: Array.isArray(machinesRes.data) ? machinesRes.data.length : 0,
        totalMaintenances: Array.isArray(maintenancesRes.data) ? maintenancesRes.data.length : 0,
        totalDocuments: Array.isArray(documentsRes.data) ? documentsRes.data.length : 0,
        totalUsers: Array.isArray(usersRes.data) ? usersRes.data.length : 0,
        pendingMaintenances: Array.isArray(maintenancesRes.data)
          ? maintenancesRes.data.filter((m: any) => m.status === 'pending').length
          : 0,
      };

      setStats(calculatedStats);

      // Get recent maintenances (last 5)
      const allMaintenances = Array.isArray(maintenancesRes.data) ? maintenancesRes.data : [];
      const sortedMaintenances = [...allMaintenances].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
      setRecentMaintenances(sortedMaintenances.slice(0, 5));

      // Get recent machines (last 5)
      const allMachines = Array.isArray(machinesRes.data) ? machinesRes.data : [];
      const sortedMachines = [...allMachines].sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
      );
      setRecentMachines(sortedMachines.slice(0, 5));
    } catch (error: any) {
      enqueueSnackbar('Errore nel caricamento dei dati', { variant: 'error' });
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const machineColumns: GridColDef[] = [
    {
      field: 'serialNumber',
      headerName: 'Matricola',
      width: 150,
    },
    {
      field: 'description',
      headerName: 'Descrizione',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'manufacturer',
      headerName: 'Produttore',
      width: 150,
    },
    {
      field: 'model',
      headerName: 'Modello',
      width: 150,
    },
    {
      field: 'type',
      headerName: 'Tipo',
      width: 150,
      valueGetter: (value, row) => row.type?.name || '-',
    },
  ];

  const maintenanceColumns: GridColDef[] = [
    {
      field: 'date',
      headerName: 'Data',
      width: 120,
      valueFormatter: value => {
        return format(new Date(value), 'dd/MM/yyyy', { locale: it });
      },
    },
    {
      field: 'machine',
      headerName: 'Macchinario',
      flex: 1,
      minWidth: 200,
      valueGetter: (value, row) => {
        const machine = row.machine;
        if (!machine) return '-';
        const model = machine.model || machine.manufacturer || '';
        const serial = machine.serialNumber || '';
        return model ? `${model} (${serial})` : serial;
      },
    },
    {
      field: 'type',
      headerName: 'Tipo',
      width: 150,
      valueFormatter: value => {
        const types: Record<string, string> = {
          ordinaria: 'Ordinaria',
          straordinaria: 'Straordinaria',
          guasto: 'Guasto',
          riparazione: 'Riparazione',
        };
        return types[value] || value;
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
      valueFormatter: value => {
        return value ? `€${Number(value).toFixed(2)}` : '-';
      },
    },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader title="Dashboard" />

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Macchinari Censiti"
            value={stats?.totalMachines || 0}
            icon={<PrecisionManufacturing sx={{ fontSize: 28 }} />}
            color="#1976d2"
           
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Manutenzioni Registrate"
            value={stats?.totalMaintenances || 0}
            icon={<Build sx={{ fontSize: 28 }} />}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Documenti Disponibili"
            value={stats?.totalDocuments || 0}
            icon={<Description sx={{ fontSize: 28 }} />}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Utenti"
            value={stats?.totalUsers || 0}
            icon={<People sx={{ fontSize: 28 }} />}
            color="#9c27b0"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Widget title="Ultimi Macchinari Aggiunti">
            <DataGrid
              rows={recentMachines}
              columns={machineColumns}
              autoHeight
              pageSizeOptions={[5]}
              initialState={{
                pagination: { paginationModel: { pageSize: 5 } },
              }}
              disableRowSelectionOnClick
              sx={{
                border: 0,
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                },
              }}
            />
          </Widget>
        </Grid>

        <Grid item xs={12} md={6}>
          <Widget title="Manutenzioni Recenti">
            <DataGrid
              rows={recentMaintenances}
              columns={maintenanceColumns}
              autoHeight
              pageSizeOptions={[5]}
              initialState={{
                pagination: { paginationModel: { pageSize: 5 } },
              }}
              disableRowSelectionOnClick
              sx={{
                border: 0,
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                },
              }}
            />
          </Widget>
        </Grid>
      </Grid>
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <MainFooterLogo opacity={0.8} />
      </Box>
    </Box>
  );
}
