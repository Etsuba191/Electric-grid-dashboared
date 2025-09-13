'use client';

import { useEffect, useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, RefreshCcw, HardHat, Pencil } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { ProcessedAsset } from '@/lib/processed-data';

interface GridAsset {
  id: string;
  name: string;
  type: string;
  status: string;
  latitude: number;
  longitude: number;
  address: string;
  voltage: number;
  load: number;
  capacity: number;
  lastUpdate: string;
  site: string | null;
  zone: string | null;
  woreda: string | null;
  category: string | null;
  nameLink: string | null;
}

const ROWS_PER_PAGE = 10;

export function GridAssetsPage({ gridAssets, fetchGridAssets }: { gridAssets: ProcessedAsset[], fetchGridAssets: () => Promise<void> }) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [currentPage, setCurrentPage] = useState(1);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<GridAsset | null>(null);

  const [addErrors, setAddErrors] = useState<{ [key: string]: string }>({});
  const [editErrors, setEditErrors] = useState<{ [key: string]: string }>({});
  const [newAsset, setNewAsset] = useState({
    name: '',
    type: '',
    status: 'normal',
    latitude: 0,
    longitude: 0,
    address: '',
    voltage: 0,
    load: 0,
    capacity: 0,
    lastUpdate: new Date().toISOString(),
    site: '',
    zone: '',
    woreda: '',
    category: '',
    nameLink: '',
  });

  const handleAddAsset = async () => {
    // Validation: type, address, voltage must not be empty
    const errors: { [key: string]: string } = {};
    if (!newAsset.type.trim()) errors.type = 'Type is required.';
    if (!newAsset.address.trim()) errors.address = 'Address is required.';
    if (!newAsset.voltage) errors.voltage = 'Voltage is required.';
    setAddErrors(errors);
    if (Object.keys(errors).length > 0) return;
    try {
      setLoading(true);
      const res = await fetch('/api/grid-assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAsset),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create asset');
      await fetchGridAssets();
      setNewAsset({
        name: '',
        type: '',
        status: 'normal',
        latitude: 0,
        longitude: 0,
        address: '',
        voltage: 0,
        load: 0,
        capacity: 0,
        lastUpdate: new Date().toISOString(),
        site: '',
        zone: '',
        woreda: '',
        category: '',
        nameLink: '',
      });
  setIsAddDialogOpen(false);
  setAddErrors({});
    } catch (e: any) {
      alert(e.message || 'Failed to create asset');
    } finally {
      setLoading(false);
    }
  };

  const handleEditAsset = async () => {
    if (!selectedAsset) return;
    // Validation: type, address, voltage must not be empty
    const errors: { [key: string]: string } = {};
    if (!selectedAsset.type.trim()) errors.type = 'Type is required.';
    if (!selectedAsset.address.trim()) errors.address = 'Address is required.';
    if (!selectedAsset.voltage) errors.voltage = 'Voltage is required.';
    setEditErrors(errors);
    if (Object.keys(errors).length > 0) return;
    try {
      setLoading(true);
      const res = await fetch('/api/grid-assets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedAsset),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update asset');
      await fetchGridAssets();
  setIsEditDialogOpen(false);
  setSelectedAsset(null);
  setEditErrors({});
    } catch (e: any) {
      alert(e.message || 'Failed to update asset');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAsset = async (id: string) => {
    console.log("Deleting asset with id:", id);
    if (!confirm('Are you sure you want to delete this asset?')) return;
    try {
      setLoading(true);
      const res = await fetch('/api/grid-assets', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete asset');
      }
      await fetchGridAssets();
    } catch (e: any) {
      alert(e.message || 'Failed to delete asset');
    } finally {
      setLoading(false);
    }
  };

  // Remove duplicates by id+name and filter by search
  const filteredAssets = useMemo(() => {
    const seen = new Set();
    return gridAssets.filter(asset => {
      const key = asset.id + '-' + asset.name;
      if (seen.has(key)) return false;
      seen.add(key);
      return Object.values(asset).some(value =>
        String(value).toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );
    });
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
          <HardHat className="h-6 w-6 text-blue-600" />
          <h1 className="text-3xl font-bold text-foreground">Grid Asset Management</h1>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          <Button variant="outline" onClick={fetchGridAssets} disabled={loading} className="flex items-center gap-2">
            <RefreshCcw className="h-4 w-4" /> Refresh
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add New Asset
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="text-card-foreground">Add New Grid Asset</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 max-h-[80vh] overflow-y-auto">
                {Object.keys(newAsset).map((key) => (
                  <div className="space-y-2" key={key}>
                    <Label htmlFor={key} className="text-muted-foreground">
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                      {(key === 'type' || key === 'address' || key === 'voltage') && <span className="text-red-500"> *</span>}
                    </Label>
                    <Input
                      id={key}
                      value={newAsset[key as keyof typeof newAsset] || ''}
                      onChange={(e) => setNewAsset({ ...newAsset, [key]: e.target.value })}
                      placeholder={`Enter ${key}`}
                      className={`bg-background border-border text-foreground ${(addErrors[key]) ? 'border-red-500' : ''}`}
                      type={typeof newAsset[key as keyof typeof newAsset] === 'number' ? 'number' : 'text'}
                    />
                    {addErrors[key] && <div className="text-xs text-red-500">{addErrors[key]}</div>}
                  </div>
                ))}
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddAsset} disabled={loading}>Add Asset</Button>
              </div>
            </DialogContent>
          </Dialog>
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
              <TableHead>Address</TableHead>
                <TableHead>Elevation (m)</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedAssets.map((asset) => (
              <TableRow key={asset.id}>
                <TableCell>{asset.name} <span className="text-xs text-gray-400">({asset.id.slice(0, 6)})</span></TableCell>
                <TableCell>{asset.type || asset.plant_type || asset.source || '-'}</TableCell>
                <TableCell>{asset.status}</TableCell>
                <TableCell>{asset.address || asset.site || asset.poletical || '-'}</TableCell>
                <TableCell>{asset.elevation !== undefined ? asset.elevation : '-'}</TableCell>
                <TableCell className="flex gap-2">
                  <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setSelectedAsset(asset as GridAsset)}><Pencil className="h-4 w-4" /></Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-border sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle className="text-card-foreground">Edit Grid Asset</DialogTitle>
                      </DialogHeader>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 max-h-[80vh] overflow-y-auto">
                        {selectedAsset && Object.keys(selectedAsset).map((key) => (
                          <div className="space-y-2" key={key}>
                            <Label htmlFor={key} className="text-muted-foreground">
                              {key.charAt(0).toUpperCase() + key.slice(1)}
                              {(key === 'type' || key === 'address' || key === 'voltage') && <span className="text-red-500"> *</span>}
                            </Label>
                            <Input
                              id={key}
                              value={(selectedAsset[key as keyof typeof selectedAsset]) || ''}
                              onChange={(e) => setSelectedAsset({ ...selectedAsset, [key]: e.target.value })}
                              placeholder={`Enter ${key}`}
                              className={`bg-background border-border text-foreground ${(editErrors[key]) ? 'border-red-500' : ''}`}
                              type={typeof selectedAsset[key as keyof typeof selectedAsset] === 'number' ? 'number' : 'text'}
                              disabled={key === 'id'}
                            />
                            {editErrors[key] && <div className="text-xs text-red-500">{editErrors[key]}</div>}
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleEditAsset} disabled={loading}>Save Changes</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button variant="outline" size="sm" className="text-red-500 border-red-500" onClick={() => handleDeleteAsset(asset.id)}><Trash2 className="h-4 w-4" /></Button>
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