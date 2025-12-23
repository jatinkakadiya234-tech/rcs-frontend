// import { useState, useEffect } from "react";
// import api from "../services/api";
// import { useAuth } from "../context/AuthContext";
// import toast from "react-hot-toast";
// import { FiCreditCard, FiPlus, FiRefreshCw } from "react-icons/fi";

// export default function Dashboard() {
//   const { user, refreshUser } = useAuth();
//   const [messageReports, setMessageReports] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage] = useState(5);
//   const [walletBalance, setWalletBalance] = useState(0);
//   const [refreshing, setRefreshing] = useState(false);
//   const [addAmount, setAddAmount] = useState("");
//   const [showAddMoney, setShowAddMoney] = useState(false);
//   const [stats, setStats] = useState({
//     totalMessages: 0,
//     sentMessages: 0,
//     pendingMessages: 0,
//     failedMessages: 0,
//     totalTemplates: 0,
//   });



//   useEffect(() => {
//     if (user?._id) {
//       fetchMessageReports();
//     }
//   }, [user]);

//   const fetchMessageReports = async () => {
//     try {
//       setLoading(true);
//       const [reportsData, statsData] = await Promise.all([
//         api.getrecentorders(user._id),
//         api.getMessageStats(user._id),
//       ]);
//       toast.success("Dashboard data loaded successfully");

//       const messages = reportsData.data || [];
//       setMessageReports(messages);
     
//       setStats({
//         totalMessages: statsData.data?.totalMessages || 0,
//         sentMessages: statsData.data?.sentMessages || 0,
//         pendingMessages: statsData.data?.pendingMessages || 0,
//         failedMessages: statsData.data?.failedMessages || 0,
//         totalTemplates: statsData?.data?.sendtoteltemplet || 0,
//       });
//     } catch (err) {
//       console.error("Error fetching data:", err);
//       toast.error("Failed to fetch dashboard data");
//     } finally {
//       setLoading(false);
//     }
//   };
//   const handleAddMoney = async () => {
//     if (addAmount && parseFloat(addAmount) > 0) {
//       try {
//         const data = await apiService.addWalletRequest({
//           amount: parseFloat(addAmount),
//           userId: user._id,
//         });

//         if (data.success) {
//           setResultData({
//             success: true,
//             message: `Wallet recharge request of ₹${addAmount} submitted for admin approval!`,
//           });
//           setAddAmount("");
//           setShowAddMoney(false);
//           refreshUser();
//         } else {
//           setResultData({
//             success: false,
//             message: "Failed to submit request: " + data.message,
//           });
//         }
//         setShowResultModal(true);
//       } catch (error) {
//         setResultData({
//           success: false,
//           message: "Error submitting request: " + error.message,
//         });
//         setShowResultModal(true);
//       }
//     }
//   };

//   return (
//     <div className="w-full overflow-hidden">
//       {/* Stats Cards */}

//       <h1 className="text-2xl ms-5 uppercase">Welcome to {user.companyname}</h1>
//       <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white w-full mt-7">
//         <div className="flex items-center justify-between mb-4">
//           <div className="flex items-center gap-3">
//             <FiCreditCard className="text-2xl" />
//             <h3 className="text-xl font-semibold">Wallet Credits</h3>
//           </div>
//           <div className="flex gap-2">
//             <button
//               onClick={async () => {
//                 setRefreshing(true);
//                 await refreshUser();
//                 setRefreshing(false);
//               }}
//               disabled={refreshing}
//               className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
//             >
//               <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
//               {refreshing ? "Refreshing..." : "Refresh"}
//             </button>
//             <button
//               onClick={() => setShowAddMoney(true)}
//               className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
//             >
//               <FiPlus /> Add Money
//             </button>
//           </div>
//         </div>

//         <div className="text-3xl font-bold mb-2">
//           ₹{user?.Wallet?.toFixed(2) || "0.00"}
//         </div>
//         <p className="text-purple-100">Available Credits</p>
//       </div>
//       <div className="p-2 sm:p-3 md:p-4 lg:p-6">
//         <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
//           <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
//             <p className="text-xs text-gray-500 mb-2">Devices</p>
//             <div className="flex items-center gap-2">
//               <span className="text-2xl">📱</span>
//               <span className="text-2xl font-bold text-gray-900">
//                 {loading ? "..." : "1"}
//               </span>
//             </div>
//           </div>

