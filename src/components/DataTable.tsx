import { useEffect, useState } from 'react';

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
  accessor?: (row: any) => any; // Alternative to key for complex data access
  type?: 'date' | 'number' | 'string'; // Auto-format based on type
  sortable?: boolean; // Whether this column can be sorted
  searchable?: boolean; // Whether this column can be searched
}

interface DataTableProps {
  columns: Column[];
  apiUrl: string;
  title: string;
  onRowClick?: (row: any) => void;
  createUrl?: string;
}

export default function DataTable({ columns, apiUrl, title, onRowClick, createUrl }: DataTableProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);

  // Reset page when search changes
  useEffect(() => {
    if (search) {
      setPage(1);
    }
  }, [search]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '50',
        });
        
        if (search.trim()) {
          params.append('search', search.trim());
        }
        
        if (sortBy) {
          params.append('sortBy', sortBy);
          params.append('sortOrder', sortOrder);
        }

        // Check if apiUrl already has query parameters
        const separator = apiUrl.includes('?') ? '&' : '?';
        const url = `${apiUrl}${separator}${params.toString()}`;
        
        console.log('Fetching from URL:', url);
        const response = await fetch(url);
        
        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}`;
          try {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const errorData = await response.json();
              errorMessage = errorData.error || errorMessage;
            } else {
              const text = await response.text();
              errorMessage = text || errorMessage;
            }
          } catch (e) {
            console.error('Error parsing error response:', e);
          }
          console.error('API error:', response.status, errorMessage);
          setData([]);
          setTotalPages(0);
          setTotal(0);
          return;
        }
        
        // Check if response has content
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('Expected JSON but got:', contentType);
          setData([]);
          setTotalPages(0);
          setTotal(0);
          return;
        }
        
        const text = await response.text();
        if (!text || text.trim().length === 0) {
          console.error('Empty response body');
          setData([]);
          setTotalPages(0);
          setTotal(0);
          return;
        }
        
        const result = JSON.parse(text);
        console.log('API response:', result);
        
        setData(result.data || []);
        setTotalPages(result.pagination?.totalPages || 1);
        setTotal(result.pagination?.total || 0);
      } catch (error: any) {
        console.error('Error fetching data:', error);
        setData([]);
        setTotalPages(0);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }
    
    const timer = setTimeout(() => {
      fetchData();
    }, search ? 500 : 0);

    setSearchDebounce(timer);

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [page, apiUrl, sortBy, sortOrder, search]);

  const handleSort = (columnKey: string) => {
    if (sortBy === columnKey) {
      // Toggle sort order
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(columnKey);
      setSortOrder('asc');
    }
    setPage(1); // Reset to first page when sorting
  };


  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{title}</h1>
        {createUrl && (
          <a
            href={createUrl}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Create New
          </a>
        )}
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-96 px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <svg
            className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">Loading...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {columns.map((col) => {
                      const isSortable = col.sortable !== false; // Default to true if not specified
                      const isSorted = sortBy === col.key;
                      
                      return (
                        <th
                          key={col.key}
                          className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                            isSortable ? 'cursor-pointer hover:bg-gray-100 select-none' : ''
                          }`}
                          onClick={() => isSortable && handleSort(col.key)}
                        >
                          <div className="flex items-center gap-2">
                            <span>{col.label}</span>
                            {isSortable && (
                              <span className="flex flex-col">
                                <svg
                                  className={`h-3 w-3 ${isSorted && sortOrder === 'asc' ? 'text-blue-600' : 'text-gray-300'}`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                </svg>
                                <svg
                                  className={`h-3 w-3 -mt-1 ${isSorted && sortOrder === 'desc' ? 'text-blue-600' : 'text-gray-300'}`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" />
                                </svg>
                              </span>
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-500">
                        No data available
                      </td>
                    </tr>
                  ) : (
                    data.map((row, idx) => (
                      <tr
                        key={row.id || idx}
                        onClick={() => onRowClick?.(row)}
                        className={onRowClick ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}
                      >
                      {columns.map((col, colIdx) => {
                        let content: React.ReactNode;
                        
                        // Use accessor if provided, otherwise use key
                        const value = col.accessor ? col.accessor(row) : row[col.key];
                        
                        if (col.render) {
                          const rendered = col.render(value, row);
                          content = rendered ?? '-';
                        } else {
                          // Auto-format based on type
                          if (value == null) {
                            content = '-';
                          } else if (col.type === 'date') {
                            content = new Date(value).toLocaleString();
                          } else if (col.type === 'number') {
                            content = Number(value).toLocaleString();
                          } else {
                            content = String(value);
                          }
                        }
                        
                        // Use index as key fallback if multiple columns have same key
                        const cellKey = `${col.key}-${colIdx}`;
                        
                        return (
                          <td key={cellKey} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {content}
                          </td>
                        );
                      })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="bg-gray-50 px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-700">
                Showing {data.length > 0 ? (page - 1) * 50 + 1 : 0} to {Math.min(page * 50, total)} of {total} results
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="px-3 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 text-sm"
                >
                  First
                </button>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 text-sm"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm text-gray-700">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 text-sm"
                >
                  Next
                </button>
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  className="px-3 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 text-sm"
                >
                  Last
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

