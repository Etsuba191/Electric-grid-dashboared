'use client';

import { useEffect, useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCcw, Trash2, Undo } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';

interface GridAsset {
  id: string;
  name: string;
  type: string;
  status: string;
  deleted: boolean;
}

const ROWS_PER_PAGE = 10;

export function DeletedAssetsPage({ fetchGridAssets }: { fetchGridAssets?: () => Promise<void> }) {
  const [gridAssets, setGridAssets] = useState<GridAsset[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchDeletedAssets = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/grid-assets?includeDeleted=true', { cache: 'no-store' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to load grid assets (${res.status})`);
      }
      const data = await res.json();
      setGridAssets(data.gridAssets.filter((asset: GridAsset) => asset.deleted) || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load grid assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeletedAssets();
  }, []);

  const handleRestoreAsset = async (id: string) => {
    console.log("Restoring asset with id:", id);
    try {
      setLoading(true);
      const res = await fetch('/api/grid-assets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, deleted: false }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to restore asset');
  await fetchDeletedAssets();
  if (fetchGridAssets) await fetchGridAssets();
    } catch (e: any) {
      alert(e.message || 'Failed to restore asset');
    } finally {
      setLoading(false);
    }
  };

  const handlePermanentDeleteAsset = async (id: string) => {
    console.log("Permanently deleting asset with id:", id);
    if (!confirm('Are you sure you want to permanently delete this asset? This action cannot be undone.')) return;
    try {
      setLoading(true);
      const res = await fetch('/api/grid-assets', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, permanent: true }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete asset permanently');
      }
  await fetchDeletedAssets();
  if (fetchGridAssets) await fetchGridAssets();
    } catch (e: any) {
      alert(e.message || 'Failed to delete asset permanently');
    } finally {
      setLoading(false);
    }
  };

  const filteredAssets = useMemo(() => {
    return gridAssets.filter(asset =>
      Object.values(asset).some(value =>
        String(value).toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      )
    );
  }, [gridAssets, debouncedSearchQuery]);

  const paginatedAssets = useMemo(() => {
    const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
    return filteredAssets.slice(startIndex, startIndex + ROWS_PER_PAGE);
  }, [filteredAssets, currentPage]);

  const totalPages = Math.ceil(filteredAssets.length / ROWS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trash2 className="h-6 w-6 text-red-600" />
          <h1 className="text-3xl font-bold text-foreground">Deleted Grid Assets</h1>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search deleted assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          <Button variant="outline" onClick={fetchDeletedAssets} disabled={loading} className="flex items-center gap-2">
            <RefreshCcw className="h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedAssets.map((asset) => (
              <TableRow key={asset.id}>
                <TableCell>{asset.name}</TableCell>
                <TableCell>{asset.type}</TableCell>
                <TableCell>{asset.status}</TableCell>
                <TableCell className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleRestoreAsset(asset.id)}>
                    <Undo className="h-4 w-4 mr-1" /> Undo
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-500 border-red-500" onClick={() => handlePermanentDeleteAsset(asset.id)}>
                    <Trash2 className="h-4 w-4 mr-1" /> Permanently Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}