//           <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
//             <p className="text-xs text-gray-500 mb-2">Welcome Message</p>
//             <div className="flex items-center gap-2">
//               <span className="text-2xl">😊</span>
//               <span className="text-2xl font-bold text-gray-900">
//                 {loading ? "..." : "0"}
//               </span>
//             </div>
//           </div>

//           <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
//             <p className="text-xs text-gray-500 mb-2">Templates</p>
//             <div className="flex items-center gap-2">
//               <span className="text-2xl">📄</span>
//               <span className="text-2xl font-bold text-gray-900">
//                 {loading ? "..." : stats.totalTemplates}
//               </span>
//             </div>
//           </div>

//           <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
//             <p className="text-xs text-gray-500 mb-2">Total Campaigns</p>
//             <div className="flex items-center gap-2">
//               <span className="text-2xl">💬</span>
//               <span className="text-2xl font-bold text-gray-900">
//                 {loading ? "..." : stats.totalMessages}
//               </span>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="px-2 sm:px-3 md:px-4 lg:px-6">
//         {/* Stats Grid */}
//         <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
//           <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
//             <div className="flex items-center justify-between mb-2">
//               <span className="text-3xl font-bold text-gray-900">
//                 {loading ? "..." : stats.totalMessages}
//               </span>
//               <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
//                 <div className="w-3 h-3 rounded-full bg-blue-500"></div>
//               </div>
//             </div>
//             <p className="text-sm text-gray-600">Total Messages</p>
//           </div>

//           <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
//             <div className="flex items-center justify-between mb-2">
//               <span className="text-3xl font-bold text-gray-900">
//                 {loading ? "..." : stats.pendingMessages}
//               </span>
//               <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
//                 <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
//               </div>
//             </div>
//             <p className="text-sm text-gray-600">Pending Messages</p>
//           </div>
//           <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
//             <div className="flex items-center justify-between mb-2">
//               <span className="text-3xl font-bold text-gray-900">
//                 {loading ? "..." : stats.sentMessages}
//               </span>
//               <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
//                 <div className="w-3 h-3 rounded-full bg-green-500"></div>
//               </div>
//             </div>
//             <p className="text-sm text-gray-600">Message Sent</p>
//           </div>

//           <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
//             <div className="flex items-center justify-between mb-2">
//               <span className="text-3xl font-bold text-gray-900">
//                 {loading ? "..." : stats.failedMessages}
//               </span>
//               <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
//                 <div className="w-3 h-3 rounded-full bg-red-500"></div>
//               </div>
//             </div>
//             <p className="text-sm text-gray-600">Failed Messages</p>
//           </div>
//         </div>

//         {/* Recent Messages Section */}
//         <div className="bg-white rounded-xl shadow-sm p-6">
//           <h2 className="text-xl font-bold text-gray-900 mb-4">
//             Today's Orders
//           </h2>
//           {loading ? (
//             <div className="flex justify-center py-8">
//               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
//             </div>
//           ) : messageReports.length === 0 ? (
//             <p className="text-gray-500 text-center py-8">
//               No recent messages found
//             </p>
//           ) : (
//             <div className="border border-gray-200 rounded-lg overflow-hidden">
//               <div className="overflow-x-auto">
//                 <table className="w-full">
//                   <thead className="bg-gray-50">
//                     <tr>
//                       <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
//                         ID
//                       </th>
//                       <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
//                         Type
//                       </th>
//                       <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
//                         Recipients
//                       </th>
//                       <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
//                         Success/Failed
//                       </th>
//                       <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
//                         Status
//                       </th>
//                       <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
//                         Date
//                       </th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {messageReports
//                       .slice(
//                         (currentPage - 1) * itemsPerPage,
//                         currentPage * itemsPerPage
//                       )
//                       .map((message, idx) => (
//                         <tr
//                           key={message._id}
//                           className="border-t hover:bg-gray-50"
//                         >
//                           <td className="py-3 px-4 text-sm">
//                             #{(currentPage - 1) * itemsPerPage + idx + 1}
//                           </td>
//                           <td className="py-3 px-4 text-sm">
//                             <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full capitalize">
//                               {message.type}
//                             </span>
//                           </td>
//                           <td className="py-3 px-4 text-sm">
//                             {message.phoneNumbers?.length || 0}
//                           </td>
//                           <td className="py-3 px-4 text-sm">
//                             <span className="text-green-600">
//                               {message.status === "sent"
//                                 ? message.successCount
//                                 : 0}
//                             </span>
//                             <span className="text-gray-400 mx-1">/</span>
//                             <span className="text-red-600">
//                               {message.failedCount || 0}
//                             </span>
//                           </td>
//                           <td className="py-3 px-4 text-sm">
//                             <span
//                               className={`px-2 py-1 rounded-full text-xs font-medium ${
//                                 message.status === "sent"
//                                   ? "bg-green-100 text-green-800"
//                                   : "bg-red-100 text-red-800"
//                               }`}
//                             >
//                               {message.status}
//                             </span>
//                           </td>
//                           <td className="py-3 px-4 text-sm text-gray-500">
//                             {new Date(message.createdAt).toLocaleDateString()}
//                           </td>
//                         </tr>
//                       ))}
//                   </tbody>
//                 </table>
//               </div>

