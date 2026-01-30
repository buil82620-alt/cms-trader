import { useEffect, useState } from 'react';

interface UserDetailProps {
  userId: string;
}

export default function UserDetail({ userId }: UserDetailProps) {
  const [user, setUser] = useState<any>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'wallets' | 'trading' | 'transactions'>('overview');
  const [showBanModal, setShowBanModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [balanceForm, setBalanceForm] = useState({ asset: 'USDT', amount: '', type: 'add', reason: '' });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadUserData();
  }, [userId]);

  const loadUserData = async () => {
    try {
      const [userRes, statsRes] = await Promise.all([
        fetch(`/api/users/${userId}`),
        fetch(`/api/users/${userId}/statistics`),
      ]);

      // Safe JSON parsing
      const parseJson = async (res: Response) => {
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
      };

      const [userData, statsData] = await Promise.all([
        parseJson(userRes),
        parseJson(statsRes),
      ]);

      setUser(userData.data);
      setStatistics(statsData.data);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBan = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: banReason }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to ban user';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          }
        } catch (e) {
          // Ignore
        }
        setMessage({ type: 'error', text: errorMessage });
        return;
      }

      const contentType = response.headers.get('content-type');
      const result = contentType && contentType.includes('application/json')
        ? JSON.parse(await response.text())
        : { message: 'User banned successfully' };
      
      setMessage({ type: 'success', text: result.message });
      setShowBanModal(false);
      setBanReason('');
      loadUserData();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleUnban = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/unban`, {
        method: 'POST',
      });

      if (!response.ok) {
        let errorMessage = 'Failed to unban user';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          }
        } catch (e) {
          // Ignore
        }
        setMessage({ type: 'error', text: errorMessage });
        return;
      }

      const contentType = response.headers.get('content-type');
      const result = contentType && contentType.includes('application/json')
        ? JSON.parse(await response.text())
        : { message: 'User unbanned successfully' };
      
      setMessage({ type: 'success', text: result.message });
      loadUserData();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleToggleActive = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/toggle-active`, {
        method: 'POST',
      });

      if (!response.ok) {
        let errorMessage = 'Failed to toggle user status';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          }
        } catch (e) {
          // Ignore
        }
        setMessage({ type: 'error', text: errorMessage });
        return;
      }

      const contentType = response.headers.get('content-type');
      const result = contentType && contentType.includes('application/json')
        ? JSON.parse(await response.text())
        : { message: 'User status updated successfully' };
      
      setMessage({ type: 'success', text: result.message });
      loadUserData();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to reset password';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          }
        } catch (e) {
          // Ignore
        }
        setMessage({ type: 'error', text: errorMessage });
        return;
      }

      const contentType = response.headers.get('content-type');
      const result = contentType && contentType.includes('application/json')
        ? JSON.parse(await response.text())
        : { message: 'Password reset successfully' };
      
      setMessage({ type: 'success', text: result.message });
      setShowPasswordModal(false);
      setNewPassword('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleAdjustBalance = async () => {
    if (!balanceForm.amount || parseFloat(balanceForm.amount) <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid amount' });
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}/adjust-balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(balanceForm),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to adjust balance';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          }
        } catch (e) {
          // Ignore
        }
        setMessage({ type: 'error', text: errorMessage });
        return;
      }

      const contentType = response.headers.get('content-type');
      const result = contentType && contentType.includes('application/json')
        ? JSON.parse(await response.text())
        : { message: 'Balance adjusted successfully' };
      
      setMessage({ type: 'success', text: result.message });
      setShowBalanceModal(false);
      setBalanceForm({ asset: 'USDT', amount: '', type: 'add', reason: '' });
      loadUserData();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!user) return <div className="p-8 text-center text-red-600">User not found</div>;

  return (
    <div>
      <div className="mb-6">
        <a href="/users" className="text-blue-600 hover:underline">← Back to Users</a>
      </div>

      {message && (
        <div
          className={`mb-4 p-4 rounded ${
            message.type === 'success'
              ? 'bg-green-100 border border-green-400 text-green-700'
              : 'bg-red-100 border border-red-400 text-red-700'
          }`}
        >
          {message.text}
          <button
            onClick={() => setMessage(null)}
            className="float-right text-lg font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Header with Actions */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{user.email}</h1>
          <div className="flex gap-2 mt-2">
            {user.isBanned ? (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                Banned
              </span>
            ) : user.isActive ? (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                Active
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                Inactive
              </span>
            )}
            {user.isVerified && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                Verified
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {user.isBanned ? (
            <button
              onClick={handleUnban}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Unban User
            </button>
          ) : (
            <button
              onClick={() => setShowBanModal(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Ban User
            </button>
          )}
          <button
            onClick={handleToggleActive}
            className={`px-4 py-2 rounded-md ${
              user.isActive
                ? 'bg-gray-600 text-white hover:bg-gray-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {user.isActive ? 'Deactivate' : 'Activate'}
          </button>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Reset Password
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600 mb-1">Total Balance</p>
            <p className="text-2xl font-bold">
              ${statistics.summary?.totalBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600 mb-1">Trading Volume</p>
            <p className="text-2xl font-bold">
              ${statistics.trading?.totalVolume.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600 mb-1">Total Orders</p>
            <p className="text-2xl font-bold">{statistics.trading?.totalOrders || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600 mb-1">Total Profit</p>
            <p className={`text-2xl font-bold ${
              (statistics.contracts?.totalProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              ${(statistics.contracts?.totalProfit || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-4">
          {(['overview', 'wallets', 'trading', 'transactions'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium border-b-2 ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* User Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">User Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">ID</label>
                <p className="text-lg">{user.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-lg">{user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Created At</label>
                <p className="text-lg">{new Date(user.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Last Login</label>
                <p className="text-lg">
                  {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}
                </p>
              </div>
              {user.isBanned && (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Banned At</label>
                    <p className="text-lg">
                      {user.bannedAt ? new Date(user.bannedAt).toLocaleString() : '-'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Ban Reason</label>
                    <p className="text-lg">{user.banReason || '-'}</p>
                  </div>
                </>
              )}
              {user._count && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Statistics</label>
                  <div className="text-sm mt-1 space-y-1">
                    <p>Wallets: {user._count.wallets || 0}</p>
                    <p>Orders: {user._count.orders || 0}</p>
                    <p>Contract Positions: {user._count.contractPositions || 0}</p>
                    <p>Trade Fills: {user._count.tradeFills || 0}</p>
                    <p>Withdrawals: {user._count.withdrawalRequests || 0}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Trading Statistics */}
          {statistics && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Trading Statistics</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Volume</p>
                  <p className="text-lg font-semibold">
                    ${statistics.trading?.totalVolume.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Fees</p>
                  <p className="text-lg font-semibold">
                    ${statistics.summary?.totalFees.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Trades</p>
                  <p className="text-lg font-semibold">{statistics.trading?.totalTrades || 0}</p>
                </div>
              </div>
            </div>
          )}

          {/* Contract Statistics */}
          {statistics && statistics.contracts && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Contract Positions Statistics</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Positions</p>
                  <p className="text-lg font-semibold">{statistics.contracts.totalPositions}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Win Rate</p>
                  <p className="text-lg font-semibold">
                    {statistics.contracts.winRate.toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Wins / Losses</p>
                  <p className="text-lg font-semibold">
                    {statistics.contracts.winPositions} / {statistics.contracts.lossPositions}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Profit</p>
                  <p className={`text-lg font-semibold ${
                    statistics.contracts.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ${statistics.contracts.totalProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'wallets' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              Wallets ({user.wallets?.length || 0})
            </h2>
            <button
              onClick={() => setShowBalanceModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Adjust Balance
            </button>
          </div>
          <div className="overflow-x-auto">
            {user.wallets && user.wallets.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Available</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Locked</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {user.wallets.map((wallet: any) => (
                    <tr key={wallet.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{wallet.asset}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {Number(wallet.available).toLocaleString(undefined, { maximumFractionDigits: 8 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {Number(wallet.locked).toLocaleString(undefined, { maximumFractionDigits: 8 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                        {(Number(wallet.available) + Number(wallet.locked)).toLocaleString(undefined, { maximumFractionDigits: 8 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <a
                          href={`/wallets/${wallet.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          View Details
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500">No wallets found</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'trading' && (
        <div className="space-y-6">
          {/* Orders */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">
              Spot Orders ({user.orders?.length || 0})
            </h2>
            <div className="overflow-x-auto">
              {user.orders && user.orders.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Side</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {user.orders.map((order: any) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <a href={`/spot-orders/${order.id}`} className="text-blue-600 hover:underline">
                            {order.id}
                          </a>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{order.symbol}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            order.side === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {order.side}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {order.price ? Number(order.price).toLocaleString() : 'MARKET'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{Number(order.quantity).toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            order.status === 'FILLED' ? 'bg-green-100 text-green-800' :
                            order.status === 'CANCELED' ? 'bg-gray-100 text-gray-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(order.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-500">No orders found</p>
              )}
            </div>
          </div>

          {/* Contract Positions */}
          {user.contractPositions && user.contractPositions.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">
                Contract Positions ({user.contractPositions.length})
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Side</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entry Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {user.contractPositions.map((position: any) => (
                      <tr key={position.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <a href={`/contract-positions/${position.id}`} className="text-blue-600 hover:underline">
                            {position.id}
                          </a>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{position.symbol}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            position.side === 'BUY_UP' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {position.side}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{Number(position.amount).toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{Number(position.entryPrice).toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            position.status === 'CLOSED' && position.result === 'WIN' ? 'bg-green-100 text-green-800' :
                            position.status === 'CLOSED' && position.result === 'LOSS' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {position.status} {position.result ? `(${position.result})` : ''}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(position.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="space-y-6">
          {/* Withdrawals */}
          {user.withdrawalRequests && user.withdrawalRequests.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Withdrawal Requests</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {user.withdrawalRequests.map((withdrawal: any) => (
                      <tr key={withdrawal.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <a href={`/withdrawal-requests/${withdrawal.id}`} className="text-blue-600 hover:underline">
                            {withdrawal.id}
                          </a>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{withdrawal.asset}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{Number(withdrawal.amount).toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            withdrawal.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            withdrawal.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {withdrawal.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(withdrawal.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Transfers */}
          {user.transfers && user.transfers.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Transfers</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">From → To</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {user.transfers.map((transfer: any) => (
                      <tr key={transfer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <a href={`/transfers/${transfer.id}`} className="text-blue-600 hover:underline">
                            {transfer.id}
                          </a>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{transfer.asset}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{Number(transfer.amount).toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {transfer.fromAccount} → {transfer.toAccount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(transfer.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Exchange Transactions */}
          {user.exchangeTransactions && user.exchangeTransactions.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Exchange Transactions</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">From → To</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {user.exchangeTransactions.map((tx: any) => (
                      <tr key={tx.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <a href={`/exchange-transactions/${tx.id}`} className="text-blue-600 hover:underline">
                            {tx.id}
                          </a>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {tx.fromAsset} → {tx.toAsset}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {Number(tx.fromAmount).toLocaleString()} → {Number(tx.toAmount).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{Number(tx.rate).toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(tx.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ban Modal */}
      {showBanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Ban User</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason (optional)
              </label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
                placeholder="Enter ban reason..."
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleBan}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Ban User
              </button>
              <button
                onClick={() => {
                  setShowBanModal(false);
                  setBanReason('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Reset Password</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter new password (min 6 characters)"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleResetPassword}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Reset Password
              </button>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setNewPassword('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Balance Adjustment Modal */}
      {showBalanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Adjust Balance</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asset
                </label>
                <input
                  type="text"
                  value={balanceForm.asset}
                  onChange={(e) => setBalanceForm({ ...balanceForm, asset: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="USDT, BTC, ETH..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  value={balanceForm.amount}
                  onChange={(e) => setBalanceForm({ ...balanceForm, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="0.00"
                  step="0.00000001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={balanceForm.type}
                  onChange={(e) => setBalanceForm({ ...balanceForm, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="add">Add Balance</option>
                  <option value="subtract">Subtract Balance</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason (optional)
                </label>
                <textarea
                  value={balanceForm.reason}
                  onChange={(e) => setBalanceForm({ ...balanceForm, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={2}
                  placeholder="Enter reason for adjustment..."
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleAdjustBalance}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Adjust Balance
              </button>
              <button
                onClick={() => {
                  setShowBalanceModal(false);
                  setBalanceForm({ asset: 'USDT', amount: '', type: 'add', reason: '' });
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
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
