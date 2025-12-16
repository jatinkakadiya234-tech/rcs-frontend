import { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { FiCreditCard, FiPlus, FiRefreshCw } from "react-icons/fi";

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const [messageReports, setMessageReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [walletBalance, setWalletBalance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [addAmount, setAddAmount] = useState("");
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [stats, setStats] = useState({
    totalMessages: 0,
    sentMessages: 0,
    pendingMessages: 0,
    failedMessages: 0,
    totalTemplates: 0,
  });

  useEffect(() => {
    const userInterval = setInterval(() => {
      refreshUser();
    }, 1000); // Refresh user every 1 second
    
    const dataInterval = setInterval(() => {
      if (user?._id) {
        fetchMessageReports();
      }
    }, 10000); // Refresh data every 10 seconds
    
    return () => {
      clearInterval(userInterval);
      clearInterval(dataInterval);
    };
  }, [refreshUser, user]);

  useEffect(() => {
    if (user?._id) {
      fetchMessageReports(true); // Show toast on initial load
    }
  }, [user]);

  const fetchMessageReports = async (showToast = false) => {
    try {
      setLoading(true);
      const [reportsData, statsData] = await Promise.all([
        api.getrecentorders(user._id),
        api.getMessageStats(user._id),
      ]);
      
      if (showToast) {
        toast.success("Dashboard data loaded successfully");
      }

      const messages = reportsData.data || [];
      setMessageReports(messages);
      console.log(statsData);
      setStats({
        totalMessages: statsData.data?.totalMessages || 0,
        sentMessages: statsData.data?.sentMessages || 0,
        pendingMessages: statsData.data?.pendingMessages || 0,
        failedMessages: statsData.data?.failedMessages || 0,
        totalTemplates: statsData?.data?.sendtoteltemplet || 0,
      });
    } catch (err) {
      console.error("Error fetching data:", err);
      if (showToast) {
        toast.error("Failed to fetch dashboard data");
      }
    } finally {
      setLoading(false);
    }
  };
  const handleAddMoney = async () => {
    if (addAmount && parseFloat(addAmount) > 0) {
      try {
        const data = await apiService.addWalletRequest({
          amount: parseFloat(addAmount),
          userId: user._id,
        });

        if (data.success) {
          setResultData({
            success: true,
            message: `Wallet recharge request of ₹${addAmount} submitted for admin approval!`,
          });
          setAddAmount("");
          setShowAddMoney(false);
          refreshUser();
        } else {
          setResultData({
            success: false,
            message: "Failed to submit request: " + data.message,
          });
        }
        setShowResultModal(true);
      } catch (error) {
        setResultData({
          success: false,
          message: "Error submitting request: " + error.message,
        });
        setShowResultModal(true);
      }
    }
  };

  return (
    <div className="w-full overflow-hidden">
      {/* Stats Cards */}

      <h1 className="text-2xl ms-5 uppercase">Welcome to {user.companyname}</h1>
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white w-full mt-7">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FiCreditCard className="text-2xl" />
            <h3 className="text-xl font-semibold">Wallet Credits</h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                setRefreshing(true);
                await refreshUser();
                setRefreshing(false);
              }}
              disabled={refreshing}
              className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
            <button
              onClick={() => setShowAddMoney(true)}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <FiPlus /> Add Money
            </button>
          </div>
        </div>

        <div className="text-3xl font-bold mb-2">
          ₹{user?.Wallet?.toFixed(2) || "0.00"}
        </div>
        <p className="text-purple-100">Available Credits</p>
      </div>
      <div className="p-2 sm:p-3 md:p-4 lg:p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 mb-2">Devices</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl">📱</span>
              <span className="text-2xl font-bold text-gray-900">
                {loading ? "..." : "1"}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 mb-2">Welcome Message</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl">😊</span>
              <span className="text-2xl font-bold text-gray-900">
                {loading ? "..." : "0"}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 mb-2">Templates</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl">📄</span>
              <span className="text-2xl font-bold text-gray-900">
                {loading ? "..." : stats.totalTemplates}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 mb-2">Total Campaigns</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl">💬</span>
              <span className="text-2xl font-bold text-gray-900">
                {loading ? "..." : stats.totalMessages}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-2 sm:px-3 md:px-4 lg:px-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl font-bold text-gray-900">
                {loading ? "..." : stats.totalMessages}
              </span>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              </div>
            </div>
            <p className="text-sm text-gray-600">Total Messages</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl font-bold text-gray-900">
                {loading ? "..." : stats.pendingMessages}
              </span>
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              </div>
            </div>
            <p className="text-sm text-gray-600">Pending Messages</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl font-bold text-gray-900">
                {loading ? "..." : stats.sentMessages}
              </span>
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
            </div>
            <p className="text-sm text-gray-600">Message Sent</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl font-bold text-gray-900">
                {loading ? "..." : stats.failedMessages}
              </span>
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
              </div>
            </div>
            <p className="text-sm text-gray-600">Failed Messages</p>
          </div>
        </div>

        {/* Recent Messages Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Today's Orders
          </h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : messageReports.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No recent messages found
            </p>
          ) : (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                        ID
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                        Type
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                        Recipients
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                        Success/Failed
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {messageReports
                      .slice(
                        (currentPage - 1) * itemsPerPage,
                        currentPage * itemsPerPage
                      )
                      .map((message, idx) => (
                        <tr
                          key={message._id}
                          className="border-t hover:bg-gray-50"
                        >
                          <td className="py-3 px-4 text-sm">
                            #{(currentPage - 1) * itemsPerPage + idx + 1}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full capitalize">
                              {message.type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {message.phoneNumbers?.length || 0}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <span className="text-green-600">
                              {message.status === "sent"
                                ? message.successCount
                                : 0}
                            </span>
                            <span className="text-gray-400 mx-1">/</span>
                            <span className="text-red-600">
                              {message.failedCount || 0}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                message.status === "sent"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {message.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">
                            {new Date(message.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {messageReports.length > itemsPerPage && (
                <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                    {Math.min(
                      currentPage * itemsPerPage,
                      messageReports.length
                    )}{" "}
                    of {messageReports.length} messages
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 text-sm">
                      Page {currentPage} of{" "}
                      {Math.ceil(messageReports.length / itemsPerPage)}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentPage((prev) =>
                          Math.min(
                            prev + 1,
                            Math.ceil(messageReports.length / itemsPerPage)
                          )
                        )
                      }
                      disabled={
                        currentPage ===
                        Math.ceil(messageReports.length / itemsPerPage)
                      }
                      className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {showAddMoney && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-96">
              <h3 className="text-lg font-semibold mb-4">
                Add Money to Wallet
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount
                  </label>
                  <input
                    type="number"
                    value={addAmount}
                    onChange={(e) => setAddAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[100, 500, 1000].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setAddAmount(amount.toString())}
                      className="px-3 py-2 border border-purple-200 text-purple-600 rounded-lg hover:bg-purple-50"
                    >
                      ₹{amount}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowAddMoney(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddMoney}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Add Money
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