//               {messageReports.length > itemsPerPage && (
//                 <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between">
//                   <div className="text-sm text-gray-700">
//                     Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
//                     {Math.min(
//                       currentPage * itemsPerPage,
//                       messageReports.length
//                     )}{" "}
//                     of {messageReports.length} messages
//                   </div>
//                   <div className="flex gap-2">
//                     <button
//                       onClick={() =>
//                         setCurrentPage((prev) => Math.max(prev - 1, 1))
//                       }
//                       disabled={currentPage === 1}
//                       className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
//                     >
//                       Previous
//                     </button>
//                     <span className="px-3 py-1 text-sm">
//                       Page {currentPage} of{" "}
//                       {Math.ceil(messageReports.length / itemsPerPage)}
//                     </span>
//                     <button
//                       onClick={() =>
//                         setCurrentPage((prev) =>
//                           Math.min(
//                             prev + 1,
//                             Math.ceil(messageReports.length / itemsPerPage)
//                           )
//                         )
//                       }
//                       disabled={
//                         currentPage ===
//                         Math.ceil(messageReports.length / itemsPerPage)
//                       }
//                       className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
//                     >
//                       Next
//                     </button>
//                   </div>
//                 </div>
//               )}
//             </div>
//           )}
//         </div>

//         {showAddMoney && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//             <div className="bg-white rounded-xl p-6 w-96">
//               <h3 className="text-lg font-semibold mb-4">
//                 Add Money to Wallet
//               </h3>

//               <div className="space-y-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Amount
//                   </label>
//                   <input
//                     type="number"
//                     value={addAmount}
//                     onChange={(e) => setAddAmount(e.target.value)}
//                     placeholder="Enter amount"
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
//                   />
//                 </div>

//                 <div className="grid grid-cols-3 gap-2">
//                   {[100, 500, 1000].map((amount) => (
//                     <button
//                       key={amount}
//                       onClick={() => setAddAmount(amount.toString())}
//                       className="px-3 py-2 border border-purple-200 text-purple-600 rounded-lg hover:bg-purple-50"
//                     >
//                       ₹{amount}
//                     </button>
//                   ))}
//                 </div>

//                 <div className="flex gap-3 pt-4">
//                   <button
//                     onClick={() => setShowAddMoney(false)}
//                     className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     onClick={handleAddMoney}
//                     className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
//                   >
//                     Add Money
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }




"use client"

