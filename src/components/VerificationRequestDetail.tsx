import { useState, useEffect } from 'react';

interface VerificationRequest {
  id: number;
  userId: number;
  name: string;
  idNumber: string;
  frontIdUrl: string;
  backIdUrl: string;
  status: string;
  rejectReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
  user: {
    id: number;
    email: string;
    isVerified: boolean;
  };
}

export default function VerificationRequestDetail() {
  // Get ID from URL
  const [id, setId] = useState<number | null>(null);
  
  useEffect(() => {
    const pathParts = window.location.pathname.split('/');
    const idFromUrl = pathParts[pathParts.length - 1];
    if (idFromUrl && !isNaN(parseInt(idFromUrl))) {
      setId(parseInt(idFromUrl));
    }
  }, []);
  const [request, setRequest] = useState<VerificationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!id) return;

    const loadRequest = async () => {
      try {
        const response = await fetch(`/api/verification-requests/${id}`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
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
      } catch (error) {
        console.error('Error loading verification request:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRequest();
  }, [id]);

  const handleApprove = async () => {
    if (!id || !confirm('Are you sure you want to approve this verification request?')) {
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(`/api/verification-requests/${id}/approve`, {
        method: 'POST',
      });

      if (!response.ok) {
        let errorMessage = 'Failed to approve request';
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
      if (contentType && contentType.includes('application/json')) {
        const text = await response.text();
        if (text && text.trim().length > 0) {
          const data = JSON.parse(text);
          // Handle success response if needed
        }
      }

      alert('Verification request approved successfully!');
      window.location.reload();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!id || !rejectReason.trim()) {
      alert('Please provide a reject reason');
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(`/api/verification-requests/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rejectReason }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to reject request';
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
      if (contentType && contentType.includes('application/json')) {
        const text = await response.text();
        if (text && text.trim().length > 0) {
          const data = JSON.parse(text);
          // Handle success response if needed
        }
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject request');
      }

      alert('Verification request rejected');
      window.location.reload();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setProcessing(false);
      setShowRejectModal(false);
      setRejectReason('');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-6">
        <p className="text-red-500">Verification request not found</p>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-500',
    APPROVED: 'bg-green-500',
    REJECTED: 'bg-red-500',
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => window.location.href = '/verification-requests'}
          className="text-blue-600 hover:text-blue-800 mb-4"
        >
          ← Back to Verification Requests
        </button>
        <h1 className="text-2xl font-bold">Verification Request #{request.id}</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-sm text-gray-500">User Email</label>
            <p className="font-semibold">{request.user.email}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Status</label>
            <div>
              <span
                className={`px-3 py-1 rounded text-white text-sm ${
                  statusColors[request.status] || 'bg-gray-500'
                }`}
              >
                {request.status}
              </span>
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-500">Name on ID</label>
            <p className="font-semibold">{request.name}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">ID Number</label>
            <p className="font-semibold">{request.idNumber}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Created At</label>
            <p className="font-semibold">
              {new Date(request.createdAt).toLocaleString()}
            </p>
          </div>
          {request.reviewedAt && (
            <div>
              <label className="text-sm text-gray-500">Reviewed At</label>
              <p className="font-semibold">
                {new Date(request.reviewedAt).toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {request.rejectReason && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded">
            <label className="text-sm text-gray-500">Reject Reason</label>
            <p className="text-red-700">{request.rejectReason}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label className="text-sm text-gray-500 mb-2 block">Front ID</label>
            <img
              src={request.frontIdUrl.startsWith('http') ? request.frontIdUrl : `http://localhost:4321${request.frontIdUrl}`}
              alt="Front ID"
              className="w-full border rounded-lg"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.src.includes('localhost:4321')) {
                  target.src = request.frontIdUrl;
                }
              }}
            />
          </div>
          <div>
            <label className="text-sm text-gray-500 mb-2 block">Back ID</label>
            <img
              src={request.backIdUrl.startsWith('http') ? request.backIdUrl : `http://localhost:4321${request.backIdUrl}`}
              alt="Back ID"
              className="w-full border rounded-lg"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.src.includes('localhost:4321')) {
                  target.src = request.backIdUrl;
                }
              }}
            />
          </div>
        </div>

        {request.status === 'PENDING' && (
          <div className="flex gap-4">
            <button
              onClick={handleApprove}
              disabled={processing}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {processing ? 'Processing...' : 'Approve'}
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={processing}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        )}
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Reject Verification Request</h2>
            <label className="block text-sm text-gray-700 mb-2">
              Reject Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full border rounded-lg p-2 mb-4"
              rows={4}
              placeholder="Enter reason for rejection..."
            />
            <div className="flex gap-4">
              <button
                onClick={handleReject}
                disabled={processing || !rejectReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {processing ? 'Processing...' : 'Confirm Reject'}
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

