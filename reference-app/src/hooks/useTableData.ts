import { useState, useEffect } from 'react';
import { TableData, load2DAFile } from '../utils/2daParser';

export interface UseTableDataResult {
  data: TableData | null;
  loading: boolean;
  error: string | null;
}

export function useTableData(filename: string): UseTableDataResult {
  const [data, setData] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        console.log(`Loading data for ${filename}...`);
        setLoading(true);
        setError(null);
        const tableData = await load2DAFile(filename);
        
        console.log(`Loaded ${filename}:`, tableData);
        
        if (isMounted) {
          setData(tableData);
          console.log(`Set data for ${filename}, rows:`, tableData.rows.length);
        }
      } catch (err) {
        console.error(`Error in useTableData for ${filename}:`, err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load data');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [filename]);

  return { data, loading, error };
}