import { useState, useEffect } from "react"
import api from "../services/api"
import { useAuth } from "../context/AuthContext"
import toast from "react-hot-toast"
import {
  FiCreditCard,
  FiPlus,
  FiRefreshCw,
  FiTrendingUp,
  FiMessageSquare,
  FiSend,
  FiAlertCircle,
  FiClock,
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi"

export default function Dashboard() {
  const { user, refreshUser } = useAuth()
  const [messageReports, setMessageReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)
  const [walletBalance, setWalletBalance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [addAmount, setAddAmount] = useState("")
  const [showAddMoney, setShowAddMoney] = useState(false)
  const [stats, setStats] = useState({
    totalMessages: 0,
    sentMessages: 0,
    pendingMessages: 0,
    failedMessages: 0,
    totalTemplates: 0,
  })

  useEffect(() => {
    if (user?._id) {
      fetchMessageReports()
    }
  }, [user])

  const fetchMessageReports = async () => {
    try {
      setLoading(true)
      const [reportsData, statsData] = await Promise.all([api.getrecentorders(user._id), api.getMessageStats(user._id)])
      toast.success("Dashboard data loaded successfully")

      const messages = reportsData.data || []
      setMessageReports(messages)

      setStats({
        totalMessages: statsData.data?.totalMessages || 0,
        sentMessages:messages.length || 0,
        pendingMessages: statsData.data?.pendingMessages || 0,
        failedMessages: statsData.data?.failedMessages || 0,
        totalTemplates: statsData?.data?.sendtoteltemplet || 0,
      })
    } catch (err) {
      console.error("Error fetching data:", err)
      toast.error("Failed to fetch dashboard data")
    } finally {
      setLoading(false)
    }
  }

  const handleAddMoney = async () => {
    if (addAmount && Number.parseFloat(addAmount) > 0) {
      try {
        const data = await api.addWalletRequest({
          amount: Number.parseFloat(addAmount),
          userId: user._id,
        })

        if (data.success) {
          toast.success(`Wallet recharge request of ₹${addAmount} submitted for admin approval!`)
          setAddAmount("")
          setShowAddMoney(false)
          refreshUser()
        } else {
          toast.error("Failed to submit request: " + data.message)
        }
      } catch (error) {
        toast.error("Error submitting request: " + error.message)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Welcome back, {user?.companyname}
          </h1>
          <p className="text-slate-600">Here's what's happening with your messaging campaigns today.</p>
        </div>

        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24 blur-3xl"></div>

          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <FiCreditCard className="text-2xl" />
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Available Balance</p>
                  <h3 className="text-2xl font-bold">Wallet Credits</h3>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    setRefreshing(true)
                    await refreshUser()
                    setRefreshing(false)
                  }}
                  disabled={refreshing}
                  className="bg-white/20 backdrop-blur-sm hover:bg-white/30 px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-200 disabled:opacity-50 border border-white/20"
                >
                  <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
                  <span className="hidden sm:inline">{refreshing ? "Refreshing..." : "Refresh"}</span>
                </button>
                <button
                  onClick={() => setShowAddMoney(true)}
                  className="bg-white text-blue-600 hover:bg-blue-50 px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-200 font-semibold shadow-lg"
                >
                  <FiPlus className="text-lg" />
                  <span className="hidden sm:inline">Add Money</span>
                </button>
              </div>
            </div>

            <div className="text-5xl font-bold mb-2">₹{user?.Wallet?.toFixed(2) || "0.00"}</div>
            <div className="flex items-center gap-2 text-blue-100">
              <FiTrendingUp className="text-lg" />
              <span>Ready to use for campaigns</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📱</span>
              </div>
              <FiTrendingUp className="text-blue-600" />
            </div>
            <p className="text-slate-600 text-sm mb-1">Connected Devices</p>
            <p className="text-3xl font-bold text-slate-900">{loading ? "..." : "1"}</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">👋</span>
              </div>
              <FiMessageSquare className="text-emerald-600" />
            </div>
            <p className="text-slate-600 text-sm mb-1">Welcome Messages</p>
            <p className="text-3xl font-bold text-slate-900">{loading ? "..." : "0"}</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📄</span>
              </div>
              <FiSend className="text-purple-600" />
            </div>
            <p className="text-slate-600 text-sm mb-1">Active Templates</p>
            <p className="text-3xl font-bold text-slate-900">{loading ? "..." : stats.totalTemplates}</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <FiMessageSquare className="text-amber-600" />
            </div>
            <p className="text-slate-600 text-sm mb-1">Total Campaigns</p>
            <p className="text-3xl font-bold text-slate-900">{loading ? "..." : stats.totalMessages}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-blue-500 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FiMessageSquare className="text-blue-600 text-xl" />
              </div>
              <span className="text-3xl font-bold text-slate-900">{loading ? "..." : stats.totalMessages}</span>
            </div>
            <p className="text-slate-600 font-medium">Total Messages</p>
            <p className="text-xs text-slate-500 mt-1">All time statistics</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-amber-500 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <FiClock className="text-amber-600 text-xl" />
              </div>
              <span className="text-3xl font-bold text-slate-900">{loading ? "..." : stats.pendingMessages}</span>
            </div>
            <p className="text-slate-600 font-medium">Pending Messages</p>
            <p className="text-xs text-slate-500 mt-1">In queue</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-emerald-500 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <FiCheckCircle className="text-emerald-600 text-xl" />
              </div>
              <span className="text-3xl font-bold text-slate-900">{loading ? "..." : stats.sentMessages}</span>
            </div>
            <p className="text-slate-600 font-medium">Messages Sent</p>
            <p className="text-xs text-slate-500 mt-1">Successfully delivered</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-rose-500 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center">
                <FiXCircle className="text-rose-600 text-xl" />
              </div>
              <span className="text-3xl font-bold text-slate-900">{loading ? "..." : stats.failedMessages}</span>
            </div>
            <p className="text-slate-600 font-medium">Failed Messages</p>
            <p className="text-xs text-slate-500 mt-1">Needs attention</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-1">Today's Orders</h2>
                <p className="text-slate-600">Recent messaging campaigns and their status</p>
              </div>
              <button
                onClick={fetchMessageReports}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
              >
                <FiRefreshCw className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
              <p className="text-slate-600">Loading campaign data...</p>
            </div>
          ) : messageReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <FiMessageSquare className="text-4xl text-slate-400" />
              </div>
              <p className="text-slate-600 text-lg font-medium">No recent messages found</p>
              <p className="text-slate-500 text-sm">Your campaigns will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Order ID</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Type</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Recipients</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Success/Failed</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Status</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {messageReports
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((message, idx) => (
                      <tr key={message._id} className="hover:bg-slate-50 transition-colors duration-150">
                        <td className="py-4 px-6">
                          <span className="font-mono text-sm font-medium text-slate-900">
                            #{(currentPage - 1) * itemsPerPage + idx + 1}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg capitalize inline-flex items-center gap-1.5">
                            <FiSend className="text-xs" />
                            {message.type}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                              <span className="text-purple-600 text-xs font-bold">
                                {message?.cost || 0}
                              </span>
                            </div>
                            <span className="text-slate-600 text-sm">contacts</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                              <FiCheckCircle className="text-sm" />
                              { message?.successCount || 0}
                            </span>
                            <span className="text-slate-400">/</span>
                            <span className="flex items-center gap-1.5 text-rose-600 font-semibold">
                              <FiXCircle className="text-sm" />
                              {message?.failedCount || 0}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 ${
                              message?.successCount >= message?.failedCount
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-rose-100 text-rose-700"
                            }`}
                          >
                           { message?.successCount >= message?.failedCount ? <FiCheckCircle /> : <FiAlertCircle />}
                            {message.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-slate-600 text-sm">
                          {new Date(message.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>

              {messageReports.length > itemsPerPage && (
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-slate-600">
                    Showing <span className="font-semibold text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span>{" "}
                    to{" "}
                    <span className="font-semibold text-slate-900">
                      {Math.min(currentPage * itemsPerPage, messageReports.length)}
                    </span>{" "}
                    of <span className="font-semibold text-slate-900">{messageReports.length}</span> messages
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors duration-200"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-2 text-sm font-medium text-slate-700">
                      Page {currentPage} of {Math.ceil(messageReports.length / itemsPerPage)}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(messageReports.length / itemsPerPage)))
                      }
                      disabled={currentPage === Math.ceil(messageReports.length / itemsPerPage)}
                      className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors duration-200"
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-2xl font-bold text-slate-900">Add Money to Wallet</h3>
                <p className="text-slate-600 text-sm mt-1">Choose an amount or enter a custom value</p>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Amount (₹)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">₹</span>
                    <input
                      type="number"
                      value={addAmount}
                      onChange={(e) => setAddAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-3">Quick Select</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[100, 500, 1000].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setAddAmount(amount.toString())}
                        className="px-4 py-3 border-2 border-blue-200 text-blue-600 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 font-semibold"
                      >
                        ₹{amount}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowAddMoney(false)}
                    className="flex-1 px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all duration-200 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddMoney}
                    disabled={!addAmount || Number.parseFloat(addAmount) <= 0}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
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
  )
}
