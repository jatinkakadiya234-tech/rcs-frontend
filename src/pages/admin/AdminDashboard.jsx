import { useState, useEffect } from 'react';
import { FaUsers, FaWallet, FaCheckCircle, FaClock } from 'react-icons/fa';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    totalWalletAmount: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [usersRes, requestsRes] = await Promise.all([
        fetch('/api/api/v1/user/admin/users'),
        fetch('/api/api/v1/user/admin/wallet-requests')
      ]);

      const usersData = await usersRes.json();
      const requestsData = await requestsRes.json();

      if (usersData.success && requestsData.success) {
        const pending = requestsData.requests.filter(r => r.status === 'pending').length;
        const approved = requestsData.requests.filter(r => r.status === 'approved').length;
        const totalAmount = usersData.users.reduce((sum, user) => sum + (user.Wallet || 0), 0);

        setStats({
          totalUsers: usersData.users.length,
          pendingRequests: pending,
          approvedRequests: approved,
          totalWalletAmount: totalAmount
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

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
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FaCheckCircle className="text-xl text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Approved Requests</p>
              <p className="text-2xl font-bold text-green-600">{stats.approvedRequests}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FaWallet className="text-xl text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Wallet</p>
              <p className="text-2xl font-bold text-purple-600">₹{stats.totalWalletAmount}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;