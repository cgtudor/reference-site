import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Tabs,
  Tab,
  Box,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';
import { ReferenceDataGrid } from './ReferenceDataGrid';
import { useTableData } from '../hooks/useTableData';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`reference-tabpanel-${index}`}
      aria-labelledby={`reference-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `reference-tab-${index}`,
    'aria-controls': `reference-tabpanel-${index}`,
  };
}

export function ReferenceApp() {
  const [currentTab, setCurrentTab] = useState(0);
  
  // Load data for all tables
  const appearanceData = useTableData('appearance.2da');
  const featData = useTableData('feat.2da');
  const spellsData = useTableData('spells.2da');
  const placeablesData = useTableData('placeables.2da');

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  // Helper functions to get names for cross-references
  const handleCrossReference = (type: string, value: string) => {
    const targetId = parseInt(value);
    
    if (type === 'spell' && spellsData.data) {
      // For spells, just open the modal without switching tabs
      const targetRow = spellsData.data.rows.find(row => row.id === targetId);
      if (targetRow) {
        // Trigger opening the detail dialog for this row immediately
        const event = new CustomEvent('openRowDetail', { 
          detail: { row: targetRow, tableType: 'spells', columns: spellsData.data.columns } 
        });
        window.dispatchEvent(event);
      }
      console.log(`Cross-referencing to spell ID: ${value}`);
    } else if (type === 'feat' && featData.data) {
      // For feats, just open the modal without switching tabs
      const targetRow = featData.data.rows.find(row => row.id === targetId);
      if (targetRow) {
        // Trigger opening the detail dialog for this row immediately
        const event = new CustomEvent('openRowDetail', { 
          detail: { row: targetRow, tableType: 'feats', columns: featData.data.columns } 
        });
        window.dispatchEvent(event);
      }
      console.log(`Cross-referencing to feat ID: ${value}`);
    }
  };

  const tables = [
    {
      label: 'Appearance',
      filename: 'appearance.2da',
      data: appearanceData,
      description: 'Character and creature appearance definitions. Some columns are hidden by default, use "Manage columns" to see them.'
    },
    {
      label: 'Feats',
      filename: 'feat.2da',
      data: featData,
      description: 'Available feats and their properties. Some columns are hidden by default, use "Manage columns" to see them.'
    },
    {
      label: 'Spells',
      filename: 'spells.2da',
      data: spellsData,
      description: 'Spell definitions and casting information. Some columns are hidden by default, use "Manage columns" to see them.'
    },
    {
      label: 'Placeables',
      filename: 'placeables.2da',
      data: placeablesData,
      description: 'Placeable object appearance definitions. Some columns are hidden by default, use "Manage columns" to see them.'
    },
  ];

  return (
    <Box sx={{ flexGrow: 1, bgcolor: 'background.default', minHeight: '100vh' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            TDN Reference Tables
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth={false} sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
        <Paper sx={{ mt: 2 }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            aria-label="reference tables"
            variant="fullWidth"
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': {
                minHeight: 64,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
              },
            }}
          >
            {tables.map((table, index) => (
              <Tab
                key={table.label}
                label={
                  <Box>
                    <Typography variant="body1" component="div">
                      {table.label}
                    </Typography>
                    <Typography variant="caption" component="div" sx={{ opacity: 0.7 }}>
                      {table.data.data?.rows.length || 0} rows
                    </Typography>
                  </Box>
                }
                {...a11yProps(index)}
              />
            ))}
          </Tabs>

          {tables.map((table, index) => (
            <TabPanel key={table.label} value={currentTab} index={index}>
              {table.data.loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                  <Typography sx={{ ml: 2 }}>Loading {table.label}...</Typography>
                </Box>
              )}
              
              {table.data.error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  Failed to load {table.label}: {table.data.error}
                </Alert>
              )}
              
              {table.data.data && !table.data.loading && (
                <>
                  <Box sx={{ mb: 2, px: 2 }}>
                    <Typography variant="h5" gutterBottom>
                      {table.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {table.description} • {table.data.data.rows.length} entries
                    </Typography>
                  </Box>
                  
                  <ReferenceDataGrid
                    data={table.data.data}
                    title={table.label}
                    loading={table.data.loading}
                    onCrossReference={handleCrossReference}
                  />
                </>
              )}
            </TabPanel>
          ))}
        </Paper>
      </Container>
    </Box>
  );
}