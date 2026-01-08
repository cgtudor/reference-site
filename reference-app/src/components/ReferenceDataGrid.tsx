import React, { useState, useMemo, useEffect } from 'react';
import {
  DataGrid,
  GridColDef,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
  GridRenderCellParams,
  GridRowParams,
} from '@mui/x-data-grid';
import {
  Box,
  TextField,
  InputAdornment,
  Paper,
  Typography,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  IconButton,
} from '@mui/material';
import { Search, Download, Close, Visibility } from '@mui/icons-material';
import { TableData, exportToCSV } from '../utils/2daParser';
import '../styles/DataGrid.css';

interface ReferenceDataGridProps {
  data: TableData;
  title: string;
  loading?: boolean;
  onCrossReference?: (type: string, value: string) => void;
  getFeatName?: (featId: string | number) => string | null;
  getSpellName?: (spellId: string | number) => string | null;
}

interface RowDetailDialogProps {
  open: boolean;
  onClose: () => void;
  rowData: any;
  columns: string[];
  title: string;
  onCrossReference?: (type: string, value: string) => void;
  tableType?: string;
  getFeatName?: (featId: string | number) => string | null;
  getSpellName?: (spellId: string | number) => string | null;
}

function RowDetailDialog({ 
  open, 
  onClose, 
  rowData, 
  columns, 
  title,
  onCrossReference,
  tableType: explicitTableType,
  getFeatName,
  getSpellName
}: RowDetailDialogProps) {
  if (!rowData) return null;

  const tableType = explicitTableType || getTableType(title);
  
  // Define which columns are considered "description" columns for each table type
  const descriptionColumns = {
    appearance: ['NAME'],
    feats: ['DESCRIPTION'],
    spells: ['SpellDesc'],
  }[tableType] || [];

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      scroll="paper"
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1
      }}>
        <Box>
          <Typography variant="h6" component="div">
            {title} Details
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            ID: {rowData.id} • {rowData.Label || rowData.LABEL || 'Unnamed'}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        {/* Show description columns prominently first */}
        {descriptionColumns.map(col => {
          const value = rowData[col];
          if (!value || value === '') return null;
          
          return (
            <Box key={col} sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom color="primary">
                {col === 'SpellDesc' ? 'Description' : col}
              </Typography>
              <Box
                sx={{
                  p: 2,
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.6,
                  backgroundColor: 'action.hover',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="body1">{value}</Typography>
              </Box>
            </Box>
          );
        })}
        
        {descriptionColumns.length > 0 && <Divider sx={{ my: 3 }} />}
        
        {/* Show all other columns in a grid */}
        <Typography variant="h6" gutterBottom>
          All Properties
        </Typography>
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: 2 
        }}>
          {columns.map((col) => {
            // Skip the description columns as they're shown above
            if (descriptionColumns.includes(col)) return null;
            
            const fieldName = col === 'ID' ? 'id' : col;
            const value = rowData[fieldName];
            
            // Skip empty values
            if (value === undefined || value === null || value === '') return null;
            
            const isNumericReference = onCrossReference && (
              col.toLowerCase().includes('spell') || 
              col === 'PREREQFEAT1' || 
              col === 'PREREQFEAT2' ||
              col === 'OrReqFeat0' ||
              col === 'OrReqFeat1' ||
              col === 'OrReqFeat2' ||
              col === 'OrReqFeat3' ||
              col === 'OrReqFeat4' ||
              col === 'FeatID'
            ) && !isNaN(Number(value));

            return (
              <Paper key={col} sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {col}
                </Typography>
                {col === 'ID' ? (
                  <Chip 
                    label={value} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                  />
                ) : isNumericReference ? (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Visibility />}
                    onClick={(e) => {
                      e.stopPropagation();
                      const referenceType = col.toLowerCase().includes('spell') ? 'spell' : 'feat';
                      onCrossReference!(referenceType, String(value));
                      onClose();
                    }}
                    sx={{ textTransform: 'none' }}
                  >
                    {(col.toLowerCase().includes('spell') ? getSpellName?.(value) : getFeatName?.(value)) || `#${value}`}
                  </Button>
                ) : (
                  <Typography variant="body2" sx={{ 
                    wordBreak: 'break-word',
                    fontFamily: typeof value === 'number' ? 'monospace' : 'inherit'
                  }}>
                    {String(value)}
                  </Typography>
                )}
              </Paper>
            );
          })}
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Column visibility configurations for each table type
const COLUMN_CONFIGS = {
  appearance: {
    hidden: ['STRING_REF', 'ENVMAP', 'BLOODCOLR', 'WING_TAIL_SCALE', 'HELMET_SCALE_M', 'HELMET_SCALE_F', 'PERSPACE', 'CREPERSPACE', 'TARGETHEIGHT', 'ABORTONPARRY', 'PERCEPTIONDIST', 'FOOTSTEPTYPE', 'SOUNDAPPTYPE', 'HEADTRACK', 'HEAD_ARC_H', 'HEAD_ARC_V', 'BODY_BAG', 'TARGETABLE'],
    order: ['ID', 'LABEL', 'NAME'], // NAME (description) comes after LABEL
  },
  feats: {
    hidden: ['GAINMULTIPLE', 'CATEGORY', 'MAXCR', 'CRValue', 'TOOLSCATEGORIES', 'PreReqEpic'],
    order: ['ID', 'LABEL', 'FEAT', 'DESCRIPTION'], // DESCRIPTION comes after LABEL
  },
  spells: {
    hidden: ['ConjAnim', 'ConjHeadVisual', 'ConjHandVisual', 'ConjGrndVisual', 'ConjSoundVFX', 'ConjSoundMale', 'ConjSoundFemale', 'CastHeadVisual', 'CastHandVisual', 'CastGrndVisual', 'CastSound', 'ProjModel', 'ProjType', 'ProjSpwnPoint', 'ProjSound', 'ProjOrientation', 'ItemImmunity', 'Category', 'UserType', 'Counter1', 'Counter2', 'Necro', 'Blighter', 'TargetSizeX', 'TargetSizeY', 'TargetFlags'],
    order: ['ID', 'Label', 'Name', 'SpellDesc'], // SpellDesc comes after Name
  },
  placeables: {
    hidden: ['LightOffsetX', 'LightOffsetY', 'LightOffsetZ', 'BodyBag', 'LowGore', 'Reflection'],
    order: ['ID', 'Label', 'ModelName', 'LightColor', 'SoundAppType', 'ShadowSize', 'Static'],
  },
};

