import { useState, useEffect } from 'react';

interface DepositRequest {
  id: number;
  userId: number;
  asset: string;
  network: string;
  amount: string;
  certificateUrl: string | null;
  status: string;
  rejectReason: string | null;
  reviewedBy: number | null;
  reviewedAt: string | null;
  completedAt: string | null;
  txHash: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    email: string;
  };
}

interface DepositRequestDetailProps {
  id?: string;
}

export default function DepositRequestDetail({ id: propId }: DepositRequestDetailProps) {
  // Get ID from URL if not provided as prop
  const getIdFromUrl = () => {
    if (propId) return propId;
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const match = path.match(/\/deposit-requests\/(\d+)/);
      return match ? match[1] : null;
    }
    return null;
  };

  const id = propId || getIdFromUrl();
  const [request, setRequest] = useState<DepositRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/deposit-requests/${id}`);
        
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
          throw new Error(errorMessage);
        }
        
        // Safe JSON parsing
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error(`Expected JSON but got ${contentType}`);
        }
        
        const text = await response.text();
        if (!text || text.trim().length === 0) {
          throw new Error('Empty response body');
        }
        
        const data = JSON.parse(text);
        setRequest(data.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchRequest();
    }
  }, [id]);

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!request) return;

    if (action === 'reject' && !rejectReason.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      const endpoint = `/api/deposit-requests/${request.id}/${action}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: action === 'reject' ? rejectReason : undefined,
          txHash: action === 'approve' ? txHash : undefined,
        }),
      });

      if (!response.ok) {
        let errorMessage = `Failed to ${action} request`;
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

      alert(`Request ${action}d successfully!`);
      // Reload request data
      const reloadResponse = await fetch(`/api/deposit-requests/${id}`);
      if (!reloadResponse.ok) {
        throw new Error(`HTTP ${reloadResponse.status}`);
      }
      const reloadContentType = reloadResponse.headers.get('content-type');
      if (!reloadContentType || !reloadContentType.includes('application/json')) {
        throw new Error(`Expected JSON but got ${reloadContentType}`);
      }
      const reloadText = await reloadResponse.text();
      if (!reloadText || reloadText.trim().length === 0) {
        throw new Error('Empty response body');
      }
      const reloadData = JSON.parse(reloadText);
      if (reloadResponse.ok) {
        setRequest(reloadData.data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
      setShowRejectModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 p-4">Error: {error}</div>;
  }

  if (!request) {
    return <div className="p-4">Request not found.</div>;
  }

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      PENDING: 'bg-yellow-500',
      APPROVED: 'bg-blue-500',
      COMPLETED: 'bg-green-500',
      REJECTED: 'bg-red-500',
    };
    return (
      <span
        className={`px-3 py-1 rounded text-white text-sm font-medium ${
          statusColors[status] || 'bg-gray-500'
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-bold mb-4">Deposit Request #{request.id}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-sm text-gray-600 mb-1">User Email</p>
          <p className="font-semibold">{request.user.email} (ID: {request.user.id})</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Status</p>
          {getStatusBadge(request.status)}
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Asset</p>
          <p className="font-semibold">{request.asset}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Network</p>
          <p className="font-semibold">{request.network}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Amount</p>
          <p className="font-semibold text-lg">{parseFloat(request.amount).toLocaleString()} {request.asset}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Created At</p>
          <p className="font-semibold">{new Date(request.createdAt).toLocaleString()}</p>
        </div>
        {request.txHash && (
          <div>
            <p className="text-sm text-gray-600 mb-1">Transaction Hash</p>
            <p className="font-semibold font-mono text-sm">{request.txHash}</p>
          </div>
        )}
        {request.reviewedAt && (
          <div>
            <p className="text-sm text-gray-600 mb-1">Reviewed At</p>
            <p className="font-semibold">{new Date(request.reviewedAt).toLocaleString()}</p>
          </div>
        )}
        {request.completedAt && (
          <div>
            <p className="text-sm text-gray-600 mb-1">Completed At</p>
            <p className="font-semibold">{new Date(request.completedAt).toLocaleString()}</p>
          </div>
        )}
      </div>

      {request.rejectReason && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-sm text-gray-600 mb-1">Reject Reason</p>
          <p className="text-red-600">{request.rejectReason}</p>
        </div>
      )}

      {request.certificateUrl && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Payment Certificate</h3>
          <img
            src={request.certificateUrl}
            alt="Payment certificate"
            className="max-w-full h-auto rounded-lg shadow-sm border"
          />
        </div>
      )}

      <div className="flex gap-4">
        {request.status === 'PENDING' && (
          <>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction Hash (optional)
              </label>
              <input
                type="text"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                placeholder="Enter transaction hash"
                className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
              />
            </div>
            <button
              onClick={() => handleAction('approve')}
              disabled={actionLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {actionLoading ? 'Approving...' : 'Approve & Complete'}
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={actionLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              Reject
            </button>
          </>
        )}
        <button
          onClick={() => window.location.href = '/deposit-requests'}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
        >
          Back to List
        </button>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Reject Request</h2>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection"
              rows={4}
              className="w-full p-2 border rounded-md mb-4"
            ></textarea>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction('reject')}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

