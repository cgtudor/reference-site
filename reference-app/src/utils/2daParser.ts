export interface TableRow {
  id: number;
  [key: string]: string | number;
}

export interface TableData {
  columns: string[];
  rows: TableRow[];
}

export interface TlkEntry {
  id: number;
  text: string;
}

export interface TlkFile {
  language: number;
  entries: TlkEntry[];
}

// Cache for TLK data
let dialogTlkCache: Map<number, string> | null = null;
let dragonsneckTlkCache: Map<number, string> | null = null;
let tlkLoadPromise: Promise<void> | null = null;

/**
 * Loads and caches both TLK files separately
 */
async function loadTlkData(): Promise<void> {
  if (dialogTlkCache && dragonsneckTlkCache) {
    return;
  }

  if (tlkLoadPromise) {
    await tlkLoadPromise;
    return;
  }

  tlkLoadPromise = (async () => {
    try {
      console.log('Loading TLK files...');
      
      // Load both TLK files
      const [dialogResponse, dragonsneckResponse] = await Promise.all([
        fetch(`${process.env.PUBLIC_URL}/dialog.tlk.json`),
        fetch(`${process.env.PUBLIC_URL}/dragonsneck.tlk.json`)
      ]);

      if (!dialogResponse.ok || !dragonsneckResponse.ok) {
        throw new Error('Failed to load TLK files');
      }

      const [dialogTlk, dragonsneckTlk]: [TlkFile, TlkFile] = await Promise.all([
        dialogResponse.json(),
        dragonsneckResponse.json()
      ]);

      console.log(`Loaded dialog.tlk with ${dialogTlk.entries.length} entries`);
      console.log(`Loaded dragonsneck.tlk with ${dragonsneckTlk.entries.length} entries`);

      // Create separate lookup maps
      dialogTlkCache = new Map<number, string>();
      dragonsneckTlkCache = new Map<number, string>();

      // Add dialog.tlk entries
      for (const entry of dialogTlk.entries) {
        dialogTlkCache.set(entry.id, entry.text);
      }

      // Add dragonsneck.tlk entries
      for (const entry of dragonsneckTlk.entries) {
        dragonsneckTlkCache.set(entry.id, entry.text);
      }

      console.log(`Dialog TLK cache: ${dialogTlkCache.size} entries`);
      console.log(`Dragonsneck TLK cache: ${dragonsneckTlkCache.size} entries`);
    } catch (error) {
      console.error('Error loading TLK files:', error);
      dialogTlkCache = new Map(); // Empty map as fallback
      dragonsneckTlkCache = new Map(); // Empty map as fallback
    }
  })();

  await tlkLoadPromise;
}

/**
 * Resolves a string reference ID to its text value
 */
function resolveStringRef(strRef: string | number): string {
  if (!dialogTlkCache || !dragonsneckTlkCache) {
    return strRef.toString(); // Return original if TLK not loaded
  }

  const id = typeof strRef === 'string' ? parseInt(strRef, 10) : strRef;
  if (isNaN(id)) {
    return strRef.toString();
  }

  // Check if this is a custom TLK reference (magic number 16,777,216)
  const CUSTOM_TLK_OFFSET = 16777216;
  if (id >= CUSTOM_TLK_OFFSET) {
    // Custom TLK reference - look in dragonsneck.tlk
    const customId = id - CUSTOM_TLK_OFFSET;
    const resolved = dragonsneckTlkCache.get(customId);
    if (resolved) {
      return resolved;
    }
    console.log(`Custom string reference ${id} (offset ${customId}) not found in dragonsneck TLK`);
  } else {
    // Standard TLK reference - look in dialog.tlk
    const resolved = dialogTlkCache.get(id);
    if (resolved) {
      return resolved;
    }
    console.log(`Standard string reference ${id} not found in dialog TLK`);
  }

  return strRef.toString();
}

/**
 * Cleans column names by converting underscores to spaces and capitalizing words
 */
