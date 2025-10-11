'use client';

import { Box, Typography } from '@mui/material';
import Image from 'next/image';

interface LogoProps {
  collapsed?: boolean;
  invert?: boolean;
}

export default function Logo({ collapsed = false, invert = true }: LogoProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        py: 2,
      }}
    >
      <Image
        src="/logo.png"
        alt="CoreDocument Logo"
        width={32}
        height={32}
        style={{ filter: invert ? 'invert(1)' : 'none' }}
      />
      {!collapsed && (
        <Typography
          variant="h6"
          component="div"
          sx={{
            fontWeight: 700,
          }}
        >
          CoreDocument
        </Typography>
      )}
    </Box>
  );
}
