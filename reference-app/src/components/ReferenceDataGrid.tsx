import React, { useState, useMemo } from 'react';
import {
  DataGrid,
  GridColDef,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
  GridRenderCellParams,
} from '@mui/x-data-grid';
import {
  Box,
  TextField,
  InputAdornment,
  Paper,
  Typography,
  Button,
  Chip,
} from '@mui/material';
import { Search, Download } from '@mui/icons-material';
import { TableData, exportToCSV } from '../utils/2daParser';
import '../styles/DataGrid.css';

interface ReferenceDataGridProps {
  data: TableData;
  title: string;
  loading?: boolean;
  onCrossReference?: (type: string, value: string) => void;
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
};

function getTableType(title: string): keyof typeof COLUMN_CONFIGS {
  const titleLower = title.toLowerCase();
  if (titleLower.includes('appearance')) return 'appearance';
  if (titleLower.includes('feat')) return 'feats';
  if (titleLower.includes('spell')) return 'spells';
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
  onCrossReference 
}: ReferenceDataGridProps) {
  const [searchText, setSearchText] = useState('');

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

      // Handle potential cross-references for spell/feat IDs
      if (onCrossReference && (
        col.toLowerCase().includes('spell') || 
        col.toLowerCase().includes('feat') ||
        col.toLowerCase().includes('prereq')
      )) {
        return {
          ...baseColumn,
          renderCell: (params: GridRenderCellParams) => {
            const value = params.value;
            if (value && value !== '' && !isNaN(Number(value))) {
              const referenceType = col.toLowerCase().includes('spell') ? 'spell' : 'feat';
              return (
                <Button
                  size="small"
                  variant="text"
                  onClick={() => onCrossReference(referenceType, String(value))}
                  sx={{ 
                    textTransform: 'none',
                    color: 'secondary.main',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    }
                  }}
                  title={`Go to ${referenceType} #${value}`}
                >
                  {value}
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
  }, [data, onCrossReference, title]);

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
          '& .MuiDataGrid-cell:hover': {
            color: 'primary.main',
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: 'action.hover',
          },
        }}
        getRowId={(row) => row.id}
        disableRowSelectionOnClick
        density="compact"
      />
    </Paper>
  );
}