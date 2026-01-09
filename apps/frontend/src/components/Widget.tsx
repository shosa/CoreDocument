'use client';

import { Paper, Typography, Box } from '@mui/material';
import { ReactNode } from 'react';

interface WidgetProps {
  title?: string;
  children: ReactNode;
  action?: ReactNode;
  elevation?: number;
  sx?: any;
}

export default function Widget({ title, children, action, elevation = 0, sx }: WidgetProps) {
  return (
    <Paper
      elevation={elevation}
      sx={{
        p: { xs: 2, sm: 2.5, md: 3 },
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        ...sx,
      }}
    >
      {(title || action) && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            mb: title ? 2 : 0,
            gap: { xs: 1, sm: 0 },
          }}
        >
          {title && (
            <Typography
              variant="h6"
              component="h2"
              fontWeight={600}
              sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
            >
              {title}
            </Typography>
          )}
          {action && <Box>{action}</Box>}
        </Box>
      )}
      <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
    </Paper>
  );
}
