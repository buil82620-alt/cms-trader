import { useState, useEffect } from 'react';
import DataTable from './DataTable';

interface DepositAddress {
  id: number;
  asset: string;
  network: string;
  address: string;
  qrCodeUrl: string | null;
  isActive: boolean;
  minAmount: string | null;
  maxAmount: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function DepositAddressesTable() {
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<DepositAddress | null>(null);
  const [formData, setFormData] = useState({
    asset: '',
    network: '',
    address: '',
    qrCodeUrl: '',
    isActive: true,
    minAmount: '',
    maxAmount: '',
    note: '',
  });

  const handleCreate = () => {
    setEditingAddress(null);
    setFormData({
      asset: '',
      network: '',
      address: '',
      qrCodeUrl: '',
      isActive: true,
      minAmount: '',
      maxAmount: '',
      note: '',
    });
    setShowModal(true);
  };

  const handleEdit = (address: DepositAddress) => {
    setEditingAddress(address);
    setFormData({
      asset: address.asset,
      network: address.network,
      address: address.address,
      qrCodeUrl: address.qrCodeUrl || '',
      isActive: address.isActive,
      minAmount: address.minAmount || '',
      maxAmount: address.maxAmount || '',
      note: address.note || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        minAmount: formData.minAmount ? parseFloat(formData.minAmount) : null,
        maxAmount: formData.maxAmount ? parseFloat(formData.maxAmount) : null,
      };

      const url = editingAddress
        ? `/api/deposit-addresses/${editingAddress.id}`
        : '/api/deposit-addresses/create';
      const method = editingAddress ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to save';
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
        throw new Error(errorMessage);
      }

      // Parse response if it has content
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const text = await response.text();
        if (text && text.trim().length > 0) {
          const data = JSON.parse(text);
          // Handle success response if needed
        }
      }

      alert(editingAddress ? 'Deposit address updated!' : 'Deposit address created!');
      setShowModal(false);
      window.location.reload();
    } catch (error: any) {
      alert(error.message || 'Error saving deposit address');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this deposit address?')) {
      return;
    }

    try {
      const response = await fetch(`/api/deposit-addresses/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete');
      }

      alert('Deposit address deleted!');
      window.location.reload();
    } catch (error) {
      alert('Error deleting deposit address');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Deposit Addresses</h1>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Add New Address
        </button>
      </div>

      <DataTable
        title=""
        apiUrl="/api/deposit-addresses/list"
        columns={[
          { key: 'id', label: 'ID', type: 'number', sortable: true },
          { key: 'asset', label: 'Asset', sortable: true, searchable: true },
          { key: 'network', label: 'Network', sortable: true, searchable: true },
          {
            key: 'address',
            label: 'Address',
            render: (value: string) => (
              <span className="font-mono text-xs max-w-xs truncate block">{value}</span>
            ),
          },
          {
            key: 'isActive',
            label: 'Status',
            render: (value: boolean) => (
              <span className={`px-2 py-1 rounded text-xs ${
                value ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
              }`}>
                {value ? 'Active' : 'Inactive'}
              </span>
            ),
          },
          {
            key: 'minAmount',
            label: 'Min Amount',
            render: (value: any) => value ? parseFloat(value).toLocaleString() : '-',
          },
          {
            key: 'maxAmount',
            label: 'Max Amount',
            render: (value: any) => value ? parseFloat(value).toLocaleString() : '-',
          },
        ]}
        onRowClick={(row: DepositAddress) => handleEdit(row)}
        createUrl={undefined}
      />

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingAddress ? 'Edit Deposit Address' : 'Create Deposit Address'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Asset *</label>
                  <input
                    type="text"
                    value={formData.asset}
                    onChange={(e) => setFormData({ ...formData, asset: e.target.value.toUpperCase() })}
                    placeholder="USDT, BTC, ETH..."
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Network *</label>
                  <input
                    type="text"
                    value={formData.network}
                    onChange={(e) => setFormData({ ...formData, network: e.target.value.toUpperCase() })}
                    placeholder="TRC20, ERC20, Bitcoin..."
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address *</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Wallet address or bank info (JSON for bank)"
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">QR Code URL</label>
                <input
                  type="text"
                  value={formData.qrCodeUrl}
                  onChange={(e) => setFormData({ ...formData, qrCodeUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Min Amount</label>
                  <input
                    type="number"
                    step="0.00000001"
                    value={formData.minAmount}
                    onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max Amount</label>
                  <input
                    type="number"
                    step="0.00000001"
                    value={formData.maxAmount}
                    onChange={(e) => setFormData({ ...formData, maxAmount: e.target.value })}
                    placeholder="Unlimited"
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Note</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="Additional notes for users"
                  className="w-full px-3 py-2 border rounded-md"
                  rows={2}
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="mr-2"
                />
                <label className="text-sm">Active</label>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingAddress ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

