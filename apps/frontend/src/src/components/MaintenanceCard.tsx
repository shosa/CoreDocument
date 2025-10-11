'use client';

import { Card, CardContent, CardActions, Box, Typography, Chip, IconButton, Tooltip } from '@mui/material';
import { Visibility, Edit, Delete, Build } from '@mui/icons-material';
import { Maintenance } from '@/types';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface MaintenanceCardProps {
  maintenance: Maintenance;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function MaintenanceCard({ maintenance, onView, onEdit, onDelete }: MaintenanceCardProps) {
  const typeColors: Record<string, 'primary' | 'warning' | 'error' | 'success'> = {
    ordinaria: 'success',
    straordinaria: 'primary',
    guasto: 'error',
    riparazione: 'warning',
  };

  const typeLabels: Record<string, string> = {
    ordinaria: 'Ordinaria',
    straordinaria: 'Straordinaria',
    guasto: 'Guasto',
    riparazione: 'Riparazione',
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Build sx={{ color: 'text.secondary', fontSize: 20 }} />
            <Typography variant="caption" color="text.secondary">
              {format(new Date(maintenance.date), 'dd MMM yyyy', { locale: it })}
            </Typography>
          </Box>
          <Chip
            label={typeLabels[maintenance.type] || maintenance.type}
            color={typeColors[maintenance.type] || 'default'}
            size="small"
            sx={{ fontWeight: 500 }}
          />
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Macchinario
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {maintenance.machine ?
                `${maintenance.machine.model || maintenance.machine.manufacturer || ''} (${maintenance.machine.serialNumber})`.trim()
                : '-'}
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Operatore
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {maintenance.operator
                ? `${maintenance.operator.firstName} ${maintenance.operator.lastName}`
                : '-'}
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Lavoro Eseguito
            </Typography>
            <Typography
              variant="body2"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {maintenance.workPerformed || '-'}
            </Typography>
          </Box>

          {maintenance.cost && (
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Costo
              </Typography>
              <Typography variant="body2" fontWeight={600} color="primary.main">
                €{Number(maintenance.cost).toFixed(2)}
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
        {onView && (
          <Tooltip title="Visualizza">
            <IconButton
              size="small"
              onClick={() => onView(maintenance.id)}
              sx={{
                bgcolor: 'black',
                color: 'white',
                borderRadius: '6px',
                '&:hover': { bgcolor: 'grey.800' },
              }}
            >
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

        {onEdit && (
          <Tooltip title="Modifica">
            <IconButton
              size="small"
              onClick={() => onEdit(maintenance.id)}
              sx={{
                bgcolor: 'black',
                color: 'white',
                borderRadius: '6px',
                '&:hover': { bgcolor: 'grey.800' },
              }}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

        {onDelete && (
          <Tooltip title="Elimina">
            <IconButton
              size="small"
              onClick={() => onDelete(maintenance.id)}
              sx={{
                bgcolor: 'black',
                color: 'white',
                borderRadius: '6px',
                '&:hover': { bgcolor: 'grey.800' },
              }}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </CardActions>
    </Card>
  );
}
