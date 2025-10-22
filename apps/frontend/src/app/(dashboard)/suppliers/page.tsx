'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  CircularProgress,
  TextField,
  InputAdornment,
  Chip,
  Avatar,
} from '@mui/material';
import { Search, Business, Description, TrendingUp } from '@mui/icons-material';
import PageHeader from '@/components/PageHeader';
import Widget from '@/components/Widget';
import { documentsApi } from '@/lib/api';
import { useSnackbar } from 'notistack';

interface SupplierStats {
  name: string;
  totalDocuments: number;
  latestDate: string | null;
  monthlyCount: number;
}

export default function SuppliersPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<SupplierStats[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      // Carica tutti i documenti per calcolare stats per fornitore
      const response = await documentsApi.list({ limit: 10000 });
      const documents = response.data.data || response.data || [];

      // Raggruppa per fornitore
      const supplierMap = new Map<string, any[]>();
      documents.forEach((doc: any) => {
        if (!doc.supplier) return;
        if (!supplierMap.has(doc.supplier)) {
          supplierMap.set(doc.supplier, []);
        }
        supplierMap.get(doc.supplier)!.push(doc);
      });

      // Calcola statistiche per ogni fornitore
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const stats: SupplierStats[] = Array.from(supplierMap.entries()).map(([name, docs]) => {
        const sortedDocs = docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const latestDate = sortedDocs[0]?.date || null;

        const monthlyCount = docs.filter(doc => {
          const docDate = new Date(doc.date);
          return docDate.getMonth() === currentMonth && docDate.getFullYear() === currentYear;
        }).length;

        return {
          name,
          totalDocuments: docs.length,
          latestDate,
          monthlyCount,
        };
      });

      // Ordina per numero di documenti (decrescente)
      stats.sort((a, b) => b.totalDocuments - a.totalDocuments);

      setSuppliers(stats);
    } catch (error) {
      enqueueSnackbar('Errore nel caricamento dei fornitori', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSupplierClick = (supplierName: string) => {
    router.push(`/suppliers/${encodeURIComponent(supplierName)}`);
  };

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSupplierInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getSupplierColor = (name: string) => {
    // Genera un colore consistente basato sul nome
    const colors = [
      '#1976d2', '#388e3c', '#d32f2f', '#7b1fa2', '#f57c00',
      '#0097a7', '#c2185b', '#5d4037', '#455a64', '#00796b'
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  return (
    <Box>
      <PageHeader
        title="Fornitori"
        breadcrumbs={[{ label: 'Fornitori' }]}
      />

      <Widget>
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Cerca fornitore..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary">
                {filteredSuppliers.length} fornitori trovati
              </Typography>
            </Box>

            <Grid container spacing={3}>
              {filteredSuppliers.map(supplier => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={supplier.name}>
                  <Card
                    sx={{
                      height: '100%',
                      transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: 4,
                        transform: 'translateY(-4px)',
                      },
                    }}
                  >
                    <CardActionArea onClick={() => handleSupplierClick(supplier.name)}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar
                            sx={{
                              bgcolor: getSupplierColor(supplier.name),
                              width: 48,
                              height: 48,
                              mr: 2,
                            }}
                          >
                            {getSupplierInitials(supplier.name)}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="h6" noWrap>
                              {supplier.name}
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Description fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              {supplier.totalDocuments} documenti
                            </Typography>
                          </Box>

                          {supplier.monthlyCount > 0 && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <TrendingUp fontSize="small" color="action" />
                              <Typography variant="body2" color="text.secondary">
                                {supplier.monthlyCount} questo mese
                              </Typography>
                            </Box>
                          )}

                          {supplier.latestDate && (
                            <Box sx={{ mt: 1 }}>
                              <Chip
                                label={`Ultimo: ${new Date(supplier.latestDate).toLocaleDateString('it-IT')}`}
                                size="small"
                                variant="outlined"
                              />
                            </Box>
                          )}
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {filteredSuppliers.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                Nessun fornitore trovato.
              </Box>
            )}
          </>
        )}
      </Widget>
    </Box>
  );
}
