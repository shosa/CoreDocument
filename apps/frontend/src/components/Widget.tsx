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
        p: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        ...sx,
      }}
    >
      {(title || action) && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: title ? 2 : 0,
          }}
        >
          {title && (
            <Typography variant="h6" component="h2" fontWeight={600}>
              {title}
            </Typography>
          )}
          {action && <Box>{action}</Box>}
        </Box>
      )}
      <Box sx={{ flex: 1 }}>{children}</Box>
    </Paper>
  );
}
