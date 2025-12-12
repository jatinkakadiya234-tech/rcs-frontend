import { useState, useEffect } from 'react';
import { FaUsers, FaWallet, FaCheckCircle, FaClock, FaExchangeAlt } from 'react-icons/fa';
import apiService from '../../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMessages: 0,
    pendingRequests: 0,
    totalTransactions: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await apiService.getDashboard();
      if (data.success) {
        setStats(data.dashboard.stats);
        setRecentUsers(data.dashboard.recentUsers);
        setRecentRequests(data.dashboard.recentWalletRequests);
        setRecentTransactions(data.dashboard.recentTransactions);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FaUsers className="text-xl text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FaWallet className="text-xl text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Messages</p>
              <p className="text-2xl font-bold text-green-600">{stats.totalMessages}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <FaClock className="text-xl text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Requests</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingRequests}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FaExchangeAlt className="text-xl text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Transactions</p>
              <p className="text-2xl font-bold text-purple-600">{stats.totalTransactions}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold mb-4">Recent Users</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recentUsers.map((user, i) => (
              <div key={user._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    {user.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {user.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold mb-4">Recent Wallet Requests</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recentRequests.map((req) => (
              <div key={req._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{req.userId?.name}</p>
                  <p className="text-sm text-gray-500">{req.userId?.email}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-purple-600">₹{req.amount}</p>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    req.status === 'approved' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {req.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
        <h2 className="text-lg font-bold mb-4">Recent Transactions</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentTransactions.map((txn) => (
                <tr key={txn._id}>
                  <td className="px-4 py-3">{txn.userId?.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${txn.type === 'credit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {txn.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    <span className={txn.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                      {txn.type === 'credit' ? '+' : '-'}₹{txn.amount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{new Date(txn.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;