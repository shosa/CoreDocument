'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Grid,
  CircularProgress,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { Save, ArrowBack } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import PageHeader from '@/components/PageHeader';
import Widget from '@/components/Widget';
import axiosInstance from '@/lib/axios';
import { useSnackbar } from 'notistack';
import { UserFormData } from '@/types';

const schema = yup.object({
  email: yup.string().email('Email non valida').required('Email richiesta'),
  password: yup.string().required('Password richiesta').min(6, 'Minimo 6 caratteri'),
  firstName: yup.string().required('Nome richiesto'),
  lastName: yup.string().required('Cognome richiesto'),
  role: yup.string().required('Ruolo richiesto'),
  isActive: yup.boolean(),
});

export default function NewUserPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'utente',
      isActive: true,
    },
  });

  const onSubmit = async (data: UserFormData) => {
    try {
      setLoading(true);
      await axiosInstance.post('/users', data);
      enqueueSnackbar('Utente creato con successo', { variant: 'success' });
      router.push('/users');
    } catch (error: any) {
      enqueueSnackbar('Errore durante la creazione', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Nuovo Utente"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Utenti', href: '/users' },
          { label: 'Nuovo' },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <Widget>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Controller
                name="firstName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Nome *"
                    error={!!errors.firstName}
                    helperText={errors.firstName?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="lastName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Cognome *"
                    error={!!errors.lastName}
                    helperText={errors.lastName?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Email *"
                    type="email"
                    error={!!errors.email}
                    helperText={errors.email?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Password *"
                    type="password"
                    error={!!errors.password}
                    helperText={errors.password?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    select
                    label="Ruolo *"
                    error={!!errors.role}
                    helperText={errors.role?.message}
                  >
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="tecnico">Tecnico</MenuItem>
                    <MenuItem value="utente">Utente</MenuItem>
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch {...field} checked={field.value} />}
                    label="Attivo"
                  />
                )}
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => router.push('/users')}
              disabled={loading}
            >
              Annulla
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <Save />}
              disabled={loading}
            >
              Salva
            </Button>
          </Box>
        </Widget>
      </form>
    </Box>
  );
}
