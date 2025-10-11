'use client';

import Image from 'next/image';
import { Box } from '@mui/material';

interface MainFooterLogoProps {
  opacity?: number;
}

export default function MainFooterLogo({ opacity = 1 }: MainFooterLogoProps) {
  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: 0,
        right: 0,
        p: 3,
        opacity: opacity,
      }}
    >
      <Image
        src="/logo.png"
        alt="CoreDocument Logo"
        width={80}
        height={80}
      />
    </Box>
  );
}
