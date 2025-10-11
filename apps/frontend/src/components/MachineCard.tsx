'use client';

import { Card, CardContent, CardActions, Box, Typography, Chip, IconButton, Tooltip } from '@mui/material';
import { Visibility, Edit, Delete, QrCode2 } from '@mui/icons-material';
import { Machine } from '@/types';

interface MachineCardProps {
  machine: Machine;
  onView: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onQRCode?: (id: string) => void;
}

export default function MachineCard({ machine, onView, onEdit, onDelete, onQRCode }: MachineCardProps) {
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
          <Typography variant="h6" component="div" sx={{ mb: 1, fontWeight: 600 }}>
            {machine.serialNumber}
          </Typography>
          <Chip
            label={machine.type?.name || 'N/A'}
            size="small"
            sx={{ bgcolor: 'grey.100', fontWeight: 500 }}
          />
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Produttore
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {machine.manufacturer || '-'}
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Modello
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {machine.model || '-'}
            </Typography>
          </Box>

          {machine.yearBuilt && (
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Anno
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {machine.yearBuilt}
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
        <Tooltip title="Visualizza">
          <IconButton
            size="small"
            onClick={() => onView(machine.id)}
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

        {onQRCode && (
          <Tooltip title="QR Code">
            <IconButton
              size="small"
              onClick={() => onQRCode(machine.id)}
              sx={{
                bgcolor: 'black',
                color: 'white',
                borderRadius: '6px',
                '&:hover': { bgcolor: 'grey.800' },
              }}
            >
              <QrCode2 fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

        {onEdit && (
          <Tooltip title="Modifica">
            <IconButton
              size="small"
              onClick={() => onEdit(machine.id)}
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
              onClick={() => onDelete(machine.id)}
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
