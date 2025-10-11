'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box,
  InputBase,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Typography,
  CircularProgress,
  Divider,
  Chip,
} from '@mui/material';
import { Search, Description } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface SearchResult {
  id: number;
  type: 'document';
  title: string;
  subtitle: string;
  url: string;
}

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (query.length >= 2) {
        setLoading(true);
        setOpen(true);
        try {
          const response = await api.get('/search', { params: { query } });
          const docs = response.data?.data || response.data || [];

          const documents = docs.map((d: any) => ({
            id: d.id,
            type: 'document' as const,
            title: d.filename,
            subtitle: `${d.supplier} - ${d.docNumber}`,
            url: `/documents`,
          }));

          setResults(documents.slice(0, 10));
        } catch (error) {
          console.error('Search error:', error);
          setResults([]);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
        setOpen(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const handleResultClick = (url: string) => {
    router.push(url);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  const getIcon = (type: string) => {
    return <Description fontSize="small" />;
  };

  const getTypeLabel = (type: string) => {
    return 'Documento';
  };

  return (
    <Box ref={searchRef} sx={{ position: 'relative', width: '100%', maxWidth: 600 }}>
      <Paper
        elevation={0}
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 2,
          py: 0.75,
          bgcolor: 'white',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          '&:hover': {
            borderColor: 'primary.main',
          },
          '&:focus-within': {
            borderColor: 'primary.main',
            boxShadow: '0 0 0 2px rgba(0, 0, 0, 0.1)',
          },
        }}
      >
        <Search sx={{ color: 'text.secondary', mr: 1 }} />
        <InputBase
          placeholder="Cerca documenti, fornitori..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setOpen(true)}
          sx={{
            flex: 1,
            color: 'text.primary',
            '& ::placeholder': {
              color: 'text.secondary',
              opacity: 0.7,
            },
          }}
        />
        {loading && <CircularProgress size={20} sx={{ color: 'primary.main' }} />}
      </Paper>

      {open && results.length > 0 && (
        <Paper
          elevation={8}
          sx={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            maxHeight: 400,
            overflow: 'auto',
            zIndex: 1300,
          }}
        >
          <List disablePadding>
            {results.map((result, index) => (
              <Box key={`${result.type}-${result.id}`}>
                {index > 0 && results[index - 1].type !== result.type && <Divider />}
                <ListItem disablePadding>
                  <ListItemButton onClick={() => handleResultClick(result.url)}>
                    <ListItemIcon sx={{ minWidth: 40 }}>{getIcon(result.type)}</ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                            {result.title}
                          </Typography>
                          <Chip label={getTypeLabel(result.type)} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                        </Box>
                      }
                      secondary={result.subtitle}
                      secondaryTypographyProps={{
                        noWrap: true,
                        fontSize: '0.75rem',
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              </Box>
            ))}
          </List>
        </Paper>
      )}

      {open && query.length >= 2 && results.length === 0 && !loading && (
        <Paper
          elevation={8}
          sx={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            p: 3,
            zIndex: 1300,
          }}
        >
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Nessun risultato trovato per "{query}"
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
