'use client';

import { Card, CardContent, CardActions, Box, Typography, Chip, IconButton, Tooltip, Avatar } from '@mui/material';
import { Edit, Delete, PersonOutline } from '@mui/icons-material';
import { User } from '@/types';

interface UserCardProps {
  user: User;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function UserCard({ user, onEdit, onDelete }: UserCardProps) {
  const roleColors: Record<string, 'primary' | 'success' | 'default'> = {
    admin: 'primary',
    tecnico: 'success',
    utente: 'default',
  };

  const roleLabels: Record<string, string> = {
    admin: 'Admin',
    tecnico: 'Tecnico',
    utente: 'Utente',
  };

  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();

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
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
          <Avatar
            sx={{
              bgcolor: user.isActive ? 'primary.main' : 'grey.400',
              width: 56,
              height: 56,
            }}
          >
            {initials || <PersonOutline />}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 600, mb: 0.5 }}>
              {user.firstName} {user.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
              {user.email}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip label={roleLabels[user.role] || user.role} color={roleColors[user.role]} size="small" />
          <Chip
            label={user.isActive ? 'Attivo' : 'Inattivo'}
            color={user.isActive ? 'success' : 'default'}
            size="small"
          />
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
        {onEdit && (
          <Tooltip title="Modifica">
            <IconButton
              size="small"
              onClick={() => onEdit(user.id)}
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
              onClick={() => onDelete(user.id)}
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
