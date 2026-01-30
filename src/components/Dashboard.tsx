import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [recentActivities, setRecentActivities] = useState<any>(null);
  const [userGrowth, setUserGrowth] = useState<any[]>([]);
  const [tradingVolume, setTradingVolume] = useState<any[]>([]);
  const [topAssets, setTopAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [statsRes, activitiesRes, growthRes, volumeRes, assetsRes] = await Promise.all([
          fetch('/api/dashboard/stats'),
          fetch('/api/dashboard/recent-activities?limit=5'),
          fetch('/api/dashboard/user-growth?days=30'),
          fetch('/api/dashboard/trading-volume?days=30'),
          fetch('/api/dashboard/top-assets'),
        ]);

        // Helper function for safe JSON parsing
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

        const [statsData, activitiesData, growthData, volumeData, assetsData] = await Promise.all([
          parseJson(statsRes),
          parseJson(activitiesRes),
          parseJson(growthRes),
          parseJson(volumeRes),
          parseJson(assetsRes),
        ]);

        setStats(statsData.data);
        setRecentActivities(activitiesData.data);
        setUserGrowth(growthData.data);
        setTradingVolume(volumeData.data);
        setTopAssets(assetsData.data);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center">Loading dashboard...</div>;
  }

  if (!stats) {
    return <div className="p-8 text-center text-red-600">Failed to load dashboard data</div>;
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Users</p>
              <p className="text-3xl font-bold">{stats.totals.users.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">
                +{stats.today.newUsers} today • +{stats.thisWeek.newUsers} this week
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Open Orders</p>
              <p className="text-3xl font-bold">{stats.status.openOrders.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.today.orders} orders today
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Pending Withdrawals</p>
              <p className="text-3xl font-bold text-orange-600">{stats.status.pendingWithdrawals.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.today.withdrawals} requests today
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Today's Volume</p>
              <p className="text-3xl font-bold text-green-600">
                ${stats.today.tradingVolume.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Fees: ${stats.today.fees.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm mb-2">Total Wallets</p>
          <p className="text-2xl font-bold">{stats.totals.wallets.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm mb-2">Open Contract Positions</p>
          <p className="text-2xl font-bold">{stats.status.openContractPositions.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm mb-2">Total Balance</p>
          <p className="text-2xl font-bold">
            ${stats.financial.totalBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">User Growth (Last 30 Days)</h3>
          <div className="h-64 flex items-end justify-between gap-1">
            {userGrowth.slice(-14).map((day, idx) => {
              const maxCount = Math.max(...userGrowth.map((d: any) => d.cumulative));
              const height = (day.cumulative / maxCount) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors"
                    style={{ height: `${height}%` }}
                    title={`${day.date}: ${day.count} new, ${day.cumulative} total`}
                  />
                  <span className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-top-left whitespace-nowrap">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Trading Volume Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Trading Volume (Last 30 Days)</h3>
          <div className="h-64 flex items-end justify-between gap-1">
            {tradingVolume.slice(-14).map((day, idx) => {
              const maxVolume = Math.max(...tradingVolume.map((d: any) => d.volume));
              const height = maxVolume > 0 ? (day.volume / maxVolume) * 100 : 0;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-green-500 rounded-t hover:bg-green-600 transition-colors"
                    style={{ height: `${height}%` }}
                    title={`${day.date}: $${day.volume.toLocaleString()}`}
                  />
                  <span className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-top-left whitespace-nowrap">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Assets and Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Assets */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Top Assets by Balance</h3>
          <div className="space-y-3">
            {topAssets.slice(0, 5).map((asset, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">
                    {asset.asset.substring(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold">{asset.asset}</p>
                    <p className="text-xs text-gray-500">
                      Available: {asset.totalAvailable.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {asset.total.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-500">
                    Locked: {asset.totalLocked.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Recent Activities</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {/* Recent Users */}
            {recentActivities?.recentUsers?.slice(0, 3).map((user: any) => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium">New User</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(user.createdAt).toLocaleString()}
                </span>
              </div>
            ))}

            {/* Recent Orders */}
            {recentActivities?.recentOrders?.slice(0, 3).map((order: any) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    order.side === 'BUY' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <span className={`text-xs font-bold ${order.side === 'BUY' ? 'text-green-600' : 'text-red-600'}`}>
                      {order.side === 'BUY' ? '↑' : '↓'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{order.symbol} {order.side}</p>
                    <p className="text-xs text-gray-500">{order.user.email}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(order.createdAt).toLocaleString()}
                </span>
              </div>
            ))}

            {/* Recent Withdrawals */}
            {recentActivities?.recentWithdrawals?.slice(0, 3).map((withdrawal: any) => (
              <div key={withdrawal.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {withdrawal.amount} {withdrawal.asset} Withdrawal
                    </p>
                    <p className="text-xs text-gray-500">
                      {withdrawal.user.email} • <span className={`px-1 rounded ${
                        withdrawal.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        withdrawal.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>{withdrawal.status}</span>
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(withdrawal.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a
            href="/withdrawal-requests?status=PENDING"
            className="p-4 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold text-orange-600">Pending Withdrawals</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">{stats.status.pendingWithdrawals}</p>
          </a>

          <a
            href="/spot-orders?status=NEW"
            className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="font-semibold text-green-600">Open Orders</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.status.openOrders}</p>
          </a>

          <a
            href="/users"
            className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span className="font-semibold text-blue-600">All Users</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.totals.users}</p>
          </a>

          <a
            href="/contract-positions?status=OPEN"
            className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span className="font-semibold text-purple-600">Open Positions</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">{stats.status.openContractPositions}</p>
          </a>
        </div>
      </div>
    </div>
  );
}