function getTableType(title: string): keyof typeof COLUMN_CONFIGS {
  const titleLower = title.toLowerCase();
  if (titleLower.includes('appearance')) return 'appearance';
  if (titleLower.includes('feat')) return 'feats';
  if (titleLower.includes('spell')) return 'spells';
  if (titleLower.includes('placeable')) return 'placeables';
  return 'spells'; // default
}

function CustomToolbar({ 
  title, 
  onExportCSV 
}: { 
  title: string; 
  onExportCSV: () => void; 
}) {
  return (
    <GridToolbarContainer sx={{ justifyContent: 'space-between', p: 1 }}>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <Typography variant="h6" component="div">
          {title}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <GridToolbarColumnsButton />
        <GridToolbarFilterButton />
        <GridToolbarDensitySelector />
        <Button
          size="small"
          startIcon={<Download />}
          onClick={onExportCSV}
          variant="outlined"
        >
          Export CSV
        </Button>
      </Box>
    </GridToolbarContainer>
  );
}

export function ReferenceDataGrid({ 
  data, 
  title, 
  loading = false,
  onCrossReference,
  getFeatName,
  getSpellName
}: ReferenceDataGridProps) {
  const [searchText, setSearchText] = useState('');
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [crossRefRow, setCrossRefRow] = useState<any>(null);
  const [crossRefDialogOpen, setCrossRefDialogOpen] = useState(false);
  const [crossRefColumns, setCrossRefColumns] = useState<string[]>([]);
  const [crossRefTitle, setCrossRefTitle] = useState('');
  const [crossRefTableType, setCrossRefTableType] = useState('');

  const handleRowClick = (params: GridRowParams) => {
    setSelectedRow(params.row);
    setDetailDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDetailDialogOpen(false);
    setSelectedRow(null);
  };

  const handleCloseCrossRefDialog = () => {
    setCrossRefDialogOpen(false);
    setCrossRefRow(null);
    setCrossRefColumns([]);
    setCrossRefTitle('');
    setCrossRefTableType('');
  };

  // Listen for cross-reference events to open detail dialogs
  useEffect(() => {
    const handleOpenRowDetail = (event: CustomEvent) => {
      const { row, tableType, columns } = event.detail;
      const currentTableType = getTableType(title);
      
      if (tableType === currentTableType) {
        // Same table type - open normal dialog
        setSelectedRow(row);
        setDetailDialogOpen(true);
      } else {
        // Different table type - open cross-reference dialog
        setCrossRefRow(row);
        setCrossRefColumns(columns || []);
        setCrossRefTitle(tableType === 'spells' ? 'Spells' : tableType === 'feats' ? 'Feats' : 'Appearance');
        setCrossRefTableType(tableType);
        setCrossRefDialogOpen(true);
      }
    };

    window.addEventListener('openRowDetail', handleOpenRowDetail as EventListener);
    
    return () => {
      window.removeEventListener('openRowDetail', handleOpenRowDetail as EventListener);
    };
  }, [title]);

  // Create column definitions
  const columns: GridColDef[] = useMemo(() => {
    if (!data || data.columns.length === 0) return [];

    const tableType = getTableType(title);
    const config = COLUMN_CONFIGS[tableType];
    
    // Create base columns
    const baseColumns = data.columns.map((col, index) => {
      const field = col === 'ID' ? 'id' : col;
      
      const baseColumn: GridColDef = {
        field,
        headerName: col,
        width: index === 0 ? 80 : col.length > 15 ? 200 : 150,
        sortable: true,
        filterable: true,
      };

      // Special formatting for ID and Label columns
      if (col === 'ID') {
        return {
          ...baseColumn,
          headerName: 'ID',
          width: 80,
          type: 'number',
          renderCell: (params: GridRenderCellParams) => (
            <Chip 
              label={params.value} 
              size="small" 
              color="primary" 
              variant="outlined"
            />
          ),
        } as GridColDef;
      }

      // Highlight the Label column
      if (col === 'Label' || col === 'LABEL') {
        return {
          ...baseColumn,
          width: 250,
          renderCell: (params: GridRenderCellParams) => (
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {params.value}
            </Typography>
          ),
        } as GridColDef;
      }

      // Handle description columns with wider width and text wrapping
      if (col === 'NAME' || col === 'DESCRIPTION' || col === 'SpellDesc') {
        return {
          ...baseColumn,
          width: 300,
          renderCell: (params: GridRenderCellParams) => (
            <Typography variant="body2" sx={{ 
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {params.value}
            </Typography>
          ),
        } as GridColDef;
      }

      // Handle specific cross-reference columns
      if (onCrossReference && (
        col.toLowerCase().includes('spell') || 
        col === 'PREREQFEAT1' || 
        col === 'PREREQFEAT2' ||
        col === 'OrReqFeat0' ||
        col === 'OrReqFeat1' ||
        col === 'OrReqFeat2' ||
        col === 'OrReqFeat3' ||
        col === 'OrReqFeat4' ||
        col === 'FeatID'
      )) {
        return {
          ...baseColumn,
          renderCell: (params: GridRenderCellParams) => {
            const value = params.value;
            if (value && value !== '' && !isNaN(Number(value))) {
              const referenceType = col.toLowerCase().includes('spell') ? 'spell' : 'feat';
              const targetName = referenceType === 'spell' 
                ? getSpellName?.(value) 
                : getFeatName?.(value);
              const displayText = targetName || `#${value}`;
              
              return (
                <Button
                  size="small"
                  variant="text"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCrossReference(referenceType, String(value));
                  }}
                  sx={{ 
                    textTransform: 'none',
                    color: 'secondary.main',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    }
                  }}
                  title={`Go to ${referenceType}: ${targetName || `ID #${value}`}`}
                >
                  {displayText}
                </Button>
              );
            }
            return value;
          },
        } as GridColDef;
      }

      return baseColumn;
    });

    // Apply custom ordering if specified
    if (config.order && config.order.length > 0) {
      const orderedColumns: GridColDef[] = [];
      const remainingColumns = [...baseColumns];

      // Add columns in specified order first
      for (const orderedCol of config.order) {
        const colIndex = remainingColumns.findIndex(c => c.headerName === orderedCol);
        if (colIndex !== -1) {
          orderedColumns.push(remainingColumns[colIndex]);
          remainingColumns.splice(colIndex, 1);
        }
      }

      // Add remaining columns
      orderedColumns.push(...remainingColumns);
      return orderedColumns;
    }

    return baseColumns;
  }, [data, onCrossReference, title, getFeatName, getSpellName]);

  // Create column visibility model
  const columnVisibilityModel = useMemo(() => {
    if (!data?.columns) return {};
    
    const tableType = getTableType(title);
    const config = COLUMN_CONFIGS[tableType];
    const visibilityModel: Record<string, boolean> = {};
    
    config.hidden.forEach(col => {
      const field = col === 'ID' ? 'id' : col;
      visibilityModel[field] = false;
    });
    
    return visibilityModel;
  }, [data, title]);

  // Filter rows based on search text
  const filteredRows = useMemo(() => {
    if (!data || !searchText.trim()) return data?.rows || [];

    const searchLower = searchText.toLowerCase();
    return data.rows.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(searchLower)
      )
    );
  }, [data, searchText]);

  const handleExportCSV = () => {
    if (data) {
      exportToCSV(data, title.toLowerCase().replace(/\s+/g, '-'));
    }
  };

  if (!data) {
    return (
      <Paper sx={{ height: 400, p: 2 }}>
        <Typography>No data available</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ height: '80vh', width: '100%' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder={`Search in ${title}...`}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 1 }}
        />
      </Box>
      
      <DataGrid
        rows={filteredRows}
        columns={columns}
        loading={loading}
        pagination
        pageSizeOptions={[25, 50, 100]}
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize: 25 },
          },
          columns: {
            columnVisibilityModel,
          },
        }}
        slots={{
          toolbar: () => <CustomToolbar title={title} onExportCSV={handleExportCSV} />,
        }}
        slotProps={{
          toolbar: {
            showQuickFilter: true,
          },
        }}
        sx={{
          border: 0,
          '& .MuiDataGrid-cell': {
            display: 'flex',
            alignItems: 'center',
          },
          '& .MuiDataGrid-cell:hover': {
            color: 'primary.main',
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: 'action.hover',
            cursor: 'pointer',
          },
        }}
        getRowId={(row) => row.id}
        onRowClick={handleRowClick}
        disableRowSelectionOnClick
        density="compact"
      />
      
      {/* Row Detail Dialog */}
      <RowDetailDialog
        open={detailDialogOpen}
        onClose={handleCloseDialog}
        rowData={selectedRow}
        columns={data?.columns || []}
        title={title}
        onCrossReference={onCrossReference}
        getFeatName={getFeatName}
        getSpellName={getSpellName}
      />

      {/* Cross-Reference Dialog */}
      <RowDetailDialog
        open={crossRefDialogOpen}
        onClose={handleCloseCrossRefDialog}
        rowData={crossRefRow}
        columns={crossRefColumns}
        title={crossRefTitle}
        onCrossReference={onCrossReference}
        tableType={crossRefTableType}
        getFeatName={getFeatName}
        getSpellName={getSpellName}
      />
    </Paper>
  );
}