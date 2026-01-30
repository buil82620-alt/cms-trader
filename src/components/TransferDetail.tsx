import { useEffect, useState } from 'react';

interface TransferDetailProps {
  transferId: string;
}

export default function TransferDetail({ transferId }: TransferDetailProps) {
  const [transfer, setTransfer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch(`/api/transfers/${transferId}`)
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
        setTransfer(data.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [transferId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const data = {
      asset: formData.get('asset'),
      amount: formData.get('amount'),
      fromAccount: formData.get('fromAccount'),
      toAccount: formData.get('toAccount'),
    };

    try {
      const response = await fetch(`/api/transfers/${transferId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update transfer');
      }

      setTransfer(result.data);
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
  if (!transfer) return <div className="p-8 text-center text-red-600">Transfer not found</div>;

  return (
    <div>
      <div className="mb-6">
        <a href="/transfers" className="text-blue-600 hover:underline">← Back to Transfers</a>
      </div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Transfer Details</h1>
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
          Transfer updated successfully!
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
                  defaultValue={transfer.asset}
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
                  defaultValue={transfer.amount.toString()}
                  required
                  step="0.000000000000000001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="fromAccount" className="block text-sm font-medium text-gray-700 mb-2">
                  From Account *
                </label>
                <select
                  id="fromAccount"
                  name="fromAccount"
                  defaultValue={transfer.fromAccount}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="coins">Coins</option>
                  <option value="contract">Contract</option>
                </select>
              </div>

              <div>
                <label htmlFor="toAccount" className="block text-sm font-medium text-gray-700 mb-2">
                  To Account *
                </label>
                <select
                  id="toAccount"
                  name="toAccount"
                  defaultValue={transfer.toAccount}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="coins">Coins</option>
                  <option value="contract">Contract</option>
                </select>
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
          <h2 className="text-xl font-bold mb-4">Transfer Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">ID</label>
              <p className="text-lg">{transfer.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">User</label>
              <p className="text-lg">
                {transfer.user ? (
                  <a href={`/users/${transfer.user.id}`} className="text-blue-600 hover:underline">
                    {transfer.user.email}
                  </a>
                ) : (
                  '-'
                )}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Asset</label>
              <p className="text-lg font-medium">{transfer.asset}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Amount</label>
              <p className="text-lg">{Number(transfer.amount).toLocaleString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">From Account</label>
              <p className="text-lg">
                <span className="px-2 py-1 rounded text-sm font-medium bg-blue-100 text-blue-800">
                  {transfer.fromAccount}
                </span>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">To Account</label>
              <p className="text-lg">
                <span className="px-2 py-1 rounded text-sm font-medium bg-green-100 text-green-800">
                  {transfer.toAccount}
                </span>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Created At</label>
              <p className="text-lg">{new Date(transfer.createdAt).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

