import { useState, useEffect, useMemo } from "react";
import {
  FaEye,
  FaDownload,
  FaTrash,
  FaSearch,
  FaFilter,
  FaChartLine,
} from "react-icons/fa";
import { BiRefresh } from "react-icons/bi";
import * as XLSX from "xlsx";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { useOrders, useOrderDetails, useDeleteOrder } from "../hooks/useOrders";

export default function Orders() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalCurrentPage, setModalCurrentPage] = useState(1);

  // React Query hooks
  const {
    data: ordersData,
    isLoading,
    error,
    refetch,
  } = useOrders(user?._id, currentPage, 10);
  const deleteOrderMutation = useDeleteOrder();

  const orders = ordersData?.data || [];
  const pagination = ordersData?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  };
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [sortOrder, setSortOrder] = useState("desc");
  const [filteredOrders, setFilteredOrders] = useState([]);

  useEffect(() => {
    if (orders.length > 0) {
      filterAndSortOrders();
    }
  }, [
    orders,
    searchTerm,
    statusFilter,
    typeFilter,
    campaignFilter,
    dateRange,
    sortOrder,
  ]);

  const filterAndSortOrders = () => {
    let filtered = [...orders];

    // Search filter
    if (searchTerm) {
      filtered = filtered?.filter(
        (order) =>
          order?.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order?.phoneNumbers?.some((phone) => phone.includes(searchTerm)) ||
          order?._id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered?.filter((order) => {
        if (statusFilter === "success") {
          return order.results?.some((r) => r.status === 201);
        } else if (statusFilter === "failed") {
          return order.results?.some((r) => r.error || r.status !== 201);
        } else if (statusFilter === "pending") {
          return !order.results || order.results.length === 0;
        }
        return true;
      });
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((order) => order.type === typeFilter);
    }

    // Date range filter
    if (dateRange.start) {
      filtered = filtered?.filter(
        (order) => new Date(order.createdAt) >= new Date(dateRange.start)
      );
    }
    if (dateRange.end) {
      filtered = filtered?.filter(
        (order) =>
          new Date(order.createdAt) <= new Date(dateRange.end + "T23:59:59")
      );
    }

    // Campaign filter
    if (campaignFilter !== "all") {
      filtered = filtered?.filter(
        (order) => order?.CampaignName === campaignFilter
      );
    }

    // Sort by date
    filtered?.sort((a, b) => {
      const aValue = new Date(a.createdAt);
      const bValue = new Date(b.createdAt);

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredOrders(filtered);

    // Update stats for filtered data
    const totalOrders = filtered.length;
    const successfulOrders = filtered?.filter((order) =>
      order.results?.some(
        (r) =>
          r.messaestatus === "MESSAGE_DELIVERED" ||
          r.messaestatus === "SEND_MESSAGE_SUCCESS" ||
          r.messaestatus === "MESSAGE_READ"
      )
    ).length;
    const failedOrders = filtered.filter((order) =>
      order.results?.some(
        (r) => r.error || r.messaestatus === "SEND_MESSAGE_FAILURE"
      )
    ).length;
    const totalRecipients = filtered.reduce(
      (sum, order) => sum + (order.phoneNumbers?.length || 0),
      0
    );
  };

  const getUniqueTypes = () => {
    return [...new Set(orders?.map((order) => order.type).filter(Boolean))];
  };

  const getUniqueCampaigns = () => {
    return [
      ...new Set(orders.map((order) => order.CampaignName).filter(Boolean)),
    ];
  };

  const getStatusBadge = (order) => {
    if (order.successCount > order.failedCount) {
      return (
        <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full font-medium">
          Success
        </span>
      );
    }
    if (order.failedCount > 0) {
      return (
        <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full font-medium">
          Failed
        </span>
      )
    }

    const successCount = order?.results?.filter(
      (r) =>
        r.messaestatus === "MESSAGE_DELIVERED" ||
        r.messaestatus === "SEND_MESSAGE_SUCCESS" ||
        r.messaestatus === "MESSAGE_READ"
    ).length;

    const failedCount = order?.results.filter(
      (r) =>
        r.error || r.messaestatus === "SEND_MESSAGE_FAILURE" || r.status === 500
    ).length;

    const totalResults = order.results.length;

    // All successful
    if (successCount === totalResults && failedCount === 0) {
      return (
        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
          Success
        </span>
      );
    }
    // All failed
    else if (failedCount === totalResults && successCount === 0) {
      return (
        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">
          Failed
        </span>
      );
    }
    // Mixed results
    else if (successCount > 0 || failedCount > 0) {
      return (
        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
          Success
        </span>
      );
    }

    return (
      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
        Pending
      </span>
    );
  };

  // Get order details when modal opens
  const { data: orderDetailsData, isLoading: detailsLoading } = useOrderDetails(
    selectedOrder?._id,
    modalCurrentPage,
    50
  );

  // Use orderDetailsData for modal display, fallback to selectedOrder
  const modalOrder = orderDetailsData?.data || selectedOrder;

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setModalCurrentPage(1);
    setShowModal(true);
  };

  const loadModalPage = (page) => {
    setModalCurrentPage(page);
  };

  const computeSelectedOrderMetrics = (order) => {
    if (!order || !order.results) {
      return {
        clicked: 0,
        replied: 0,
        contentCounts: {},
        pendingcount: 0,
        failedcont: 0,
      };
    }

    let clicked = 0;
    let replied = 0;

    const contentCounts = {};
    const userClickMap = {}; // { userId: totalClicks }

    // STEP 1️⃣ : collect user clicks
    order.results.forEach((r) => {
      if (r.entityType !== "USER_MESSAGE") return;

      const userId = r.phone || r.from || r.msisdn;
      if (!userId) return;

      if (!userClickMap[userId]) {
        userClickMap[userId] = 0;
      }

      const suggestions = r.suggestionResponse || [];

      suggestions.forEach((s) => {
        const key = s.plainText || "unknown";
        contentCounts[key] = (contentCounts[key] || 0) + 1;

        userClickMap[userId] += 1;
      });
    });

    // STEP 2️⃣ : apply rules
    Object.values(userClickMap).forEach((clickCount) => {
      if (clickCount >= 1) {
        clicked += 1; // 👈 first click of each user
      }
      if (clickCount > 1) {
        replied += clickCount - 1; // 👈 repeat clicks
      }
    });

    // STEP 3️⃣ : delivery stats
    const successcont = order.results.filter(
      (r) =>
        r.messaestatus === "MESSAGE_DELIVERED" ||
        r.messaestatus === "SEND_MESSAGE_SUCCESS" ||
        r.messaestatus === "MESSAGE_READ" ||
        r.status === 201
    ).length;

    const failedcont = order.results.filter(
      (r) =>
        r.messaestatus === "SEND_MESSAGE_FAILURE" ||
        r.status === 500 ||
        r.error === true
    ).length;

    const totalcount = order.results.length;
    const pendingcount = totalcount - (successcont + failedcont);
    return {
      clicked,
      replied,
      contentCounts,
      pendingcount,
      failedcont,
    };
  };

  const {
    clicked: modalClickedCount,
    replied: modalRepliedCount,
    pendingcount: modalPanddingCount,
    failedcont: modelFildCount,
  } = computeSelectedOrderMetrics(modalOrder);

  const closeModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
  };

  const deleteOrder = async (orderId) => {
    if (
      window.confirm("Are you sure you want to delete this message report?")
    ) {
      try {
        await deleteOrderMutation.mutateAsync(orderId);
        toast.success("Order deleted successfully");
      } catch (err) {
        console.error("Error deleting order:", err);
        toast.error("Failed to delete message report");
      }
    }
  };

  const exportToExcel = () => {
    try {
      if (!filteredOrders || filteredOrders?.length === 0) {
        toast.error("No data to export");
        return;
      }

      const exportData = filteredOrders?.map((order, idx) => {
        const results = order?.results || [];

        // ✅ Success count
        const successCount = results.filter(
          (r) =>
            r?.messaestatus === "MESSAGE_DELIVERED" ||
            r?.messaestatus === "SEND_MESSAGE_SUCCESS" ||
            r?.messaestatus === "MESSAGE_READ"
        ).length;

        // ❌ Failed count
        const failedCount = results?.filter(
          (r) =>
            r?.messaestatus === "SEND_MESSAGE_FAILURE" ||
            r?.status === 500 ||
            r?.error === true
        ).length;

        // ⏳ Pending count
        const pendingCount =
          results?.length > 0
            ? results?.length - (successCount + failedCount)
            : 0;

        // 📌 Final Status
        let finalStatus = "Pending";
        if (successCount > 0 && failedCount === 0) finalStatus = "Success";
        else if (failedCount > 0) finalStatus = "Failed";

        return {
          ID: `#${idx + 1}`,
          CampaignName: order?.CampaignName || "N/A",
          MessageType: order?.type || "N/A",
          TotalRecipients: order?.phoneNumbers?.length || 0,
          Successful: successCount,
          Failed: failedCount,
          Pending: pendingCount,
          Status: finalStatus,
          CreatedDate: order?.createdAt
            ? new Date(order.createdAt).toLocaleDateString()
            : "N/A",
          CreatedTime: order?.createdAt
            ? new Date(order.createdAt).toLocaleTimeString()
            : "N/A",
        };
      });

      // 📄 Create Excel
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Orders Report");

      // 💾 Save file
      XLSX.writeFile(
        workbook,
        `orders-report-${new Date().toISOString().split("T")[0]}.xlsx`
      );

      toast.success("Report exported successfully");
    } catch (error) {
      console.error("Excel export error:", error);
      toast.error("Failed to export report");
    }
  };

  return (
    // <div className="max-w-7xl mx-auto">
    //   <div className="bg-white rounded-xl shadow-sm p-6">
    //     {/* Header */}
    //     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
    //       <div>
    //         <h1 className="text-2xl font-bold text-gray-900">
    //           Campaign Orders
    //         </h1>
    //         <p className="text-gray-600 text-sm mt-1">
    //           Manage and track all your message campaigns
    //         </p>
    //       </div>
    //       <div className="flex gap-2">
    //         <button
    //           onClick={exportToExcel}
    //           className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
    //         >
    //           <FaDownload />
    //           Export
    //         </button>
    //         <button
    //           onClick={() => refetch()}
    //           className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
    //         >
    //           <BiRefresh className={isLoading ? "animate-spin" : ""} />
    //           Refresh
    //         </button>
    //       </div>
    //     </div>

    //     {/* Stats Cards */}
    //     {orders.length > 0 && (
    //       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    //         <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-lg text-white">
    //           <div className="flex items-center justify-between">
    //             <div>
    //               <h3 className="text-sm font-medium opacity-90">
    //                 Total Orders
    //               </h3>
    //               <p className="text-2xl font-bold">{orders.length}</p>
    //             </div>
    //             <FaChartLine className="text-2xl opacity-80" />
    //           </div>
    //         </div>

    //         <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-lg text-white">
    //           <div className="flex items-center justify-between">
    //             <div>
    //               <h3 className="text-sm font-medium opacity-90">Successful</h3>
    //               <p className="text-2xl font-bold">
    //                 {
    //                   orders?.filter((order) =>
    //                     order?.results?.some(
    //                       (r) =>
    //                         r.messaestatus === "MESSAGE_DELIVERED" ||
    //                         r.messaestatus === "SEND_MESSAGE_SUCCESS" ||
    //                         r.messaestatus === "MESSAGE_READ"
    //                     )
    //                   ).length
    //                 }
    //               </p>
    //             </div>
    //             <div className="text-2xl opacity-80">✓</div>
    //           </div>
    //         </div>

    //         <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 rounded-lg text-white">
    //           <div className="flex items-center justify-between">
    //             <div>
    //               <h3 className="text-sm font-medium opacity-90">Failed</h3>
    //               <p className="text-2xl font-bold">
    //                 {
    //                   orders?.filter((order) =>
    //                     order?.results?.some(
    //                       (r) =>
    //                         r.error || r.messaestatus === "SEND_MESSAGE_FAILURE"
    //                     )
    //                   ).length
    //                 }
    //               </p>
    //             </div>
    //             <div className="text-2xl opacity-80">✕</div>
    //           </div>
    //         </div>

    //         <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 rounded-lg text-white">
    //           <div className="flex items-center justify-between">
    //             <div>
    //               <h3 className="text-sm font-medium opacity-90">
    //                 Success Rate
    //               </h3>
    //               <p className="text-2xl font-bold">
    //                 {orders.length > 0
    //                   ? (
    //                       (orders.filter((order) =>
    //                         order.results?.some(
    //                           (r) =>
    //                             r.messaestatus === "MESSAGE_DELIVERED" ||
    //                             r.messaestatus === "SEND_MESSAGE_SUCCESS" ||
    //                             r.messaestatus === "MESSAGE_READ"
    //                         )
    //                       ).length /
    //                         orders.length) *
    //                       100
    //                     ).toFixed(1)
    //                   : 0}
    //                 %
    //               </p>
    //             </div>
    //             <div className="text-2xl opacity-80">📊</div>
    //           </div>
    //         </div>
    //       </div>
    //     )}

    //     {/* Filters */}
    //     <div className="bg-gray-50 p-4 rounded-lg mb-6">
    //       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
    //         {/* Search */}
    //         <div className="relative">
    //           <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
    //           <input
    //             type="text"
    //             placeholder="Search orders..."
    //             value={searchTerm}
    //             onChange={(e) => setSearchTerm(e.target.value)}
    //             className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
    //           />
    //         </div>

    //         {/* Status Filter */}
    //         <select
    //           value={statusFilter}
    //           onChange={(e) => setStatusFilter(e.target.value)}
    //           className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
    //         >
    //           <option value="all">All Status</option>
    //           <option value="success">Success</option>
    //           <option value="failed">Failed</option>
    //           <option value="pending">Pending</option>
    //         </select>

    //         {/* Type Filter */}
    //         <select
    //           value={typeFilter}
    //           onChange={(e) => setTypeFilter(e.target.value)}
    //           className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
    //         >
    //           <option value="all">All Types</option>
    //           {getUniqueTypes().map((type) => (
    //             <option key={type} value={type}>
    //               {type}
    //             </option>
    //           ))}
    //         </select>

    //         {/* Campaign Filter */}
    //         <select
    //           value={campaignFilter}
    //           onChange={(e) => {
    //             setCampaignFilter(e.target.value);
    //             if (e.target.value !== "all") {
    //               const campaignData = orders.filter(
    //                 (order) => order.CampaignName === e.target.value
    //               );
    //               toast.success(`Showing campaign: ${e.target.value}`);
    //               setCampaignData(campaignData);
    //             } else {
    //               toast.success("Showing all campaigns");
    //               console.log("Showing all campaigns");
    //             }
    //           }}
    //           className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
    //         >
    //           <option value="all">All Campaigns</option>
    //           {getUniqueCampaigns().map((campaign) => (
    //             <option key={campaign} value={campaign}>
    //               {campaign}
    //             </option>
    //           ))}
    //         </select>

    //         {/* Date Range */}
    //         <input
    //           type="date"
    //           value={dateRange.start}
    //           onChange={(e) =>
    //             setDateRange((prev) => ({ ...prev, start: e.target.value }))
    //           }
    //           className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
    //         />

    //         <input
    //           type="date"
    //           value={dateRange.end}
    //           onChange={(e) =>
    //             setDateRange((prev) => ({ ...prev, end: e.target.value }))
    //           }
    //           className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
    //         />
    //       </div>

    //       <div className="flex items-center gap-2 mt-4">
    //         <button
    //           onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
    //           className="flex items-center gap-2 px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-100"
    //         >
    //           <FaFilter />
    //           {sortOrder === "asc" ? "Ascending" : "Descending"}
    //         </button>

    //         {campaignFilter !== "all" && (
    //           <div className="text-sm text-gray-600">
    //             Showing {filteredOrders.length} of {orders.length} orders
    //           </div>
    //         )}
    //       </div>
    //     </div>

    //     {isLoading ? (
    //       <div className="flex justify-center items-center py-12">
    //         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
    //       </div>
    //     ) : error ? (
    //       <div className="text-center py-12">
    //         <div className="text-red-600 mb-4">
    //           <svg
    //             className="w-16 h-16 mx-auto mb-4"
    //             fill="none"
    //             stroke="currentColor"
    //             viewBox="0 0 24 24"
    //           >
    //             <path
    //               strokeLinecap="round"
    //               strokeLinejoin="round"
    //               strokeWidth={2}
    //               d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    //             />
    //           </svg>
    //           <p className="text-lg font-semibold">{error}</p>
    //         </div>
    //         <button
    //           onClick={() => refetch()}
    //           className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
    //         >
    //           Try Again
    //         </button>
    //       </div>
    //     ) : (
    //       <div className="border border-gray-200 rounded-lg overflow-hidden">
    //         <div className="overflow-x-auto">
    //           <table className="w-full">
    //             <thead className="bg-gray-50">
    //               <tr>
    //                 <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
    //                   ID
    //                 </th>
    //                 <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
    //                   Campaign Name
    //                 </th>
    //                 <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
    //                   Message Type
    //                 </th>
    //                 <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
    //                   Recipients
    //                 </th>
    //                 <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
    //                   Success/Failed
    //                 </th>
    //                 <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
    //                   Status
    //                 </th>
    //                 <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
    //                   Date
    //                 </th>
    //                 <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
    //                   Actions
    //                 </th>
    //               </tr>
    //             </thead>
    //             <tbody>
    //               {filteredOrders.length === 0 ? (
    //                 <tr>
    //                   <td
    //                     colSpan="7"
    //                     className="text-center py-12 text-gray-500"
    //                   >
    //                     <div className="flex flex-col items-center">
    //                       <svg
    //                         className="w-16 h-16 text-gray-300 mb-4"
    //                         fill="none"
    //                         stroke="currentColor"
    //                         viewBox="0 0 24 24"
    //                       >
    //                         <path
    //                           strokeLinecap="round"
    //                           strokeLinejoin="round"
    //                           strokeWidth={2}
    //                           d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    //                         />
    //                       </svg>
    //                       <p className="text-lg font-medium">No orders found</p>
    //                       <p className="text-sm text-gray-400">
    //                         Try adjusting your filters or create a new campaign
    //                       </p>
    //                     </div>
    //                   </td>
    //                 </tr>
    //               ) : (
    //                 filteredOrders.map((order, idx) => {
    //                   // Debug: Check order structure

    //                   // Use pre-calculated counts from backend
    //                   const successCount = order.successCount || 0;
    //                   const failedCount = order.failedCount || 0;

    //                   return (
    //                     <tr
    //                       key={order._id || idx}
    //                       className="border-t hover:bg-gray-50 transition-colors"
    //                     >
    //                       <td className="py-3 px-4 text-sm font-mono">
    //                         #{(currentPage - 1) * 10 + idx + 1}
    //                       </td>
    //                       <td className="py-3 px-4 text-sm">
    //                         <span className="px-2 py-1 bg-blue-100 text-purple-600 text-xs rounded capitalize font-medium">
    //                           {order.CampaignName || "N/A"}
    //                         </span>
    //                       </td>
    //                       <td className="py-3 px-4 text-sm">
    //                         <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded capitalize font-medium">
    //                           {order.type || "N/A"}
    //                         </span>
    //                       </td>
    //                       <td className="py-3 px-4 text-sm font-semibold">
    //                         {order?.cost || 0}
    //                       </td>
    //                       <td className="py-3 px-4 text-sm">
    //                         <div className="flex items-center gap-2">
    //                           <span className="text-green-600 font-semibold">
    //                             {successCount}
    //                           </span>
    //                           <span className="text-gray-400">/</span>
    //                           <span className="text-red-600 font-semibold">
    //                             {failedCount}
    //                           </span>
    //                         </div>
    //                       </td>
    //                       <td className="py-3 px-4 text-sm">
    //                         {getStatusBadge(order)}
    //                       </td>
    //                       <td className="py-3 px-4 text-sm">
    //                         <div className="text-xs">
    //                           <div className="font-medium">
    //                             {new Date(order.createdAt).toLocaleDateString()}
    //                           </div>
    //                           <div className="text-gray-500">
    //                             {new Date(order.createdAt).toLocaleTimeString()}
    //                           </div>
    //                         </div>
    //                       </td>
    //                       <td className="py-3 px-4 text-sm">
    //                         <div className="flex gap-2">
    //                           <button
    //                             onClick={() => viewOrderDetails(order)}
    //                             className="text-purple-600 hover:text-purple-800 p-1 rounded hover:bg-purple-50 transition-colors"
    //                             title="View Details"
    //                           >
    //                             <FaEye />
    //                           </button>
    //                           <button
    //                             onClick={() => deleteOrder(order._id)}
    //                             className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
    //                             title="Delete Order"
    //                           >
    //                             <FaTrash />
    //                           </button>
    //                         </div>
    //                       </td>
    //                     </tr>
    //                   );
    //                 })
    //               )}
    //             </tbody>
    //           </table>
    //         </div>

    //         {pagination.total > 0 && (
    //           <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between">
    //             <div className="text-sm text-gray-700">
    //               Showing {(currentPage - 1) * pagination.limit + 1} to{" "}
    //               {Math.min(currentPage * pagination.limit, pagination.total)}{" "}
    //               of {pagination.total} orders
    //             </div>
    //             <div className="flex gap-2">
    //               <button
    //                 onClick={() => setCurrentPage(currentPage - 1)}
    //                 disabled={currentPage === 1}
    //                 className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
    //               >
    //                 Previous
    //               </button>
    //               <span className="px-3 py-1 text-sm bg-white border rounded">
    //                 Page {currentPage} of {pagination.pages}
    //               </span>
    //               <button
    //                 onClick={() => setCurrentPage(currentPage + 1)}
    //                 disabled={currentPage === pagination.pages}
    //                 className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
    //               >
    //                 Next
    //               </button>
    //             </div>
    //           </div>
    //         )}
    //       </div>
    //     )}
    //   </div>

    //   {/* Modal */}
    //   {showModal && selectedOrder && (
    //     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    //       <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
    //         {/* Modal Header */}
    //         <div className="flex items-center justify-between p-6 border-b">
    //           <h2 className="text-xl font-bold text-gray-900">
    //             Campaign Report - {selectedOrder.type}
    //           </h2>
    //           <button
    //             onClick={closeModal}
    //             className="text-gray-400 hover:text-gray-600"
    //           >
    //             <svg
    //               className="w-6 h-6"
    //               fill="none"
    //               stroke="currentColor"
    //               viewBox="0 0 24 24"
    //             >
    //               <path
    //                 strokeLinecap="round"
    //                 strokeLinejoin="round"
    //                 strokeWidth={2}
    //                 d="M6 18L18 6M6 6l12 12"
    //               />
    //             </svg>
    //           </button>
    //         </div>

    //         {/* Stats Cards */}
    //         <div className="p-6 border-b bg-gray-50">
    //           <div className="flex justify-center">
    //             <div className="grid grid-cols-8 gap-11 max-w-2xl">
    //               <div className="text-center">
    //                 <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-3">
    //                   <span className="text-blue-600 text-2xl">💬</span>
    //                 </div>
    //                 <div className="text-3xl font-bold text-gray-900 mb-1">
    //                   {modalOrder?.phoneNumbers?.length || 0}
    //                 </div>
    //                 <div className="text-sm text-gray-500 font-medium">
    //                   Total
    //                 </div>
    //               </div>

    //               <div className="text-center">
    //                 <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-3">
    //                   <span className="text-green-600 text-2xl">✓</span>
    //                 </div>
    //                 <div className="text-3xl font-bold text-gray-900 mb-1">
    //                   {modalOrder?.successCount ||
    //                     modalOrder?.results?.filter(
    //                       (r) =>
    //                         r.messaestatus === "MESSAGE_DELIVERED" ||
    //                         r.messaestatus === "SEND_MESSAGE_SUCCESS" ||
    //                         r.messaestatus === "MESSAGE_READ"
    //                     ).length ||
    //                     0}
    //                 </div>
    //                 <div className="text-sm text-gray-500 font-medium">
    //                   Sent
    //                 </div>
    //               </div>
    //               <div className="text-center">
    //                 <div className="flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mx-auto mb-3">
    //                   <span className="text-yellow-600 text-2xl">⏳</span>
    //                 </div>
    //                 <div className="text-3xl font-bold text-gray-900 mb-1">
    //                   {modalOrder?.results?.filter(
    //                     (r) => r.messaestatus === "MESSAGE_DELIVERED"
    //                   ).length || 0}
    //                 </div>
    //                 <div className="text-sm text-gray-500 font-medium">
    //                   Delivered
    //                 </div>
    //               </div>
    //               <div className="text-center">
    //                 <div className="flex items-center justify-center w-16 h-16 bg-blue-200 rounded-full mx-auto mb-3">
    //                   <span className="text-red-600 text-2xl mb-2">❗</span>
    //                 </div>
    //                 <div className="text-3xl font-bold text-gray-900 mb-1 ms-2">
    //                   {modalPanddingCount}
    //                 </div>
    //                 <div className="text-sm text-gray-500 font-medium ms-2">
    //                   Pending
    //                 </div>
    //               </div>
    //               <div className="text-center">
    //                 <div className="flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mx-auto mb-3">
    //                   <span className="text-red-600 text-2xl mb-2">👁️</span>
    //                 </div>
    //                 <div className="text-3xl font-bold text-gray-900 mb-1">
    //                   {modalOrder?.results?.filter(
    //                     (r) => r.messaestatus === "MESSAGE_READ"
    //                   ).length || 0}
    //                 </div>
    //                 <div className="text-sm text-gray-500 font-medium">
    //                   Read
    //                 </div>
    //               </div>
    //               <div className="text-center">
    //                 <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-3">
    //                   <span className="text-red-600 text-2xl v">⚠</span>
    //                 </div>
    //                 <div className="text-3xl font-bold text-gray-900 mb-1">
    //                   {modalOrder?.failedCount || modelFildCount}
    //                 </div>
    //                 <div className="text-sm text-gray-500 font-medium">
    //                   Failed
    //                 </div>
    //               </div>
    //               <div className="text-center">
    //                 <div className="flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mx-auto mb-3">
    //                   <span className="text-red-600 text-2xl ">👆</span>
    //                 </div>
    //                 <div className="text-3xl font-bold text-gray-900 mb-1 ms-4">
    //                   {modalClickedCount || 0}
    //                 </div>
    //                 <div className="text-sm text-gray-500 font-medium ms-4">
    //                   Clicked
    //                 </div>
    //               </div>
    //               <div className="text-center">
    //                 <div className="flex items-center justify-center w-16 h-16 bg-blue-200 rounded-full mx-auto mb-3">
    //                   <span className="text-red-600 text-2xl mb-2">🔁</span>
    //                 </div>
    //                 <div className="text-3xl font-bold text-gray-900 mb-1 ms-4 ">
    //                   {modalRepliedCount || 0}
    //                 </div>
    //                 <div className="text-sm text-gray-500 font-medium ms-4">
    //                   Replied
    //                 </div>
    //               </div>
    //             </div>
    //           </div>
    //         </div>

    //         {/* Table */}
    //         <div className="overflow-auto max-h-96">
    //           {detailsLoading ? (
    //             <div className="flex justify-center items-center py-12">
    //               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
    //               <span className="ml-2 text-gray-600">Loading details...</span>
    //             </div>
    //           ) : (
    //             <table className="w-full">
    //               <thead className="bg-gray-50 sticky top-0">
    //                 <tr>
    //                   <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
    //                     SN
    //                   </th>
    //                   <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
    //                     Number
    //                   </th>
    //                   <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
    //                     Message Type
    //                   </th>
    //                   <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
    //                     Status
    //                   </th>
    //                   <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
    //                     Sent At
    //                   </th>
    //                   <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
    //                     Reason
    //                   </th>
    //                 </tr>
    //               </thead>
    //               <tbody>
    //                 {console.log(modalOrder, "modalOrder")}
    //                 {(() => {
    //                   // Use modalOrder results - these should be paginated from backend
    //                   const results = modalOrder?.results || [];

    //                   if (results.length === 0) {
    //                     return (
    //                       <tr>
    //                         <td
    //                           colSpan="6"
    //                           className="text-center py-8 text-gray-500"
    //                         >
    //                           No detailed results available
    //                         </td>
    //                       </tr>
    //                     );
    //                   }

    //                   // Only show first 50 results per page if backend doesn't paginate properly
    //                   const startIndex = 0; // Backend should handle pagination
    //                   const endIndex = Math.min(50, results.length);
    //                   const pageResults = results.slice(startIndex, endIndex);

    //                   return pageResults?.map((result, idx) => {
    //                     // Find matching phone number
    //                     const phone =
    //                       modalOrder?.phoneNumbers?.find((p) => {
    //                         const cleanPhone = p?.replace(/[^0-9]/g, "") || "";
    //                         const cleanResultPhone =
    //                           result?.phone?.replace(/[^0-9]/g, "") || "";
    //                         return (
    //                           cleanResultPhone === cleanPhone ||
    //                           result?.phone === p ||
    //                           result?.phone === `+91${cleanPhone}` ||
    //                           cleanResultPhone === cleanPhone?.slice(-10)
    //                         );
    //                       }) || result?.phone;

    //                     return (
    //                       <tr key={idx} className="border-t hover:bg-gray-50">
    //                         <td className="py-3 px-4 text-sm">
    //                           {((modalOrder?.resultsPagination?.page ||
    //                             modalCurrentPage) -
    //                             1) *
    //                             50 +
    //                             idx +
    //                             1}
    //                         </td>
    //                         <td className="py-3 px-4 text-sm">
    //                           {phone || "-"}
    //                         </td>

    //                         <td className="py-3 px-4 text-sm">
    //                           <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
    //                             {modalOrder?.type || "N/A"}
    //                           </span>
    //                         </td>
    //                         <td className="py-3 px-4 text-sm">
    //                           <span
    //                             className={`px-2 py-1 rounded text-xs font-medium ${
    //                               result?.messaestatus ===
    //                                 "MESSAGE_DELIVERED" ||
    //                               result?.messaestatus ===
    //                                 "SEND_MESSAGE_SUCCESS" ||
    //                               result?.messaestatus === "MESSAGE_READ"
    //                                 ? "bg-green-100 text-green-800"
    //                                 : result?.messaestatus ===
    //                                     "SEND_MESSAGE_FAILURE" ||
    //                                   result?.status === 500
    //                                 ? "bg-red-100 text-red-800"
    //                                 : "bg-yellow-100 text-yellow-800"
    //                             }`}
    //                           >
    //                             {result?.messaestatus === "MESSAGE_DELIVERED"
    //                               ? "Delivered"
    //                               : result?.messaestatus ===
    //                                 "SEND_MESSAGE_SUCCESS"
    //                               ? "Sent"
    //                               : result?.messaestatus === "MESSAGE_READ"
    //                               ? "Read"
    //                               : result?.messaestatus ===
    //                                   "SEND_MESSAGE_FAILURE" ||
    //                                 result?.status === 500
    //                               ? "Failed"
    //                               : result?.messaestatus || "Pending"}
    //                           </span>
    //                         </td>

    //                         <td className="py-3 px-4 text-sm">
    //                           {result?.timestamp
    //                             ? new Date(result.timestamp).toLocaleString()
    //                             : "-"}
    //                         </td>
    //                         <td className="py-3 px-4 text-sm text-red-900">
    //                           {result?.errorMessage || "-"}
    //                         </td>
    //                       </tr>
    //                     );
    //                   });
    //                 })()}
    //               </tbody>
    //             </table>
    //           )}
    //         </div>

    //         {/* Modal Footer */}
    //         <div className="flex items-center justify-between p-6 border-t">
    //           <div className="flex items-center gap-3">
    //             <button
    //               onClick={() => loadModalPage(modalCurrentPage - 1)}
    //               disabled={modalCurrentPage === 1 || detailsLoading}
    //               className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
    //             >
    //               Previous
    //             </button>
    //             <span className="px-3 py-1 text-sm bg-white border rounded">
    //               Page {modalCurrentPage} of{" "}
    //               {modalOrder?.resultsPagination?.pages || 1}
    //             </span>
    //             <button
    //               onClick={() => loadModalPage(modalCurrentPage + 1)}
    //               disabled={
    //                 modalCurrentPage >=
    //                   (modalOrder?.resultsPagination?.pages || 1) ||
    //                 detailsLoading
    //               }
    //               className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
    //             >
    //               Next
    //             </button>
    //             <span className="text-xs text-gray-500 ml-2">
    //               Showing {modalOrder?.resultsPagination?.total || 0} total
    //               results
    //             </span>
    //           </div>

    //           <div className="flex gap-2">
    //             <button
    //               onClick={closeModal}
    //               className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
    //             >
    //               Cancel
    //             </button>
    //             <button
    //               onClick={() => {
    //                 const exportData =
    //                   modalOrder?.phoneNumbers?.map((phone, idx) => {
    //                     const result = modalOrder?.results?.find(
    //                       (r) => r?.phone === phone
    //                     );
    //                     return {
    //                       SN: idx + 1,
    //                       Number: phone || "N/A",
    //                       Instance: "-",
    //                       "Instance Number": phone || "N/A",
    //                       "Message Type": modalOrder?.type || "N/A",
    //                       Status:
    //                         result?.messaestatus === "MESSAGE_READ"
    //                           ? "Read"
    //                           : result?.messaestatus === "MESSAGE_DELIVERED"
    //                           ? "Delivered"
    //                           : result?.messaestatus === "SEND_MESSAGE_SUCCESS"
    //                           ? "Sent"
    //                           : result?.messaestatus ===
    //                               "SEND_MESSAGE_FAILURE" ||
    //                             result?.status === 500
    //                           ? "Failed"
    //                           : "Pending",
    //                       "Created At": modalOrder?.createdAt
    //                         ? new Date(modalOrder.createdAt).toLocaleString()
    //                         : "N/A",
    //                       "Sent At": result?.timestamp
    //                         ? new Date(result.timestamp).toLocaleString()
    //                         : "-",
    //                     };
    //                   }) || [];

    //                 const ws = XLSX.utils.json_to_sheet(exportData);
    //                 const wb = XLSX.utils.book_new();
    //                 XLSX.utils.book_append_sheet(wb, ws, "Campaign Details");
    //                 XLSX.writeFile(
    //                   wb,
    //                   `campaign-${modalOrder.type}-${
    //                     new Date().toISOString().split("T")[0]
    //                   }.xlsx`
    //                 );
    //               }}
    //               className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
    //             >
    //               Export
    //             </button>
    //           </div>
    //         </div>
    //       </div>
    //     </div>
    //   )}
    // </div>

    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 sm:p-6 lg:p-0">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-indigo-100 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-700 via-purple-600 to-indigo-300 p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="text-white">
                <h1 className="text-3xl sm:text-4xl font-bold mb-2 tracking-tight">
                  Campaign Orders
                </h1>
                <p className="text-indigo-100 text-sm sm:text-base">
                  Manage and track all your message campaigns
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={exportToExcel}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <FaDownload className="text-sm" />
                  <span className="hidden sm:inline">Export</span>
                </button>
                <button
                  onClick={() => refetch()}
                  className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 text-white rounded-xl hover:bg-indigo-400 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <BiRefresh
                    className={`text-lg ${isLoading ? "animate-spin" : ""}`}
                  />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {orders.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                <div className="bg-gradient-to-br from-indigo-700 to-indigo-400 p-6 rounded-xl text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-indigo-100 text-sm font-medium mb-1">
                        Total Orders
                      </p>
                      <p className="text-3xl font-bold">{orders?.length}</p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-lg">
                      <FaChartLine className="text-2xl" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-700 to-emerald-400 p-6 rounded-xl text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-100 text-sm font-medium mb-1">
                        Successful
                      </p>
                      <p className="text-3xl font-bold">
                        {orders?.reduce((acc, order) => {
                          return acc + (order.successCount || 0);
                        }, 0)}
                      </p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-lg">
                      <svg
                        className="w-8 h-8"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-rose-700 to-rose-400 p-6 rounded-xl text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-rose-100 text-sm font-medium mb-1">
                        Failed
                      </p>
                      <p className="text-3xl font-bold">
                       {orders?.reduce((acc, order) => {
                          return acc + (order.failedCount || 0);
                        }, 0)}
                      </p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-lg">
                      <svg
                        className="w-8 h-8"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium mb-1">
                        Success Rate
                      </p>
                      <p className="text-3xl font-bold">
                        {orders.length > 0
                          ? (
                              (orders.filter((order) =>
                                order.results?.some(
                                  (r) =>
                                    r.messaestatus === "MESSAGE_DELIVERED" ||
                                    r.messaestatus === "SEND_MESSAGE_SUCCESS" ||
                                    r.messaestatus === "MESSAGE_READ"
                                )
                              ).length /
                                orders.length) *
                              100
                            ).toFixed(1)
                          : 0}
                        %
                      </p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-lg">
                      <svg
                        className="w-8 h-8"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl mb-8 border border-indigo-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {/* Search */}
                <div className="relative lg:col-span-2">
                  <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-indigo-400" />
                  <input
                    type="text"
                    placeholder="Search campaigns..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border-2 border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-3 border-2 border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white font-medium text-gray-700"
                >
                  <option value="all">All Status</option>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                  <option value="pending">Pending</option>
                </select>

                {/* Type Filter */}
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-4 py-3 border-2 border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white font-medium text-gray-700"
                >
                  <option value="all">All Types</option>
                  {getUniqueTypes().map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>

                {/* Campaign Filter */}
                <select
                  value={campaignFilter}
                  onChange={(e) => {
                    setCampaignFilter(e.target.value);
                    if (e.target.value !== "all") {
                      const campaignData = orders.filter(
                        (order) => order.CampaignName === e.target.value
                      );
                      setCampaignData(campaignData);
                    }
                  }}
                  className="px-4 py-3 border-2 border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white font-medium text-gray-700"
                >
                  <option value="all">All Campaigns</option>
                  {getUniqueCampaigns().map((campaign) => (
                    <option key={campaign} value={campaign}>
                      {campaign}
                    </option>
                  ))}
                </select>

                {/* Date Range */}
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) =>
                    setDateRange((prev) => ({ ...prev, start: e.target.value }))
                  }
                  className="px-4 py-3 border-2 border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white"
                />

                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) =>
                    setDateRange((prev) => ({ ...prev, end: e.target.value }))
                  }
                  className="px-4 py-3 border-2 border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-4">
                <button
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                  className="flex items-center gap-2 px-4 py-2 text-sm border-2 border-indigo-200 rounded-xl hover:bg-white transition-all duration-200 font-medium text-indigo-700 bg-white/50"
                >
                  <FaFilter />
                  {sortOrder === "asc" ? "Oldest First" : "Newest First"}
                </button>

                {campaignFilter !== "all" && (
                  <div className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-xl text-sm font-semibold">
                    Showing {filteredOrders.length} of {orders.length} orders
                  </div>
                )}
              </div>
            </div>

            {isLoading ? (
              <div className="flex flex-col justify-center items-center py-20">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200"></div>
                  <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-600 absolute top-0 left-0"></div>
                </div>
                <p className="mt-4 text-indigo-600 font-medium">
                  Loading campaigns...
                </p>
              </div>
            ) : error ? (
              <div className="text-center py-16 bg-rose-50 rounded-xl border border-rose-200">
                <svg
                  className="w-20 h-20 mx-auto mb-4 text-rose-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-xl font-semibold text-rose-700 mb-4">
                  {error}
                </p>
                <button
                  onClick={() => refetch()}
                  className="px-6 py-3 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-all duration-200 font-medium shadow-lg"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div className="border-2 border-indigo-100 rounded-xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
                      <tr>
                        <th className="text-left py-4 px-6 text-sm font-bold text-indigo-900 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="text-left py-4 px-6 text-sm font-bold text-indigo-900 uppercase tracking-wider">
                          Campaign
                        </th>
                        <th className="text-left py-4 px-6 text-sm font-bold text-indigo-900 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="text-left py-4 px-6 text-sm font-bold text-indigo-900 uppercase tracking-wider">
                          Recipients
                        </th>
                        <th className="text-left py-4 px-6 text-sm font-bold text-indigo-900 uppercase tracking-wider">
                          Success/Failed
                        </th>
                        <th className="text-left py-4 px-6 text-sm font-bold text-indigo-900 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="text-left py-4 px-6 text-sm font-bold text-indigo-900 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="text-left py-4 px-6 text-sm font-bold text-indigo-900 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-indigo-100">
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="text-center py-16">
                            <svg
                              className="w-20 h-20 text-indigo-200 mx-auto mb-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                            <p className="text-xl font-semibold text-gray-700 mb-2">
                              No campaigns found
                            </p>
                            <p className="text-sm text-gray-500">
                              Try adjusting your filters or create a new
                              campaign
                            </p>
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((order, idx) => {
                          const successCount = order.successCount || 0;
                          const failedCount = order.failedCount || 0;

                          return (
                            <tr
                              key={order._id || idx}
                              className="hover:bg-indigo-50 transition-colors duration-150"
                            >
                              <td className="py-4 px-6 text-sm font-mono font-semibold text-indigo-600">
                                #{(currentPage - 1) * 10 + idx + 1}
                              </td>
                              <td className="py-4 px-6 text-sm">
                                <span className="px-3 py-1.5 bg-indigo-100 text-indigo-700 text-xs rounded-lg font-semibold">
                                  {order.CampaignName || "N/A"}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-sm">
                                <span className="px-3 py-1.5 bg-purple-100 text-purple-700 text-xs rounded-lg font-semibold capitalize">
                                  {order.type || "N/A"}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-sm font-bold text-gray-700">
                                {order?.cost || 0}
                              </td>
                              <td className="py-4 px-6 text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="text-emerald-600 font-bold text-base">
                                    {successCount}
                                  </span>
                                  <span className="text-gray-300 font-bold">
                                    /
                                  </span>
                                  <span className="text-rose-600 font-bold text-base">
                                    {failedCount}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-sm">
                                {getStatusBadge(order)}
                              </td>
                              <td className="py-4 px-6 text-sm">
                                <div className="space-y-1">
                                  <div className="font-semibold text-gray-700">
                                    {new Date(
                                      order.createdAt
                                    ).toLocaleDateString()}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {new Date(
                                      order.createdAt
                                    ).toLocaleTimeString()}
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-sm">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => viewOrderDetails(order)}
                                    className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded-lg transition-all duration-200"
                                    title="View Details"
                                  >
                                    <FaEye className="text-lg" />
                                  </button>
                                  <button
                                    onClick={() => deleteOrder(order._id)}
                                    className="p-2 text-rose-600 hover:text-rose-800 hover:bg-rose-100 rounded-lg transition-all duration-200"
                                    title="Delete Order"
                                  >
                                    <FaTrash className="text-lg" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {pagination.total > 0 && (
                  <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-t-2 border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm font-medium text-indigo-700">
                      Showing{" "}
                      <span className="font-bold">
                        {(currentPage - 1) * pagination.limit + 1}
                      </span>{" "}
                      to{" "}
                      <span className="font-bold">
                        {Math.min(
                          currentPage * pagination.limit,
                          pagination.total
                        )}
                      </span>{" "}
                      of <span className="font-bold">{pagination.total}</span>{" "}
                      orders
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-4 py-2 border-2 border-indigo-200 rounded-xl text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white hover:border-indigo-300 transition-all duration-200 text-indigo-700 bg-white/70"
                      >
                        Previous
                      </button>
                      <span className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-xl font-bold shadow-md">
                        {currentPage} / {pagination.pages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === pagination.pages}
                        className="px-4 py-2 border-2 border-indigo-200 rounded-xl text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white hover:border-indigo-300 transition-all duration-200 text-indigo-700 bg-white/70"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden border-2 border-indigo-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  Campaign Report
                </h2>
                <p className="text-indigo-100 text-sm">
                  {selectedOrder.type} • {selectedOrder.CampaignName}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-white hover:bg-white/20 p-2 rounded-xl transition-all duration-200"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Stats Cards */}
            <div className="p-6 border-b-2 border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50">
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 lg:gap-4">
                <div className="text-center p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-xl mx-auto mb-2">
                    <span className="text-2xl">💬</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {modalOrder?.phoneNumbers?.length || 0}
                  </div>
                  <div className="text-xs text-gray-600 font-medium mt-1">
                    Total
                  </div>
                </div>

                <div className="text-center p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-xl mx-auto mb-2">
                    <span className="text-2xl">✓</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {modalOrder?.successCount ||
                      modalOrder?.results?.filter(
                        (r) =>
                          r.messaestatus === "MESSAGE_DELIVERED" ||
                          r.messaestatus === "SEND_MESSAGE_SUCCESS" ||
                          r.messaestatus === "MESSAGE_READ"
                      ).length ||
                      0}
                  </div>
                  <div className="text-xs text-gray-600 font-medium mt-1">
                    Sent
                  </div>
                </div>

                <div className="text-center p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-center w-12 h-12 bg-amber-100 rounded-xl mx-auto mb-2">
                    <span className="text-2xl">📨</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {modalOrder?.results?.filter(
                      (r) => r.messaestatus === "MESSAGE_DELIVERED"
                    ).length || 0}
                  </div>
                  <div className="text-xs text-gray-600 font-medium mt-1">
                    Delivered
                  </div>
                </div>

                <div className="text-center p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mx-auto mb-2">
                    <span className="text-2xl">⏳</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {modalPanddingCount}
                  </div>
                  <div className="text-xs text-gray-600 font-medium mt-1">
                    Pending
                  </div>
                </div>

                <div className="text-center p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-center w-12 h-12 bg-cyan-100 rounded-xl mx-auto mb-2">
                    <span className="text-2xl">👁️</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {modalOrder?.results?.filter(
                      (r) => r.messaestatus === "MESSAGE_READ"
                    ).length || 0}
                  </div>
                  <div className="text-xs text-gray-600 font-medium mt-1">
                    Read
                  </div>
                </div>

                <div className="text-center p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-center w-12 h-12 bg-rose-100 rounded-xl mx-auto mb-2">
                    <span className="text-2xl">⚠</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {modalOrder?.failedCount || modelFildCount}
                  </div>
                  <div className="text-xs text-gray-600 font-medium mt-1">
                    Failed
                  </div>
                </div>

                <div className="text-center p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl mx-auto mb-2">
                    <span className="text-2xl">👆</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {modalClickedCount || 0}
                  </div>
                  <div className="text-xs text-gray-600 font-medium mt-1">
                    Clicked
                  </div>
                </div>

                <div className="text-center p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-xl mx-auto mb-2">
                    <span className="text-2xl">💬</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {modalRepliedCount || 0}
                  </div>
                  <div className="text-xs text-gray-600 font-medium mt-1">
                    Replied
                  </div>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-auto max-h-96">
              {detailsLoading ? (
                <div className="flex justify-center items-center py-16">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200"></div>
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600 absolute top-0 left-0"></div>
                  </div>
                  <span className="ml-3 text-indigo-600 font-medium">
                    Loading details...
                  </span>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-indigo-50 to-purple-50 sticky top-0">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-bold text-indigo-900 uppercase tracking-wider">
                        SN
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-indigo-900 uppercase tracking-wider">
                        Number
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-indigo-900 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-indigo-900 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-indigo-900 uppercase tracking-wider">
                        Sent At
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-indigo-900 uppercase tracking-wider">
                        Reason
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-indigo-100">
                    {(() => {
                      const results = modalOrder?.results || [];

                      if (results.length === 0) {
                        return (
                          <tr>
                            <td
                              colSpan="6"
                              className="text-center py-12 text-gray-500"
                            >
                              No detailed results available
                            </td>
                          </tr>
                        );
                      }

                      const startIndex = 0;
                      const endIndex = Math.min(50, results.length);
                      const pageResults = results.slice(startIndex, endIndex);

                      return pageResults?.map((result, idx) => {
                        const phone =
                          modalOrder?.phoneNumbers?.find((p) => {
                            const cleanPhone = p?.replace(/[^0-9]/g, "") || "";
                            const cleanResultPhone =
                              result?.phone?.replace(/[^0-9]/g, "") || "";
                            return (
                              cleanResultPhone === cleanPhone ||
                              result?.phone === p ||
                              result?.phone === `+91${cleanPhone}` ||
                              cleanResultPhone === cleanPhone?.slice(-10)
                            );
                          }) || result?.phone;

                        return (
                          <tr
                            key={idx}
                            className="hover:bg-indigo-50 transition-colors"
                          >
                            <td className="py-3 px-4 text-sm font-semibold text-gray-700">
                              {((modalOrder?.resultsPagination?.page ||
                                modalCurrentPage) -
                                1) *
                                50 +
                                idx +
                                1}
                            </td>
                            <td className="py-3 px-4 text-sm font-mono text-gray-700">
                              {phone || "-"}
                            </td>
                            <td className="py-3 px-4 text-sm">
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-lg font-semibold">
                                {modalOrder?.type || "N/A"}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold ${
                                  result?.messaestatus ===
                                    "MESSAGE_DELIVERED" ||
                                  result?.messaestatus ===
                                    "SEND_MESSAGE_SUCCESS" ||
                                  result?.messaestatus === "MESSAGE_READ"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : result?.messaestatus ===
                                        "SEND_MESSAGE_FAILURE" ||
                                      result?.status === 500
                                    ? "bg-rose-100 text-rose-700"
                                    : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {result?.messaestatus === "MESSAGE_DELIVERED"
                                  ? "Delivered"
                                  : result?.messaestatus ===
                                    "SEND_MESSAGE_SUCCESS"
                                  ? "Sent"
                                  : result?.messaestatus === "MESSAGE_READ"
                                  ? "Read"
                                  : result?.messaestatus ===
                                      "SEND_MESSAGE_FAILURE" ||
                                    result?.status === 500
                                  ? "Failed"
                                  : result?.messaestatus || "Pending"}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {result?.timestamp
                                ? new Date(result.timestamp).toLocaleString()
                                : "-"}
                            </td>
                            <td className="py-3 px-4 text-sm text-rose-600 font-medium">
                              {result?.errorMessage || "-"}
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 border-t-2 border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => loadModalPage(modalCurrentPage - 1)}
                  disabled={modalCurrentPage === 1 || detailsLoading}
                  className="px-4 py-2 border-2 border-indigo-200 rounded-xl text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white transition-all duration-200 text-indigo-700 bg-white/70"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-xl font-bold shadow-md">
                  {modalCurrentPage} /{" "}
                  {modalOrder?.resultsPagination?.pages || 1}
                </span>
                <button
                  onClick={() => loadModalPage(modalCurrentPage + 1)}
                  disabled={
                    modalCurrentPage >=
                      (modalOrder?.resultsPagination?.pages || 1) ||
                    detailsLoading
                  }
                  className="px-4 py-2 border-2 border-indigo-200 rounded-xl text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white transition-all duration-200 text-indigo-700 bg-white/70"
                >
                  Next
                </button>
                <span className="text-xs text-indigo-600 ml-2 font-medium">
                  {modalOrder?.resultsPagination?.total || 0} total results
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={closeModal}
                  className="px-5 py-2 border-2 border-indigo-200 text-indigo-700 rounded-xl hover:bg-white transition-all duration-200 font-medium"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const exportData =
                      modalOrder?.phoneNumbers?.map((phone, idx) => {
                        const result = modalOrder?.results?.find(
                          (r) => r?.phone === phone
                        );
                        return {
                          SN: idx + 1,
                          Number: phone || "N/A",
                          Instance: "-",
                          "Instance Number": phone || "N/A",
                          "Message Type": modalOrder?.type || "N/A",
                          Status:
                            result?.messaestatus === "MESSAGE_READ"
                              ? "Read"
                              : result?.messaestatus === "MESSAGE_DELIVERED"
                              ? "Delivered"
                              : result?.messaestatus === "SEND_MESSAGE_SUCCESS"
                              ? "Sent"
                              : result?.messaestatus ===
                                  "SEND_MESSAGE_FAILURE" ||
                                result?.status === 500
                              ? "Failed"
                              : "Pending",
                          "Created At": modalOrder?.createdAt
                            ? new Date(modalOrder.createdAt).toLocaleString()
                            : "N/A",
                          "Sent At": result?.timestamp
                            ? new Date(result.timestamp).toLocaleString()
                            : "-",
                        };
                      }) || [];

                    const ws = XLSX.utils.json_to_sheet(exportData);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, "Campaign Details");
                    XLSX.writeFile(
                      wb,
                      `campaign-${modalOrder.type}-${
                        new Date().toISOString().split("T")[0]
                      }.xlsx`
                    );
                  }}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                >
                  Export Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
