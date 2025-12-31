import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Card,
  Row,
  Col,
  Table,
  Select,
  Button,
  Input,
  Progress,
  Tag,
  Modal,
  Divider,
  Tooltip,
  Breadcrumb,
  Space,
  Empty,
  Grid,
  Statistic,
  DatePicker,
  Badge,
  Timeline,
} from 'antd';
import {
  DownloadOutlined,
  FilterOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  BarChartOutlined,
  EyeOutlined,
  HomeOutlined,
  DeleteOutlined,
  ReloadOutlined,
  PhoneOutlined,
  ClockCircleOutlined,
  SendOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import { THEME_CONSTANTS } from '../../theme';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import {
  fetchUserCampaignReports,
  fetchCampaignMessages,
  generateCampaignReport,
  setCurrentReport,
  clearCurrentReport
} from '../../redux/slices/campaignReportSlice';
import {
  fetchRealTimeCampaignStats,
  fetchUserStats,
  updateCampaignStats,
  addMessageToFeed
} from '../../redux/slices/realtimeSlice';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';
import { io } from 'socket.io-client';

const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

export default function Orders() {
  const { user, token } = useAuth();
  const dispatch = useDispatch();
  const screens = useBreakpoint();
  
  // Redux state
  const {
    reports: orders,
    pagination,
    currentReport: selectedOrder,
    campaignMessages,
    messagesPagination,
    loading,
    error
  } = useSelector(state => state.campaignReports);
  
  const {
    campaignStats: realTimeStats,
    messageFeed: liveEvents
  } = useSelector(state => state.realtime);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [modalCurrentPage, setModalCurrentPage] = useState(1);
  const [socket, setSocket] = useState(null);

  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [dateRange, setDateRange] = useState([null, null]);
  const [sortOrder, setSortOrder] = useState('newest');

  // Fetch orders on component mount and page change
  useEffect(() => {
    if (user?._id) {
      dispatch(fetchUserCampaignReports({ userId: user._id, page: currentPage, limit: 10 }));
    }
  }, [dispatch, user?._id, currentPage]);

  useEffect(() => {
    if (Array.isArray(orders) && orders.length > 0) {
      // Fetch real-time stats for all campaigns
      fetchAllCampaignStats();
    }
  }, [orders]);

  // Socket.IO setup for real-time updates
  useEffect(() => {
    if (!token) return;

    try {
      const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
        auth: { token },
        timeout: 5000,
        forceNew: true,
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        console.log('Connected to real-time updates');
      });

      newSocket.on('connect_error', (error) => {
        console.warn('Socket connection failed:', error.message);
        // Don't show error to user, just log it
      });

      newSocket.on('message_status_update', (data) => {
        // Update real-time stats
        dispatch(fetchRealTimeCampaignStats({ campaignId: data.campaignId }));
        
        // Add to live events
        dispatch(addMessageToFeed({
          id: Date.now(),
          campaignId: data.campaignId,
          messageId: data.messageId,
          phoneNumber: data.phoneNumber,
          status: data.status,
          timestamp: data.timestamp,
          eventType: data.eventType
        }));
      });

      newSocket.on('user_interaction', (data) => {
        dispatch(addMessageToFeed({
          id: Date.now(),
          campaignId: data.campaignId,
          messageId: data.messageId,
          phoneNumber: data.phoneNumber,
          status: 'interaction',
          interactionType: data.interactionType,
          text: data.text,
          timestamp: data.timestamp
        }));
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    } catch (error) {
      console.warn('Failed to initialize socket connection:', error);
    }
  }, [token]);

  const fetchAllCampaignStats = async () => {
    for (const order of orders) {
      if (order._id) {
        dispatch(fetchRealTimeCampaignStats({ campaignId: order._id }));
      }
    }
  };

  const getUniqueTypes = () => {
    if (!Array.isArray(orders)) return [];
    return [...new Set(orders.map((order) => order.type).filter(Boolean))];
  };

  const getUniqueCampaigns = () => {
    if (!Array.isArray(orders)) return [];
    return [...new Set(orders.map((order) => order.CampaignName).filter(Boolean))];
  };

  const getStatusBadge = (order) => {
    const campaignId = order._id;
    const liveStats = realTimeStats[campaignId];
    
    // Use real-time stats if available, fallback to order data
    const successCount = liveStats?.delivered || order?.successCount || 0;
    const failedCount = liveStats?.failed || order?.failedCount || 0;
    const sentCount = liveStats?.sent || order?.successCount || 0;
    const totalMessages = liveStats?.total || order?.cost || 0;

    // Calculate success rate based on delivered messages
    const successRate = sentCount > 0 ? (successCount / sentCount) * 100 : 0;

    // If no messages sent yet, show pending
    if (sentCount === 0) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '4px 0' }}>
          <Progress
            type="circle"
            size={36}
            percent={0}
            strokeColor={THEME_CONSTANTS.colors.warning}
            trailColor="#f0f0f0"
            strokeWidth={6}
            showInfo={false}
          />
          <div>
            <Tag
              color="#fffbe6"
              style={{
                color: '#faad14',
                border: '1px solid #faad14',
                fontWeight: 600,
                padding: '4px 8px',
                borderRadius: THEME_CONSTANTS.radius.sm,
                fontSize: '11px'
              }}
            >
              Pending
            </Tag>
          </div>
        </div>
      );
    }

    // Show circular progress with percentage
    const getProgressColor = () => {
      if (successRate >= 80) return THEME_CONSTANTS.colors.success;
      if (successRate >= 50) return '#fa8c16';
      return '#ff4d4f';
    };

    const getStatusText = () => {
      if (successRate >= 80) return 'Success';
      if (successRate > 0) return 'Partial';
      return 'Failed';
    };

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '4px 0' }}>
        <Progress
          type="circle"
          size={36}
          percent={Math.round(successRate)}
          strokeColor={getProgressColor()}
          trailColor="#f0f0f0"
          strokeWidth={6}
          format={(percent) => (
            <span style={{ 
              fontSize: '9px', 
              fontWeight: 700, 
              color: getProgressColor(),
              padding: '3px'
            }}>
              {percent}%
            </span>
          )}
        />
        <div>
          <Tag
            color={successRate >= 80 ? "#f6ffed" : successRate > 0 ? "#fff7e6" : "#fff1f0"}
            style={{
              color: getProgressColor(),
              border: `1px solid ${getProgressColor()}`,
              fontWeight: 600,
              padding: '4px 8px',
              borderRadius: THEME_CONSTANTS.radius.sm,
              fontSize: '11px'
            }}
          >
            {getStatusText()}
          </Tag>
        </div>
      </div>
    );
  };

  const modalOrder = selectedOrder;

  const viewOrderDetails = (order) => {
    dispatch(setCurrentReport(order));
    setModalCurrentPage(1);
    setShowModal(true);
    // Fetch real-time stats and messages for the campaign
    if (order._id) {
      dispatch(fetchRealTimeCampaignStats({ campaignId: order._id }));
      dispatch(fetchCampaignMessages({ campaignId: order._id, page: 1, limit: 20 }));
      // Join campaign room for real-time updates
      if (socket) {
        socket.emit('join_campaign', order._id);
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    // Leave campaign room
    if (socket && selectedOrder?._id) {
      socket.emit('leave_campaign', selectedOrder._id);
    }
    dispatch(clearCurrentReport());
  };

  const deleteOrder = async (orderId) => {
    Modal.confirm({
      title: 'Delete Campaign Report',
      content: 'Are you sure you want to delete this campaign report? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await dispatch(deleteOrder(orderId)).unwrap();
          toast.success('Campaign report deleted successfully');
        } catch (err) {
          console.error('Error deleting order:', err);
          toast.error('Failed to delete campaign report');
        }
      },
    });
  };

  const exportToExcel = () => {
    try {
      if (!orders || orders?.length === 0) {
        toast.error('No data to export');
        return;
      }

      const exportData = orders?.map((order, idx) => {
        const successCount = order?.successCount || 0;
        const failedCount = order?.failedCount || 0;
        const totalRecipients = order?.cost || 0;

        return {
          'ID': `#${(currentPage - 1) * 10 + idx + 1}`,
          'Campaign Name': order?.CampaignName || 'N/A',
          'Message Type': order?.type || 'N/A',
          'Total Recipients': totalRecipients,
          'Successful': successCount,
          'Failed': failedCount,
          'Date': new Date(order.createdAt).toLocaleDateString(),
          'Time': new Date(order.createdAt).toLocaleTimeString(),
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Campaign Reports');

      XLSX.writeFile(workbook, `campaign-reports-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    }
  };

  const columns = [
    {
      title: 'Campaign ID',
      dataIndex: '_id',
      key: 'id',
      render: (text, record, index) => (
        <span style={{ fontWeight: 600, color: THEME_CONSTANTS.colors.primary, fontSize: '13px' }}>
          #{(currentPage - 1) * 10 + index + 1}
        </span>
      ),
      width: '10%',
    },
    {
      title: 'Campaign Name',
      dataIndex: 'CampaignName',
      key: 'name',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 600, color: THEME_CONSTANTS.colors.textPrimary, fontSize: '14px' }}>
            {text || 'N/A'}
          </div>
          <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary, marginTop: '4px' }}>
            {record._id}
          </div>
        </div>
      ),
      width: '25%',
    },
    {
      title: 'Message Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag
          style={{
            background: type === 'SMS' ? '#e6f7ff' : '#f6f8fb',
            color: type === 'SMS' ? THEME_CONSTANTS.colors.primary : '#667085',
            border: 'none',
            fontWeight: 600,
            padding: '4px 12px',
            borderRadius: THEME_CONSTANTS.radius.sm,
            fontSize: '12px',
          }}
        >
          {type}
        </Tag>
      ),
      width: '12%',
    },
    {
      title: 'Recipients',
      dataIndex: 'cost',
      key: 'recipients',
      render: (cost) => (
        <span style={{ fontWeight: 600, color: THEME_CONSTANTS.colors.textPrimary, fontSize: '13px' }}>
          {cost || 0}
        </span>
      ),
      width: '12%',
    },
    {title: 'Success / Failed',
      key: 'results',
      render: (text, record) => {
        const campaignId = record._id;
        const liveStats = realTimeStats[campaignId];
        const successCount = liveStats?.delivered || record?.successCount || 0;
        const failedCount = liveStats?.failed || record?.failedCount || 0;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 600, color: THEME_CONSTANTS.colors.success, fontSize: '13px' }}>
              {successCount}
            </span>
            <span style={{ color: THEME_CONSTANTS.colors.textSecondary }}>|</span>
            <span style={{ fontWeight: 600, color: '#ff4d4f', fontSize: '13px' }}>
              {failedCount}
            </span>
          </div>
        );
      },
      width: '15%',
    },
    {
      title: 'Status',
      key: 'status',
      render: (text, record) => getStatusBadge(record),
      width: '12%',
    },
    {
      title: 'Date Created',
      dataIndex: 'createdAt',
      key: 'date',
      render: (date) => (
        <Tooltip title={new Date(date).toLocaleString()}>
          <span style={{ fontSize: '13px', color: THEME_CONSTANTS.colors.textSecondary }}>
            {new Date(date).toLocaleDateString()}
          </span>
        </Tooltip>
      ),
      width: '14%',
      responsive: ['md'],
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => viewOrderDetails(record)}
            style={{ color: THEME_CONSTANTS.colors.primary }}
            title="View Details"
          />
          <Button
            type="text"
            icon={<DeleteOutlined />}
            onClick={() => deleteOrder(record._id)}
            style={{ color: '#ff4d4f' }}
            title="Delete Campaign"
          />
        </Space>
      ),
      width: '10%',
    },
  ];

  return (
    <>
      <div style={{ background: THEME_CONSTANTS.colors.background, minHeight: '100vh' }}>
        <div style={{ 
          maxWidth: THEME_CONSTANTS.layout.maxContentWidth, 
          margin: '0 auto',
          padding: THEME_CONSTANTS.spacing.xl
        }}>
          {/* Enhanced Header Section */}
          <div style={{
            marginBottom: THEME_CONSTANTS.spacing.xxxl,
            paddingBottom: THEME_CONSTANTS.spacing.xl,
            borderBottom: `2px solid ${THEME_CONSTANTS.colors.primaryLight}`
          }}>
            <Breadcrumb style={{
              marginBottom: THEME_CONSTANTS.spacing.md,
              fontSize: THEME_CONSTANTS.typography.caption.size
            }}>
              <Breadcrumb.Item>
                <HomeOutlined style={{ marginRight: '6px' }} />
                <span style={{ color: THEME_CONSTANTS.colors.textMuted }}>Home</span>
              </Breadcrumb.Item>
              <Breadcrumb.Item>
                <span style={{ 
                  color: THEME_CONSTANTS.colors.primary,
                  fontWeight: THEME_CONSTANTS.typography.h6.weight
                }}>
                  Campaign Reports
                </span>
              </Breadcrumb.Item>
            </Breadcrumb>

            <Row gutter={[16, 16]} align="middle" justify="space-between">
              <Col xs={24} lg={18}>
                <Row gutter={[16, 16]} align="middle">
                  <Col xs={24} sm={4} md={3} lg={3}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      background: THEME_CONSTANTS.colors.primaryLight,
                      borderRadius: THEME_CONSTANTS.radius.xl,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: THEME_CONSTANTS.shadow.md,
                      margin: '0 auto'
                    }}>
                      <BarChartOutlined style={{
                        color: THEME_CONSTANTS.colors.primary,
                        fontSize: '32px'
                      }} />
                    </div>
                  </Col>
                  <Col xs={24} sm={20} md={21} lg={21}>
                    <div style={{ textAlign: { xs: 'center', sm: 'left' } }}>
                      <h1 style={{
                        fontSize: THEME_CONSTANTS.typography.h1.size,
                        fontWeight: THEME_CONSTANTS.typography.h1.weight,
                        color: THEME_CONSTANTS.colors.text,
                        marginBottom: THEME_CONSTANTS.spacing.sm,
                        lineHeight: THEME_CONSTANTS.typography.h1.lineHeight,
                        '@media (max-width: 768px)': {
                          fontSize: THEME_CONSTANTS.typography.h2.size,
                        }
                      }}>
                        Campaign Reports 📊
                      </h1>
                      <p style={{
                        color: THEME_CONSTANTS.colors.textSecondary,
                        fontSize: THEME_CONSTANTS.typography.body.size,
                        fontWeight: 500,
                        lineHeight: THEME_CONSTANTS.typography.body.lineHeight,
                        margin: 0
                      }}>
                        Manage and track all your message campaigns with detailed insights and performance metrics.
                      </p>
                    </div>
                  </Col>
                </Row>
              </Col>
              <Col xs={24} lg={6}>
                <div style={{ textAlign: { xs: 'center', lg: 'right' } }}>
                  <Space>
                    <Button
                      type="primary"
                      icon={<DownloadOutlined />}
                      onClick={exportToExcel}
                      style={{
                        background: THEME_CONSTANTS.colors.primary,
                        borderColor: THEME_CONSTANTS.colors.primary,
                      }}
                    >
                      Export Report
                    </Button>
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={() => dispatch(fetchUserCampaignReports({ userId: user._id, page: currentPage, limit: 10 }))}
                      loading={loading}
                    >
                      Refresh
                    </Button>
                  </Space>
                </div>
              </Col>
            </Row>
          </div>

        {/* Live Events Feed */}
        {liveEvents.length > 0 && (
          <Card
            style={{
              borderRadius: THEME_CONSTANTS.radius.lg,
              border: `1px solid ${THEME_CONSTANTS.colors.borderLight}`,
              boxShadow: THEME_CONSTANTS.shadow.sm,
              marginBottom: '24px',
            }}
            bodyStyle={{ padding: '24px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>🔴 Live Activity Feed</h3>
              <Badge status="processing" text="Real-time" />
            </div>
            <Timeline mode="left">
              {liveEvents.slice(0, 5).map((event) => (
                <Timeline.Item
                  key={event.id}
                  color={event.status === 'delivered' ? 'green' : event.status === 'failed' ? 'red' : 'blue'}
                  dot={event.status === 'delivered' ? <CheckCircleOutlined /> : 
                       event.status === 'failed' ? <CloseCircleOutlined /> : 
                       event.status === 'interaction' ? <MessageOutlined /> : <SendOutlined />}
                >
                  <div>
                    <strong>{event.phoneNumber}</strong>
                    <Tag 
                      color={event.status === 'delivered' ? 'green' : 
                             event.status === 'failed' ? 'red' : 
                             event.status === 'interaction' ? 'purple' : 'blue'} 
                      style={{ marginLeft: '8px' }}
                    >
                      {event.status === 'interaction' ? event.interactionType : event.status}
                    </Tag>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      {new Date(event.timestamp).toLocaleTimeString()}
                      {event.text && (
                        <div style={{ marginTop: '4px', fontStyle: 'italic' }}>
                          "{event.text}"
                        </div>
                      )}
                    </div>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        )}
        {/* Summary Stats with Real-time Data */}
        {Array.isArray(orders) && orders.length > 0 && (
          <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
            <Col xs={24} sm={12} md={6}>
              <Card
                style={{
                  borderRadius: THEME_CONSTANTS.radius.lg,
                  border: `1px solid ${THEME_CONSTANTS.colors.borderLight}`,
                  boxShadow: THEME_CONSTANTS.shadow.sm,
                }}
                bodyStyle={{ padding: '24px' }}
              >
                <Statistic
                  title="Total Campaigns"
                  value={orders?.length}
                  prefix={<BarChartOutlined style={{ marginRight: '8px', color: THEME_CONSTANTS.colors.primary }} />}
                  valueStyle={{ color: THEME_CONSTANTS.colors.primary, fontSize: '28px', fontWeight: 700 }}
                  titleStyle={{ fontSize: '13px', fontWeight: 600, color: THEME_CONSTANTS.colors.textSecondary }}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Card
                style={{
                  borderRadius: THEME_CONSTANTS.radius.lg,
                  border: `1px solid ${THEME_CONSTANTS.colors.borderLight}`,
                  boxShadow: THEME_CONSTANTS.shadow.sm,
                }}
                bodyStyle={{ padding: '24px' }}
              >
                <Statistic
                  title="Total Delivered"
                  value={Object.values(realTimeStats).reduce((acc, stats) => acc + (stats?.delivered || 0), 0) || 
                         orders?.reduce((acc, order) => acc + (order?.successCount || 0), 0)}
                  prefix={<CheckCircleOutlined style={{ marginRight: '8px', color: THEME_CONSTANTS.colors.success }} />}
                  valueStyle={{ color: THEME_CONSTANTS.colors.success, fontSize: '28px', fontWeight: 700 }}
                  titleStyle={{ fontSize: '13px', fontWeight: 600, color: THEME_CONSTANTS.colors.textSecondary }}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Card
                style={{
                  borderRadius: THEME_CONSTANTS.radius.lg,
                  border: `1px solid ${THEME_CONSTANTS.colors.borderLight}`,
                  boxShadow: THEME_CONSTANTS.shadow.sm,
                }}
                bodyStyle={{ padding: '24px' }}
              >
                <Statistic
                  title="Total Failed"
                  value={Object.values(realTimeStats).reduce((acc, stats) => acc + (stats?.failed || 0), 0) || 
                         orders?.reduce((acc, order) => acc + (order?.failedCount || 0), 0)}
                  prefix={<CloseCircleOutlined style={{ marginRight: '8px', color: '#ff4d4f' }} />}
                  valueStyle={{ color: '#ff4d4f', fontSize: '28px', fontWeight: 700 }}
                  titleStyle={{ fontSize: '13px', fontWeight: 600, color: THEME_CONSTANTS.colors.textSecondary }}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Card
                style={{
                  borderRadius: THEME_CONSTANTS.radius.lg,
                  border: `1px solid ${THEME_CONSTANTS.colors.borderLight}`,
                  boxShadow: THEME_CONSTANTS.shadow.sm,
                }}
                bodyStyle={{ padding: '24px' }}
              >
                <Statistic
                  title="Success Rate"
                  value={
                    (() => {
                      const totalDelivered = Object.values(realTimeStats).reduce((acc, stats) => acc + (stats?.delivered || 0), 0) || 
                                           orders?.reduce((acc, order) => acc + (order?.successCount || 0), 0);
                      const totalSent = Object.values(realTimeStats).reduce((acc, stats) => acc + (stats?.sent || 0), 0) || 
                                      orders?.reduce((acc, order) => acc + ((order?.successCount || 0) + (order?.failedCount || 0)), 0);
                      return totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(2) : 0;
                    })()
                  }
                  suffix="%"
                  valueStyle={{ color: THEME_CONSTANTS.colors.primary, fontSize: '28px', fontWeight: 700 }}
                  titleStyle={{ fontSize: '13px', fontWeight: 600, color: THEME_CONSTANTS.colors.textSecondary }}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* Filters */}
        <Card
          style={{
            borderRadius: THEME_CONSTANTS.radius.lg,
            border: `1px solid ${THEME_CONSTANTS.colors.borderLight}`,
            boxShadow: THEME_CONSTANTS.shadow.sm,
            marginBottom: '24px',
          }}
          bodyStyle={{ padding: '24px' }}
        >
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={12} md={6}>
              <Input
                placeholder="Search campaigns..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{
                  borderRadius: THEME_CONSTANTS.radius.sm,
                  border: `1px solid ${THEME_CONSTANTS.colors.borderLight}`,
                }}
              />
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: '100%' }}
                options={[
                  { label: 'All Status', value: 'all' },
                  { label: 'Success', value: 'success' },
                  { label: 'Failed', value: 'failed' },
                  { label: 'Pending', value: 'pending' },
                ]}
              />
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Select
                value={typeFilter}
                onChange={setTypeFilter}
                style={{ width: '100%' }}
                options={[
                  { label: 'All Types', value: 'all' },
                  ...getUniqueTypes().map((type) => ({ label: type, value: type })),
                ]}
              />
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Select
                value={campaignFilter}
                onChange={setCampaignFilter}
                style={{ width: '100%' }}
                options={[
                  { label: 'All Campaigns', value: 'all' },
                  ...getUniqueCampaigns().map((campaign) => ({
                    label: campaign,
                    value: campaign,
                  })),
                ]}
              />
            </Col>

            <Col xs={24} md={12}>
              <RangePicker
                value={dateRange}
                onChange={setDateRange}
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
              />
            </Col>

            <Col xs={24} md={12}>
              <Button
                icon={<FilterOutlined />}
                onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                style={{ width: '100%' }}
              >
                {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Table */}
        <Card
          style={{
            borderRadius: THEME_CONSTANTS.radius.lg,
            border: `1px solid ${THEME_CONSTANTS.colors.borderLight}`,
            boxShadow: THEME_CONSTANTS.shadow.md,
          }}
          bodyStyle={{ padding: 0 }}
        >
          {loading ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '60px 20px',
              }}
            >
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  borderTop: `4px solid ${THEME_CONSTANTS.colors.primary}`,
                  borderRight: `4px solid transparent`,
                  animation: 'spin 1s linear infinite',
                }}
              />
              <div
                style={{
                  marginTop: '16px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: THEME_CONSTANTS.colors.textSecondary,
                }}
              >
                Loading campaigns...
              </div>
            </div>
          ) : error?.orders ? (
            <Empty
              description={error?.orders || 'Failed to load campaigns'}
              style={{ padding: '60px 20px' }}
            />
          ) : Array.isArray(orders) && orders.length === 0 ? (
            <Empty
              description="No campaigns found"
              style={{ padding: '60px 20px' }}
            />
          ) : (
            <>
              <Table
                columns={columns}
                dataSource={Array.isArray(orders) ? orders : []}
                rowKey="_id"
                pagination={{
                  current: currentPage,
                  pageSize: 10,
                  total: pagination.total,
                  onChange: (page) => {
                    setCurrentPage(page);
                  },
                  showSizeChanger: false,
                  showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} campaigns`,
                }}
                style={{ borderCollapse: 'collapse' }}
                scroll={{ x: 800 }}
              />
            </>
          )}
        </Card>
        </div>
      </div>

      {/* Professional Modal for Campaign Details */}
      <Modal
        title={null}
        open={showModal}
        onCancel={closeModal}
        width={1000}
        footer={null}
        bodyStyle={{ padding: 0 }}
        style={{ top: 20 }}
      >
        {modalOrder && (
          <div>
            {/* Clean Header */}
            <div style={{
              background: '#ffffff',
              padding: '24px 32px',
              borderBottom: `1px solid ${THEME_CONSTANTS.colors.border}`,
              borderRadius: '8px 8px 0 0'
            }}>
              <Row align="middle" justify="space-between">
                <Col>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      background: THEME_CONSTANTS.colors.primaryLight,
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <BarChartOutlined style={{ fontSize: '24px', color: THEME_CONSTANTS.colors.primary }} />
                    </div>
                    <div>
                      <h2 style={{ color: THEME_CONSTANTS.colors.text, margin: 0, fontSize: '20px', fontWeight: 600 }}>
                        Campaign Analytics
                      </h2>
                      <div style={{ fontSize: '14px', color: THEME_CONSTANTS.colors.textSecondary, marginTop: '4px' }}>
                        {selectedOrder?.CampaignName} • {selectedOrder?.type}
                      </div>
                    </div>
                  </div>
                </Col>
                <Col>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary }}>Created</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: THEME_CONSTANTS.colors.text }}>
                      {new Date(selectedOrder?.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </Col>
              </Row>
            </div>

            {/* Professional Stats Grid */}
            <div style={{ padding: '32px' }}>
              {(() => {
                const campaignId = selectedOrder?._id;
                const liveStats = realTimeStats[campaignId] || {};
                
                return (
                  <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
                    <Col xs={12} sm={8} md={4}>
                      <Card style={{
                        background: '#ffffff',
                        border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                        borderRadius: '8px',
                        textAlign: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        height: '100px'
                      }} bodyStyle={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px', color: THEME_CONSTANTS.colors.primary }}>
                          {liveStats.total || modalOrder?.cost || 0}
                        </div>
                        <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary }}>Total Recipients</div>
                      </Card>
                    </Col>

                    <Col xs={12} sm={8} md={4}>
                      <Card style={{
                        background: '#ffffff',
                        border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                        borderRadius: '8px',
                        textAlign: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        height: '100px'
                      }} bodyStyle={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px', color: THEME_CONSTANTS.colors.success }}>
                          {liveStats.sent || modalOrder?.successCount || 0}
                        </div>
                        <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary }}>Successfully Sent</div>
                      </Card>
                    </Col>

                    <Col xs={12} sm={8} md={4}>
                      <Card style={{
                        background: '#ffffff',
                        border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                        borderRadius: '8px',
                        textAlign: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        height: '100px'
                      }} bodyStyle={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px', color: '#f59e0b' }}>
                          {liveStats.delivered || modalOrder?.totalDelivered || 0}
                        </div>
                        <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary }}>Delivered</div>
                      </Card>
                    </Col>

                    <Col xs={12} sm={8} md={4}>
                      <Card style={{
                        background: '#ffffff',
                        border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                        borderRadius: '8px',
                        textAlign: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        height: '100px'
                      }} bodyStyle={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px', color: '#8b5cf6' }}>
                          {liveStats.read || modalOrder?.totalRead || 0}
                        </div>
                        <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary }}>Read</div>
                      </Card>
                    </Col>

                    <Col xs={12} sm={8} md={4}>
                      <Card style={{
                        background: '#ffffff',
                        border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                        borderRadius: '8px',
                        textAlign: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        height: '100px'
                      }} bodyStyle={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px', color: THEME_CONSTANTS.colors.error }}>
                          {liveStats.failed || modalOrder?.failedCount || 0}
                        </div>
                        <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary }}>Failed</div>
                      </Card>
                    </Col>

                    <Col xs={12} sm={8} md={4}>
                      <Card style={{
                        background: '#ffffff',
                        border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                        borderRadius: '8px',
                        textAlign: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        height: '100px'
                      }} bodyStyle={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px', color: '#06b6d4' }}>
                          {liveStats.interactions || modalOrder?.userClickCount || 0}
                        </div>
                        <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary }}>Interactions</div>
                      </Card>
                    </Col>
                  </Row>
                );
              })()}

              {/* Message Details Table */}
              <Card style={{
                background: '#ffffff',
                border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                borderRadius: '8px',
                marginBottom: '24px'
              }} bodyStyle={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: THEME_CONSTANTS.colors.text }}>
                  📋 Message Details
                </h3>
                
                <Table
                  dataSource={Array.isArray(campaignMessages) ? campaignMessages : []}
                  rowKey="_id"
                  loading={loading}
                  pagination={{
                    current: modalCurrentPage,
                    pageSize: 20,
                    total: messagesPagination?.total || 0,
                    onChange: (page) => {
                      setModalCurrentPage(page);
                      dispatch(fetchCampaignMessages({ campaignId: selectedOrder._id, page, limit: 20 }));
                    },
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} messages`,
                    size: 'small'
                  }}
                  scroll={{ x: 800 }}
                  size="small"
                  columns={[
                    {
                      title: 'Phone Number',
                      dataIndex: 'phoneNumber',
                      key: 'phoneNumber',
                      width: 140,
                      render: (phone) => (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <PhoneOutlined style={{ color: THEME_CONSTANTS.colors.primary, fontSize: '12px' }} />
                          <span style={{ fontWeight: 600, fontSize: '13px' }}>{phone}</span>
                        </div>
                      )
                    },
                    {
                      title: 'Status',
                      dataIndex: 'status',
                      key: 'status',
                      width: 100,
                      render: (status) => {
                        const statusConfig = {
                          sent: { color: '#1890ff', icon: <SendOutlined /> },
                          delivered: { color: '#52c41a', icon: <CheckCircleOutlined /> },
                          read: { color: '#722ed1', icon: <EyeOutlined /> },
                          replied: { color: '#13c2c2', icon: <MessageOutlined /> },
                          failed: { color: '#ff4d4f', icon: <CloseCircleOutlined /> },
                          queued: { color: '#faad14', icon: <ClockCircleOutlined /> }
                        };
                        const config = statusConfig[status] || { color: '#8c8c8c', icon: null };
                        return (
                          <Tag color={config.color} icon={config.icon} style={{ fontSize: '11px', fontWeight: 600 }}>
                            {status?.toUpperCase()}
                          </Tag>
                        );
                      }
                    },
                    {
                      title: 'Template',
                      dataIndex: 'templateType',
                      key: 'templateType',
                      width: 110,
                      render: (type) => (
                        <Tag style={{ fontSize: '11px', background: '#f0f5ff', color: '#1890ff', border: 'none' }}>
                          {type}
                        </Tag>
                      )
                    },
                    {
                      title: 'Sent',
                      dataIndex: 'sentAt',
                      key: 'sentAt',
                      width: 90,
                      render: (date) => date ? (
                        <Tooltip title={new Date(date).toLocaleString()}>
                          <span style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary }}>
                            {new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </Tooltip>
                      ) : <span style={{ color: '#d9d9d9' }}>-</span>
                    },
                    {
                      title: 'Delivered',
                      dataIndex: 'deliveredAt',
                      key: 'deliveredAt',
                      width: 90,
                      render: (date) => date ? (
                        <Tooltip title={new Date(date).toLocaleString()}>
                          <span style={{ fontSize: '12px', color: '#52c41a', fontWeight: 600 }}>
                            {new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </Tooltip>
                      ) : <span style={{ color: '#d9d9d9' }}>-</span>
                    },
                    {
                      title: 'Read',
                      dataIndex: 'readAt',
                      key: 'readAt',
                      width: 90,
                      render: (date) => date ? (
                        <Tooltip title={new Date(date).toLocaleString()}>
                          <span style={{ fontSize: '12px', color: '#722ed1', fontWeight: 600 }}>
                            {new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </Tooltip>
                      ) : <span style={{ color: '#d9d9d9' }}>-</span>
                    },
                    {
                      title: 'Interactions',
                      key: 'engagement',
                      width: 110,
                      render: (_, record) => (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {record.interactions > 0 && (
                            <Tag color="cyan" style={{ fontSize: '11px', margin: 0 }}>
                              🖱️ {record.interactions}
                            </Tag>
                          )}
                          {record.replies > 0 && (
                            <Tag color="purple" style={{ fontSize: '11px', margin: 0 }}>
                              💬 {record.replies}
                            </Tag>
                          )}
                          {record.interactions === 0 && record.replies === 0 && (
                            <span style={{ color: '#d9d9d9', fontSize: '12px' }}>-</span>
                          )}
                        </div>
                      )
                    },
                    {
                      title: 'User Response',
                      key: 'response',
                      width: 200,
                      render: (_, record) => {
                        if (record.userText) {
                          return (
                            <Tooltip title={record.userText}>
                              <div style={{ 
                                fontSize: '12px', 
                                color: THEME_CONSTANTS.colors.text,
                                maxWidth: '180px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                💬 "{record.userText}"
                              </div>
                            </Tooltip>
                          );
                        }
                        if (record.clickedAction) {
                          return (
                            <div style={{ fontSize: '12px', color: '#1890ff' }}>
                              🖱️ Clicked: {record.clickedAction}
                            </div>
                          );
                        }
                        if (record.suggestionResponse?.plainText) {
                          return (
                            <Tooltip title={record.suggestionResponse.plainText}>
                              <div style={{ 
                                fontSize: '12px', 
                                color: '#722ed1',
                                maxWidth: '180px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                ✅ {record.suggestionResponse.plainText}
                              </div>
                            </Tooltip>
                          );
                        }
                        return <span style={{ color: '#d9d9d9', fontSize: '12px' }}>-</span>;
                      }
                    },
                    {
                      title: 'Error',
                      dataIndex: 'errorMessage',
                      key: 'errorMessage',
                      width: 150,
                      render: (error) => error ? (
                        <Tooltip title={error}>
                          <Tag color="red" style={{ fontSize: '11px', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            ⚠️ {error}
                          </Tag>
                        </Tooltip>
                      ) : <span style={{ color: '#d9d9d9' }}>-</span>
                    }
                  ]}
                />
              </Card>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}