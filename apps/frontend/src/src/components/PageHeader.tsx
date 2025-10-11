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
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        mb: 3,
        gap: 2,
      }}
    >
      <Box>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumbs
            separator={<NavigateNext fontSize="small" />}
            sx={{ mb: 1 }}
          >
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;

              if (isLast || !crumb.href) {
                return (
                  <Typography key={index} color="text.secondary" fontSize="0.875rem">
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
                >
                  {crumb.label}
                </MuiLink>
              );
            })}
          </Breadcrumbs>
        )}
        <Typography variant="h4" component="h1" fontWeight={600}>
          {title}
        </Typography>
      </Box>
      {renderRight && <Box>{renderRight}</Box>}
    </Box>
  );
}
