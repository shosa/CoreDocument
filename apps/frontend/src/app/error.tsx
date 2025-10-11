'use client';

import { useEffect } from 'react';
import { Box, Button, Container, Typography } from '@mui/material';
import { ErrorOutline } from '@mui/icons-material';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console for debugging
    console.error('Application error:', error);
  }, [error]);

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
          gap: 2,
        }}
      >
        <ErrorOutline sx={{ fontSize: 64, color: 'error.main' }} />
        <Typography variant="h4" component="h1" gutterBottom>
          Si è verificato un errore
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          {process.env.NODE_ENV === 'development'
            ? error.message
            : 'Qualcosa è andato storto. Riprova più tardi.'}
        </Typography>
        <Button
          variant="contained"
          onClick={reset}
          size="large"
        >
          Riprova
        </Button>
      </Box>
    </Container>
  );
}
