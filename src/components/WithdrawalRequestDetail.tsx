import { useEffect, useState } from 'react';

interface WithdrawalRequestDetailProps {
  requestId: string;
}

export default function WithdrawalRequestDetail({ requestId }: WithdrawalRequestDetailProps) {
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch(`/api/withdrawal-requests/${requestId}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error(`Expected JSON but got ${contentType}`);
        }
        const text = await res.text();
        if (!text || text.trim().length === 0) {
          throw new Error('Empty response body');
        }
        return JSON.parse(text);
      })
      .then((data) => {
        setRequest(data.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [requestId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const data = {
      asset: formData.get('asset'),
      chain: formData.get('chain'),
      address: formData.get('address'),
      amount: formData.get('amount'),
      fee: formData.get('fee'),
      arrival: formData.get('arrival'),
      status: formData.get('status'),
      txHash: formData.get('txHash') || null,
    };

    try {
      const response = await fetch(`/api/withdrawal-requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update withdrawal request');
      }

      setRequest(result.data);
      setSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!request) return <div className="p-8 text-center text-red-600">Withdrawal request not found</div>;

  return (
    <div>
      <div className="mb-6">
        <a href="/withdrawal-requests" className="text-blue-600 hover:underline">← Back to Withdrawal Requests</a>
      </div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Withdrawal Request Details</h1>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Edit
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          Withdrawal request updated successfully!
        </div>
      )}

      {isEditing ? (
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="asset" className="block text-sm font-medium text-gray-700 mb-2">
                  Asset *
                </label>
                <input
                  type="text"
                  id="asset"
                  name="asset"
                  defaultValue={request.asset}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="chain" className="block text-sm font-medium text-gray-700 mb-2">
                  Chain *
                </label>
                <input
                  type="text"
                  id="chain"
                  name="chain"
                  defaultValue={request.chain}
                  required
                  placeholder="e.g., ERC20, TRC20"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  defaultValue={request.address}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                  Amount *
                </label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  defaultValue={request.amount.toString()}
                  required
                  step="0.000000000000000001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="fee" className="block text-sm font-medium text-gray-700 mb-2">
                  Fee *
                </label>
                <input
                  type="number"
                  id="fee"
                  name="fee"
                  defaultValue={request.fee.toString()}
                  required
                  step="0.000000000000000001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="arrival" className="block text-sm font-medium text-gray-700 mb-2">
                  Arrival *
                </label>
                <input
                  type="number"
                  id="arrival"
                  name="arrival"
                  defaultValue={request.arrival.toString()}
                  required
                  step="0.000000000000000001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue={request.status}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="SENT">SENT</option>
                  <option value="REJECTED">REJECTED</option>
                  <option value="CANCELED">CANCELED</option>
                </select>
              </div>

              <div>
                <label htmlFor="txHash" className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction Hash
                </label>
                <input
                  type="text"
                  id="txHash"
                  name="txHash"
                  defaultValue={request.txHash || ''}
                  placeholder="Enter transaction hash when status is SENT"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setError(null);
                }}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Withdrawal Request Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">ID</label>
              <p className="text-lg">{request.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">User</label>
              <p className="text-lg">
                {request.user ? (
                  <a href={`/users/${request.user.id}`} className="text-blue-600 hover:underline">
                    {request.user.email}
                  </a>
                ) : (
                  '-'
                )}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Asset</label>
              <p className="text-lg font-medium">{request.asset}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Chain</label>
              <p className="text-lg">{request.chain}</p>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-500">Address</label>
              <p className="text-lg font-mono break-all">{request.address}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Amount</label>
              <p className="text-lg">{Number(request.amount).toLocaleString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Fee</label>
              <p className="text-lg">{Number(request.fee).toLocaleString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Arrival</label>
              <p className="text-lg font-semibold">{Number(request.arrival).toLocaleString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <p className="text-lg">
                <span className={`px-2 py-1 rounded text-sm font-medium ${
                  request.status === 'APPROVED' || request.status === 'SENT' ? 'bg-green-100 text-green-800' :
                  request.status === 'REJECTED' || request.status === 'CANCELED' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {request.status}
                </span>
              </p>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-500">Transaction Hash</label>
              <p className="text-lg font-mono break-all">
                {request.txHash || (
                  <span className="text-gray-400">Not set</span>
                )}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Created At</label>
              <p className="text-lg">{new Date(request.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Updated At</label>
              <p className="text-lg">{new Date(request.updatedAt).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