export function cleanColumnName(columnName: string): string {
  return columnName
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

/**
 * Parses a 2DA file content and returns structured data
 * Optimized for large files with efficient parsing
 */
export function parse2DAFile(content: string): TableData {
  console.log('Parsing 2DA file, content length:', content.length);
  
  const lines = content.split('\n');
  const dataLines: string[] = [];
  
  // Skip the "2DA V2.0" header and empty lines, collect valid data lines
  let headerFound = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    if (trimmed === '2DA V2.0') continue;
    
    if (!headerFound) {
      headerFound = true;
      dataLines.push(trimmed);
    } else {
      dataLines.push(trimmed);
    }
  }
  
  console.log('Data lines found:', dataLines.length);
  
  if (dataLines.length === 0) {
    console.log('No data lines found');
    return { columns: [], rows: [] };
  }
  
  // Parse header row (column names) - handle 2DA format properly
  const headerLine = dataLines[0];
  console.log('Header line full:', headerLine);
  
  // 2DA format: leading spaces, then column names for data columns (not including ID)
  // The ID column has no header name - it's just implied as the first column
  const rawColumns = headerLine.trim().split(/\s+/);
  console.log('Raw columns:', rawColumns);
  
  // Keep the original column names as-is
  const columns = rawColumns;
  console.log('Column names:', columns);
  
  // Parse data rows with simpler parsing approach
  const rows: TableRow[] = [];
  let rowsProcessed = 0;
  let rowsSkipped = 0;
  
  for (let i = 1; i < dataLines.length; i++) {
    const line = dataLines[i];
    if (!line.trim()) continue;
    
    rowsProcessed++;
    
    // Parse 2DA data line more carefully
    // 2DA files use fixed-width-ish columns separated by multiple spaces
    // Need to handle quoted strings properly
    const parts: string[] = [];
    let currentPart = '';
    let inQuotes = false;
    let j = 0;
    
    // Skip leading spaces to find first field (ID)
    while (j < line.length && line[j] === ' ') j++;
    
    while (j < line.length) {
      const char = line[j];
      
      if (char === '"' && !inQuotes) {
        // Start of quoted string
        inQuotes = true;
        currentPart += char;
      } else if (char === '"' && inQuotes) {
        // End of quoted string
        inQuotes = false;
        currentPart += char;
      } else if (char === ' ' && !inQuotes) {
        // Space outside quotes - check if it's field separator
        if (currentPart.length > 0) {
          parts.push(currentPart);
          currentPart = '';
          // Skip multiple spaces
          while (j < line.length && line[j] === ' ') j++;
          j--; // Back up one since loop will increment
        }
      } else {
        // Regular character
        currentPart += char;
      }
      j++;
    }
    
    // Add final part if any
    if (currentPart.length > 0) {
      parts.push(currentPart);
    }
    
    // Debug specific problematic row
    const debugId = parseInt(parts[0] || '0', 10);
    if (debugId === 1323) {
      console.log('DEBUG 1323 - Raw line:', line);
      console.log('DEBUG 1323 - Parts:', parts);
    }
    
    if (parts.length === 0) {
      rowsSkipped++;
      continue;
    }
    
    const id = parseInt(parts[0] || '0', 10);
    if (isNaN(id)) {
      rowsSkipped++;
      continue;
    }
    
    // Check if this row should be skipped 
    // Only skip if the label (first text column) is specifically "****"
    // In most 2DA files, this would be parts[1] (the LABEL column)
    if (parts.length > 1 && parts[1].replace(/"/g, '') === '****') {
      console.log(`Skipping row ${id} with **** label`);
      rowsSkipped++;
      continue; // Skip rows with **** labels
    }
    
    const row: TableRow = { id };
    
    // Map data columns to the header columns
    // parts[0] = ID (already handled)
    // parts[1] onwards = data columns matching columns[0] onwards (Label, Name, IconResRef, etc.)
    for (let j = 1; j < parts.length && j - 1 < columns.length; j++) {
      const columnName = columns[j - 1]; // columns[0] = Label matches parts[1]
      if (!columnName) continue;
      
      let value = parts[j] || '';
      
      // Clean up quotes
      if (value.startsWith('"') && value.endsWith('"') && value.length > 1) {
        value = value.slice(1, -1);
      }
      
      // Convert **** to empty string for better display
      if (value === '****') {
        value = '';
      }

      // Resolve string references for various name/description columns
      const stringRefColumns = ['Name', 'SpellDesc', 'FEAT', 'DESCRIPTION', 'STRING_REF', 'NAME', 'AltMessage', 'Label', 'StrRef'];
      if (stringRefColumns.includes(columnName) && value !== '' && /^\d+$/.test(value)) {
        const resolvedText = resolveStringRef(value);
        row[columnName] = resolvedText;
      }
      // Try to convert to number if it looks like one (more precise regex)
      else if (value !== '' && /^-?\d+(\.\d+)?$/.test(value)) {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          row[columnName] = numValue;
        } else {
          row[columnName] = value;
        }
      } else {
        row[columnName] = value;
      }
    }
    
    rows.push(row);
  }
  
  console.log(`Parsing complete: ${rows.length} rows kept, ${rowsSkipped} rows skipped, ${rowsProcessed} total processed`);
  return { columns: ['ID', ...columns], rows };
}

/**
 * Fetches and parses a 2DA file from the public folder
 */
export async function load2DAFile(filename: string): Promise<TableData> {
  try {
    console.log('Fetching file:', filename);
    
    // Load TLK data first
    await loadTlkData();
    
    const response = await fetch(`${process.env.PUBLIC_URL}/${filename}`);
    console.log('Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${filename}: ${response.statusText}`);
    }
    const content = await response.text();
    console.log('File content length:', content.length);
    console.log('First 200 chars:', content.substring(0, 200));
    
    return parse2DAFile(content);
  } catch (error) {
    console.error(`Error loading ${filename}:`, error);
    return { columns: [], rows: [] };
  }
}

/**
 * Exports table data to CSV format
 */
export function exportToCSV(data: TableData, filename: string): void {
  const csvContent = [
    // Header row
    data.columns.join(','),
    // Data rows
    ...data.rows.map(row => 
      data.columns.map(col => {
        const value = row[col === 'ID' ? 'id' : col] || '';
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}