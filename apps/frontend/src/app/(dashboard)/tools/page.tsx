'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  CircularProgress,
  Button,
  Chip,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Stack,
  Paper,
} from '@mui/material';
import {
  Build,
  Delete,
  Edit,
  Check,
  Warning,
  MergeType,
  CleaningServices,
} from '@mui/icons-material';
import PageHeader from '@/components/PageHeader';
import Widget from '@/components/Widget';
import { documentsApi } from '@/lib/api';
import { useSnackbar } from 'notistack';

interface Document {
  id: string;
  filename: string;
  supplier: string;
  docNumber: string;
  date: string;
}

interface SupplierGroup {
  canonical: string;
  variants: string[];
  totalDocuments: number;
  documents: Document[];
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ToolsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);

  // Anomalie documenti
  const [anomalousDocuments, setAnomalousDocuments] = useState<Document[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameDoc, setRenameDoc] = useState<Document | null>(null);
  const [newFilename, setNewFilename] = useState('');

  // Fornitori duplicati
  const [supplierGroups, setSupplierGroups] = useState<SupplierGroup[]>([]);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<SupplierGroup | null>(null);
  const [canonicalName, setCanonicalName] = useState('');

  // Whitelist per falsi positivi (salvata in localStorage)
  const [ignoredPairs, setIgnoredPairs] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Carica whitelist da localStorage
    const stored = localStorage.getItem('coredocument_ignored_supplier_pairs');
    if (stored) {
      setIgnoredPairs(new Set(JSON.parse(stored)));
    }
  }, []);

  useEffect(() => {
    if (tabValue === 0) {
      findAnomalousDocuments();
    } else if (tabValue === 1) {
      findDuplicateSuppliers();
    }
  }, [tabValue]);

  const findAnomalousDocuments = async () => {
    try {
      setLoading(true);
      const response = await documentsApi.list({ limit: 10000 });
      const docs = response.data.data || response.data || [];

      // Trova documenti con caratteri strani o pattern anomali
      const anomalous = docs.filter((doc: Document) => {
        const filename = doc.filename || '';
        const supplier = doc.supplier || '';
        const docNumber = doc.docNumber || '';

        // Pattern anomali: caratteri speciali strani, spazi multipli, ecc.
        // NOTA: Apostrofo ' è permesso (es. TOD'S, DELL'ACQUA, ecc.)
        const hasStrangeChars = /[^\w\s\-_.()àèéìòù']/i.test(filename + supplier + docNumber);
        const hasMultipleSpaces = /\s{2,}/.test(filename + supplier + docNumber);
        const hasLeadingTrailingSpaces = /^\s|\s$/.test(supplier) || /^\s|\s$/.test(docNumber);

        return hasStrangeChars || hasMultipleSpaces || hasLeadingTrailingSpaces;
      });

      setAnomalousDocuments(anomalous);
    } catch (error) {
      enqueueSnackbar('Errore nel caricamento documenti', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const findDuplicateSuppliers = async () => {
    try {
      setLoading(true);
      const response = await documentsApi.list({ limit: 10000 });
      const docs = response.data.data || response.data || [];

      // Raggruppa fornitori simili
      const supplierMap = new Map<string, Document[]>();
      docs.forEach((doc: Document) => {
        const supplier = doc.supplier || '';
        if (!supplier) return;

        if (!supplierMap.has(supplier)) {
          supplierMap.set(supplier, []);
        }
        supplierMap.get(supplier)!.push(doc);
      });

      // Trova varianti dello stesso fornitore
      const groups: SupplierGroup[] = [];
      const processed = new Set<string>();

      Array.from(supplierMap.keys()).forEach(supplier => {
        if (processed.has(supplier)) return;

        const normalized = normalizeSupplierName(supplier);
        const variants: string[] = [supplier];
        let totalDocs = supplierMap.get(supplier)!.length;
        const allDocs = [...supplierMap.get(supplier)!];

        // Cerca varianti simili
        Array.from(supplierMap.keys()).forEach(otherSupplier => {
          if (supplier === otherSupplier || processed.has(otherSupplier)) return;

          // Salta se questa coppia è stata ignorata dall'utente
          if (isPairIgnored(supplier, otherSupplier)) return;

          const otherNormalized = normalizeSupplierName(otherSupplier);

          // Metodo 1: Se normalizzati sono uguali (es. "MI.TI" vs "MITI")
          const exactMatch = normalized === otherNormalized;

          // Metodo 2: Uno contiene l'altro (es. "FERRAGAMO" in "SALVATORE FERRAGAMO")
          const isSubstring = normalized.includes(otherNormalized) || otherNormalized.includes(normalized);
          const hasMinLength = Math.min(normalized.length, otherNormalized.length) >= 5; // Evita match troppo corti

          // Metodo 3: Similarità alta (>= 85%) per errori di battitura (es. "TANCERIA" vs "TRANCERIA")
          const similarityScore = similarity(normalized, otherNormalized);
          const isSimilar = similarityScore >= 0.85 && Math.abs(normalized.length - otherNormalized.length) <= 2;

          if (exactMatch || (isSubstring && hasMinLength) || isSimilar) {
            variants.push(otherSupplier);
            totalDocs += supplierMap.get(otherSupplier)!.length;
            allDocs.push(...supplierMap.get(otherSupplier)!);
            processed.add(otherSupplier);
          }
        });

        processed.add(supplier);

        // Aggiungi solo se ci sono varianti
        if (variants.length > 1) {
          // Ordina le varianti: prima quella con più documenti (probabilmente corretta)
          const variantCounts = variants.map(v => ({
            name: v,
            count: supplierMap.get(v)?.length || 0
          }));
          variantCounts.sort((a, b) => b.count - a.count);

          groups.push({
            canonical: variantCounts[0].name, // Usa quella con più documenti come canonical
            variants,
            totalDocuments: totalDocs,
            documents: allDocs,
          });
        }
      });

      // Ordina per numero di documenti
      groups.sort((a, b) => b.totalDocuments - a.totalDocuments);

      setSupplierGroups(groups);
    } catch (error) {
      enqueueSnackbar('Errore nell\'analisi fornitori', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const normalizeSupplierName = (name: string): string => {
    return name
      .toUpperCase()
      .replace(/[.\s-]/g, '') // Rimuovi punti, spazi, trattini
      .trim();
  };

  // Calcola la distanza di Levenshtein tra due stringhe
  const levenshteinDistance = (str1: string, str2: string): number => {
    const m = str1.length;
    const n = str2.length;
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(
            dp[i - 1][j] + 1,     // deletion
            dp[i][j - 1] + 1,     // insertion
            dp[i - 1][j - 1] + 1  // substitution
          );
        }
      }
    }

    return dp[m][n];
  };

  // Calcola la similarità percentuale tra due stringhe
  const similarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const distance = levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  };

  // Crea una chiave univoca per una coppia di fornitori (ordinata alfabeticamente)
  const createPairKey = (supplier1: string, supplier2: string): string => {
    return [supplier1, supplier2].sort().join('|||');
  };

  // Controlla se una coppia è nella whitelist
  const isPairIgnored = (supplier1: string, supplier2: string): boolean => {
    return ignoredPairs.has(createPairKey(supplier1, supplier2));
  };

  const handleSelectDoc = (id: string) => {
    const newSelected = new Set(selectedDocs);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedDocs(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedDocs.size === anomalousDocuments.length) {
      setSelectedDocs(new Set());
    } else {
      setSelectedDocs(new Set(anomalousDocuments.map(d => d.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (!confirm(`Sei sicuro di voler eliminare ${selectedDocs.size} documenti?`)) return;

    try {
      setLoading(true);
      for (const id of Array.from(selectedDocs)) {
        await documentsApi.delete(id);
      }
      enqueueSnackbar(`${selectedDocs.size} documenti eliminati`, { variant: 'success' });
      setSelectedDocs(new Set());
      findAnomalousDocuments();
    } catch (error) {
      enqueueSnackbar('Errore durante l\'eliminazione', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRename = (doc: Document) => {
    setRenameDoc(doc);
    setNewFilename(doc.filename);
    setRenameDialogOpen(true);
  };

  const handleRename = async () => {
    if (!renameDoc) return;

    try {
      setLoading(true);
      await documentsApi.update(renameDoc.id, { filename: newFilename });
      enqueueSnackbar('Documento rinominato', { variant: 'success' });
      setRenameDialogOpen(false);
      findAnomalousDocuments();
    } catch (error) {
      enqueueSnackbar('Errore durante la rinomina', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenMerge = (group: SupplierGroup) => {
    setSelectedGroup(group);
    setCanonicalName(group.canonical);
    setMergeDialogOpen(true);
  };

  const handleMergeSuppliers = async () => {
    if (!selectedGroup) return;

    try {
      setLoading(true);
      // Aggiorna tutti i documenti con il nome canonico
      for (const doc of selectedGroup.documents) {
        if (doc.supplier !== canonicalName) {
          await documentsApi.update(doc.id, { supplier: canonicalName });
        }
      }
      enqueueSnackbar(`${selectedGroup.totalDocuments} documenti normalizzati`, { variant: 'success' });
      setMergeDialogOpen(false);
      findDuplicateSuppliers();
    } catch (error) {
      enqueueSnackbar('Errore durante la normalizzazione', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleIgnoreGroup = (group: SupplierGroup) => {
    // Aggiungi tutte le coppie di questo gruppo alla whitelist
    const newIgnored = new Set(ignoredPairs);

    for (let i = 0; i < group.variants.length; i++) {
      for (let j = i + 1; j < group.variants.length; j++) {
        newIgnored.add(createPairKey(group.variants[i], group.variants[j]));
      }
    }

    setIgnoredPairs(newIgnored);

    // Salva in localStorage
    localStorage.setItem('coredocument_ignored_supplier_pairs', JSON.stringify(Array.from(newIgnored)));

    enqueueSnackbar('Gruppo ignorato e non verrà più proposto', { variant: 'info' });

    // Ricarica per rimuoverlo dalla lista
    findDuplicateSuppliers();
  };

  const handleClearIgnoredPairs = () => {
    if (!confirm('Sei sicuro di voler ripristinare tutti i gruppi ignorati?')) return;

    setIgnoredPairs(new Set());
    localStorage.removeItem('coredocument_ignored_supplier_pairs');
    enqueueSnackbar('Whitelist azzerata', { variant: 'success' });
    findDuplicateSuppliers();
  };

  return (
    <Box>
      <PageHeader
        title="Tools e Normalizzazione"
        breadcrumbs={[{ label: 'Tools' }]}
      />

      <Widget>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab icon={<Warning />} label="Anomalie Documenti" iconPosition="start" />
          <Tab icon={<MergeType />} label="Normalizza Fornitori" iconPosition="start" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {/* Anomalie Documenti */}
          <Box sx={{ mb: 3 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Questa sezione identifica documenti con caratteri strani, spazi multipli o altri pattern anomali nei nomi.
            </Alert>

            {anomalousDocuments.length > 0 && (
              <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <Button
                  variant="outlined"
                  onClick={handleSelectAll}
                  startIcon={<Check />}
                >
                  {selectedDocs.size === anomalousDocuments.length ? 'Deseleziona' : 'Seleziona'} Tutti
                </Button>
                {selectedDocs.size > 0 && (
                  <Button
                    variant="contained"
                    color="error"
                    onClick={handleDeleteSelected}
                    startIcon={<Delete />}
                  >
                    Elimina Selezionati ({selectedDocs.size})
                  </Button>
                )}
              </Stack>
            )}
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : anomalousDocuments.length > 0 ? (
            <List>
              {anomalousDocuments.map(doc => (
                <ListItem
                  key={doc.id}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1,
                  }}
                >
                  <Checkbox
                    checked={selectedDocs.has(doc.id)}
                    onChange={() => handleSelectDoc(doc.id)}
                  />
                  <ListItemText
                    primary={`${doc.supplier} - ${doc.docNumber}`}
                    secondary={`File: ${doc.filename}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton onClick={() => handleOpenRename(doc)}>
                      <Edit />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          ) : (
            <Alert severity="success">
              Nessuna anomalia trovata! Tutti i documenti sembrano correttamente formattati.
            </Alert>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* Normalizza Fornitori */}
          <Box sx={{ mb: 3 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Questa sezione identifica fornitori che potrebbero essere duplicati usando tre algoritmi:
              <br />
              • <strong>Normalizzazione</strong>: "MI.TI", "MITI", "M.I.T.I" → stesso fornitore
              <br />
              • <strong>Substring</strong>: "FERRAGAMO" contenuto in "SALVATORE FERRAGAMO"
              <br />
              • <strong>Similarità (85%+)</strong>: "TANCERIA" vs "TRANCERIA" → probabile errore di battitura
            </Alert>

            {ignoredPairs.size > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {ignoredPairs.size} coppie di fornitori sono state marcate come "non duplicati" e non vengono mostrate.
                <Button size="small" onClick={handleClearIgnoredPairs} sx={{ ml: 2 }}>
                  Ripristina Tutto
                </Button>
              </Alert>
            )}
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : supplierGroups.length > 0 ? (
            <Grid container spacing={3}>
              {supplierGroups.map((group, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Card
                    sx={{
                      border: '2px solid',
                      borderColor: 'warning.main',
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                        <Typography variant="h6" color="warning.main">
                          Possibile Duplicato
                        </Typography>
                        <Chip label={`${group.totalDocuments} doc.`} color="warning" />
                      </Box>

                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Varianti trovate:
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                        {group.variants.map((variant, i) => (
                          <Chip
                            key={i}
                            label={variant}
                            size="small"
                            variant={variant === group.canonical ? 'filled' : 'outlined'}
                            color={variant === group.canonical ? 'primary' : 'default'}
                          />
                        ))}
                      </Stack>

                      <Stack spacing={1}>
                        <Button
                          variant="contained"
                          fullWidth
                          startIcon={<MergeType />}
                          onClick={() => handleOpenMerge(group)}
                        >
                          Normalizza Fornitore
                        </Button>
                        <Button
                          variant="outlined"
                          fullWidth
                          size="small"
                          onClick={() => handleIgnoreGroup(group)}
                        >
                          Non sono duplicati
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Alert severity="success">
              Nessun duplicato trovato! Tutti i fornitori sono già normalizzati.
            </Alert>
          )}
        </TabPanel>
      </Widget>

      {/* Dialog Rinomina */}
      <Dialog open={renameDialogOpen} onClose={() => setRenameDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Rinomina Documento</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nuovo Nome File"
            value={newFilename}
            onChange={e => setNewFilename(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialogOpen(false)}>Annulla</Button>
          <Button variant="contained" onClick={handleRename}>
            Rinomina
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Merge Fornitori */}
      <Dialog open={mergeDialogOpen} onClose={() => setMergeDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Normalizza Fornitore</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
            Questa azione aggiornerà {selectedGroup?.totalDocuments} documenti.
          </Alert>

          <Typography variant="body2" gutterBottom>
            Varianti da unificare:
          </Typography>
          <Stack spacing={1} sx={{ mb: 2 }}>
            {selectedGroup?.variants.map((variant, i) => (
              <Chip key={i} label={variant} size="small" />
            ))}
          </Stack>

          <TextField
            fullWidth
            label="Nome Canonico"
            value={canonicalName}
            onChange={e => setCanonicalName(e.target.value)}
            helperText="Scegli il nome che verrà usato per tutti i documenti"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMergeDialogOpen(false)}>Annulla</Button>
          <Button variant="contained" color="warning" onClick={handleMergeSuppliers}>
            Normalizza
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
