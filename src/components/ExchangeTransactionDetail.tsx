import { useEffect, useState } from 'react';

interface ExchangeTransactionDetailProps {
  transactionId: string;
}

export default function ExchangeTransactionDetail({ transactionId }: ExchangeTransactionDetailProps) {
  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch(`/api/exchange-transactions/${transactionId}`)
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
        setTransaction(data.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [transactionId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const data = {
      fromAsset: formData.get('fromAsset'),
      toAsset: formData.get('toAsset'),
      fromAmount: formData.get('fromAmount'),
      toAmount: formData.get('toAmount'),
      rate: formData.get('rate'),
      feeAsset: formData.get('feeAsset'),
      feeAmount: formData.get('feeAmount'),
    };

    try {
      const response = await fetch(`/api/exchange-transactions/${transactionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to update exchange transaction';
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

      const contentType = response.headers.get('content-type');
      const result = contentType && contentType.includes('application/json')
        ? JSON.parse(await response.text())
        : { data: null };
      
      if (result.data) {
        setTransaction(result.data);
      }
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
  if (!transaction) return <div className="p-8 text-center text-red-600">Exchange transaction not found</div>;

  return (
    <div>
      <div className="mb-6">
        <a href="/exchange-transactions" className="text-blue-600 hover:underline">← Back to Exchange Transactions</a>
      </div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Exchange Transaction Details</h1>
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
          Exchange transaction updated successfully!
        </div>
      )}

      {isEditing ? (
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="fromAsset" className="block text-sm font-medium text-gray-700 mb-2">
                  From Asset *
                </label>
                <input
                  type="text"
                  id="fromAsset"
                  name="fromAsset"
                  defaultValue={transaction.fromAsset}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="toAsset" className="block text-sm font-medium text-gray-700 mb-2">
                  To Asset *
                </label>
                <input
                  type="text"
                  id="toAsset"
                  name="toAsset"
                  defaultValue={transaction.toAsset}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="fromAmount" className="block text-sm font-medium text-gray-700 mb-2">
                  From Amount *
                </label>
                <input
                  type="number"
                  id="fromAmount"
                  name="fromAmount"
                  defaultValue={transaction.fromAmount.toString()}
                  required
                  step="0.000000000000000001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="toAmount" className="block text-sm font-medium text-gray-700 mb-2">
                  To Amount (Net) *
                </label>
                <input
                  type="number"
                  id="toAmount"
                  name="toAmount"
                  defaultValue={transaction.toAmount.toString()}
                  required
                  step="0.000000000000000001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="rate" className="block text-sm font-medium text-gray-700 mb-2">
                  Rate *
                </label>
                <input
                  type="number"
                  id="rate"
                  name="rate"
                  defaultValue={transaction.rate.toString()}
                  required
                  step="0.000000000000000001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="feeAsset" className="block text-sm font-medium text-gray-700 mb-2">
                  Fee Asset *
                </label>
                <input
                  type="text"
                  id="feeAsset"
                  name="feeAsset"
                  defaultValue={transaction.feeAsset}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="feeAmount" className="block text-sm font-medium text-gray-700 mb-2">
                  Fee Amount *
                </label>
                <input
                  type="number"
                  id="feeAmount"
                  name="feeAmount"
                  defaultValue={transaction.feeAmount.toString()}
                  required
                  step="0.000000000000000001"
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
          <h2 className="text-xl font-bold mb-4">Exchange Transaction Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">ID</label>
              <p className="text-lg">{transaction.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">User</label>
              <p className="text-lg">
                {transaction.user ? (
                  <a href={`/users/${transaction.user.id}`} className="text-blue-600 hover:underline">
                    {transaction.user.email}
                  </a>
                ) : (
                  '-'
                )}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">From Asset</label>
              <p className="text-lg font-medium">{transaction.fromAsset}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">To Asset</label>
              <p className="text-lg font-medium">{transaction.toAsset}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">From Amount</label>
              <p className="text-lg">{Number(transaction.fromAmount).toLocaleString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">To Amount (Net)</label>
              <p className="text-lg font-semibold">{Number(transaction.toAmount).toLocaleString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Rate</label>
              <p className="text-lg">{Number(transaction.rate).toLocaleString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Fee Asset</label>
              <p className="text-lg">{transaction.feeAsset}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Fee Amount</label>
              <p className="text-lg">{Number(transaction.feeAmount).toLocaleString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Created At</label>
              <p className="text-lg">{new Date(transaction.createdAt).toLocaleString()}</p>
            </div>
          </div>

          {/* Exchange Summary */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold mb-3">Exchange Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded">
                <label className="text-sm font-medium text-gray-500">From</label>
                <p className="text-lg font-semibold">
                  {Number(transaction.fromAmount).toLocaleString()} {transaction.fromAsset}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded">
                <label className="text-sm font-medium text-gray-500">To (Net)</label>
                <p className="text-lg font-semibold">
                  {Number(transaction.toAmount).toLocaleString()} {transaction.toAsset}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <label className="text-sm font-medium text-gray-500">Fee</label>
                <p className="text-lg font-semibold">
                  {Number(transaction.feeAmount).toLocaleString()} {transaction.feeAsset}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

