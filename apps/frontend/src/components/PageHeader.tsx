'use client';

import { Box, Breadcrumbs, Link as MuiLink, Typography } from '@mui/material';
import Link from 'next/link';
import { NavigateNext } from '@mui/icons-material';
import { ReactNode } from 'react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  breadcrumbs?: BreadcrumbItem[];
  renderRight?: ReactNode;
}

export default function PageHeader({ title, breadcrumbs, renderRight }: PageHeaderProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'stretch', sm: 'flex-start' },
        mb: { xs: 2, sm: 3 },
        gap: 2,
      }}
    >
      <Box sx={{ minWidth: 0, flex: 1 }}>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumbs
            separator={<NavigateNext fontSize="small" />}
            sx={{ mb: 1, flexWrap: 'wrap' }}
          >
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;

              if (isLast || !crumb.href) {
                return (
                  <Typography key={index} color="text.secondary" fontSize="0.875rem" noWrap>
                    {crumb.label}
                  </Typography>
                );
              }

              return (
                <MuiLink
                  key={index}
                  component={Link}
                  href={crumb.href}
                  underline="hover"
                  color="text.primary"
                  fontSize="0.875rem"
                  noWrap
                >
                  {crumb.label}
                </MuiLink>
              );
            })}
          </Breadcrumbs>
        )}
        <Typography
          variant="h4"
          component="h1"
          fontWeight={600}
          sx={{
            fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
          }}
        >
          {title}
        </Typography>
      </Box>
      {renderRight && (
        <Box sx={{
          display: 'flex',
          gap: 1,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}>
          {renderRight}
        </Box>
      )}
    </Box>
  );
}
