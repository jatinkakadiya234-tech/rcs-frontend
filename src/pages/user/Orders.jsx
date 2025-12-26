import React, { useState, useEffect } from 'react';
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
} from '@ant-design/icons';
import { THEME_CONSTANTS } from '../../theme';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useOrders, useOrderDetails, useDeleteOrder } from '../../hooks/useOrders';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

export default function Orders() {
  const { user } = useAuth();
  const screens = useBreakpoint();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalCurrentPage, setModalCurrentPage] = useState(1);

  // React Query hooks
  const { data: ordersData, isLoading, error, refetch } = useOrders(user?._id, currentPage, 10);
  const deleteOrderMutation = useDeleteOrder();

  const orders = ordersData?.data || [];
  const pagination = ordersData?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  };

  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [dateRange, setDateRange] = useState([null, null]);
  const [sortOrder, setSortOrder] = useState('newest');
  const [filteredOrders, setFilteredOrders] = useState([]);

  useEffect(() => {
    if (orders.length > 0) {
      filterAndSortOrders();
    }
  }, [orders, searchText, statusFilter, typeFilter, campaignFilter, dateRange, sortOrder]);

  const filterAndSortOrders = () => {
    let filtered = [...orders];

    // Search filter
    if (searchText) {
      filtered = filtered?.filter(
        (order) =>
          order?.type?.toLowerCase().includes(searchText.toLowerCase()) ||
          order?.CampaignName?.toLowerCase().includes(searchText.toLowerCase()) ||
          order?._id?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered?.filter((order) => {
        const successCount = order?.successCount || 0;
        const failedCount = order?.failedCount || 0;
        
        if (statusFilter === 'success') {
          return successCount > failedCount;
        } else if (statusFilter === 'failed') {
          return failedCount > 0;
        } else if (statusFilter === 'pending') {
          return successCount === 0 && failedCount === 0;
        }
        return true;
      });
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((order) => order.type === typeFilter);
    }

    // Campaign filter
    if (campaignFilter !== 'all') {
      filtered = filtered?.filter((order) => order?.CampaignName === campaignFilter);
    }

    // Date range filter
    if (dateRange[0] && dateRange[1]) {
      filtered = filtered?.filter(
        (order) =>
          dayjs(order.createdAt).isAfter(dateRange[0]) &&
          dayjs(order.createdAt).isBefore(dateRange[1])
      );
    }

    // Sort by date
    if (sortOrder === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortOrder === 'oldest') {
      filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }

    setFilteredOrders(filtered);
  };

  const getUniqueTypes = () => {
    return [...new Set(orders?.map((order) => order.type).filter(Boolean))];
  };

  const getUniqueCampaigns = () => {
    return [...new Set(orders.map((order) => order.CampaignName).filter(Boolean))];
  };

  const getStatusBadge = (order) => {
    const successCount = order?.successCount || 0;
    const failedCount = order?.failedCount || 0;
    const totalMessages = successCount + failedCount;

    // Calculate success rate based on actual messages sent
    const successRate = totalMessages > 0 ? (successCount / totalMessages) * 100 : 0;

    // If no messages sent yet, show pending
    if (totalMessages === 0) {
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
    );
  };

  const { data: orderDetailsData, isLoading: detailsLoading } = useOrderDetails(
    selectedOrder?._id,
    modalCurrentPage,
    10
  );

  const modalOrder = orderDetailsData?.data || selectedOrder;

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setModalCurrentPage(1);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
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
          await deleteOrderMutation.mutateAsync(orderId);
          toast.success('Campaign report deleted successfully');
          refetch();
        } catch (err) {
          console.error('Error deleting order:', err);
          toast.error('Failed to delete campaign report');
        }
      },
    });
  };

  const exportToExcel = () => {
    try {
      if (!filteredOrders || filteredOrders?.length === 0) {
        toast.error('No data to export');
        return;
      }

      const exportData = filteredOrders?.map((order, idx) => {
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
    {
      title: 'Success / Failed',
      key: 'results',
      render: (text, record) => {
        const successCount = record?.successCount || 0;
        const failedCount = record?.failedCount || 0;
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
                      onClick={() => refetch()}
                      loading={isLoading}
                    >
                      Refresh
                    </Button>
                  </Space>
                </div>
              </Col>
            </Row>
          </div>

        {/* Summary Stats */}
        {orders.length > 0 && (
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
                  title="Successful"
                  value={orders?.reduce((acc, order) => acc + (order?.successCount || 0), 0)}
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
                  title="Failed"
                  value={orders?.reduce((acc, order) => acc + (order?.failedCount || 0), 0)}
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
                    orders?.length > 0
                      ? (
                          (orders?.reduce((acc, order) => acc + (order?.successCount || 0), 0) /
                            (orders?.reduce((acc, order) => acc + ((order?.successCount || 0) + (order?.failedCount || 0)), 0) || 1)) *
                          100
                        ).toFixed(2)
                      : 0
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
          {isLoading ? (
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
          ) : error ? (
            <Empty
              description={error}
              style={{ padding: '60px 20px' }}
            />
          ) : filteredOrders.length === 0 ? (
            <Empty
              description="No campaigns found"
              style={{ padding: '60px 20px' }}
            />
          ) : (
            <>
              <Table
                columns={columns}
                dataSource={filteredOrders}
                rowKey="_id"
                pagination={{
                  current: currentPage,
                  pageSize: 10,
                  total: pagination.total,
                  onChange: setCurrentPage,
                  showSizeChanger: false,
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
                      {modalOrder?.cost || 0}
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
                      {modalOrder?.successCount || 0}
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
                      {modalOrder?.totalDelivered || 0}
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
                      {modalOrder?.totalRead || 0}
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
                      {modalOrder?.failedCount || 0}
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
                      {modalOrder?.userClickCount || 0}
                    </div>
                    <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary }}>Clicked</div>
                  </Card>
                </Col>
              </Row>

              {/* Performance Metrics */}
              <Card style={{
                background: '#ffffff',
                border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                borderRadius: '8px',
                marginBottom: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }} bodyStyle={{ padding: '24px' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 600, color: THEME_CONSTANTS.colors.text }}>Performance Overview</h3>
                <Row gutter={[32, 16]}>
                  <Col xs={24} md={12}>
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 500, color: THEME_CONSTANTS.colors.text }}>Delivery Rate</span>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: THEME_CONSTANTS.colors.success }}>
                          {modalOrder?.cost > 0 ? ((modalOrder?.successCount / modalOrder?.cost) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                      <Progress
                        percent={modalOrder?.cost > 0 ? ((modalOrder?.successCount / modalOrder?.cost) * 100) : 0}
                        strokeColor={THEME_CONSTANTS.colors.success}
                        trailColor="#f0f0f0"
                        strokeWidth={6}
                        showInfo={false}
                      />
                    </div>
                  </Col>
                  <Col xs={24} md={12}>
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 500, color: THEME_CONSTANTS.colors.text }}>Read Rate</span>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: THEME_CONSTANTS.colors.primary }}>
                          {modalOrder?.successCount > 0 ? ((modalOrder?.totalRead / modalOrder?.successCount) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                      <Progress
                        percent={modalOrder?.successCount > 0 ? ((modalOrder?.totalRead / modalOrder?.successCount) * 100) : 0}
                        strokeColor={THEME_CONSTANTS.colors.primary}
                        trailColor="#f0f0f0"
                        strokeWidth={6}
                        showInfo={false}
                      />
                    </div>
                  </Col>
                </Row>
              </Card>

              {/* Message Details Table */}
              <Card style={{
                background: '#ffffff',
                border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }} bodyStyle={{ padding: '24px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: '20px' 
                }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: THEME_CONSTANTS.colors.text }}>Message Details</h3>
                  <Tag style={{ 
                    background: THEME_CONSTANTS.colors.primaryLight, 
                    color: THEME_CONSTANTS.colors.primary,
                    border: 'none',
                    fontSize: '12px', 
                    padding: '4px 12px',
                    borderRadius: '6px'
                  }}>
                    {orderDetailsData?.data?.results?.length || 0} Records
                  </Tag>
                </div>
                
                <Table
                  columns={[
                    {
                      title: 'Phone Number',
                      dataIndex: 'phone',
                      key: 'phone',
                      width: '30%',
                      render: (text, record) => (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <PhoneOutlined style={{ color: THEME_CONSTANTS.colors.textSecondary, fontSize: '12px' }} />
                          <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 500, color: THEME_CONSTANTS.colors.text }}>
                            {text || '-'}
                          </span>
                        </div>
                      ),
                    },
                    {
                      title: 'Status',
                      dataIndex: 'messaestatus',
                      key: 'status',
                      width: '25%',
                      render: (status, record) => {
                        const getStatusConfig = (status, record) => {
                          // Check status code first
                          if (record?.status === 201) {
                            return { color: 'success', icon: <CheckCircleOutlined />, text: 'Success' };
                          }
                          
                          switch(status) {
                            case 'MESSAGE_DELIVERED':
                              return { color: 'success', icon: <CheckCircleOutlined />, text: 'Delivered' };
                            case 'SEND_MESSAGE_SUCCESS':
                              return { color: 'processing', icon: <CheckCircleOutlined />, text: 'Sent' };
                            case 'MESSAGE_READ':
                              return { color: 'success', icon: <EyeOutlined />, text: 'Read' };
                            case 'SEND_MESSAGE_FAILURE':
                              return { color: 'error', icon: <CloseCircleOutlined />, text: 'Failed' };
                            default:
                              return { color: 'warning', icon: <ClockCircleOutlined />, text: 'Pending' };
                          }
                        };
                        
                        const config = getStatusConfig(status, record);
                        return (
                          <Tag 
                            color={config.color} 
                            icon={config.icon}
                            style={{ fontSize: '12px', padding: '4px 8px', fontWeight: 500 }}
                          >
                            {config.text}
                          </Tag>
                        );
                      },
                    },
                    {
                      title: 'Timestamp',
                      dataIndex: 'timestamp',
                      key: 'timestamp',
                      width: '25%',
                      render: (text) => (
                        <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary }}>
                          {text ? (
                            <>
                              <div>{new Date(text).toLocaleDateString()}</div>
                              <div style={{ fontSize: '11px', opacity: 0.8 }}>
                                {new Date(text).toLocaleTimeString()}
                              </div>
                            </>
                          ) : '-'}
                        </div>
                      ),
                    },
                  ]}
                  dataSource={orderDetailsData?.data?.results || []}
                  rowKey={(record, index) => index}
                  pagination={{
                    current: modalCurrentPage,
                    pageSize: 10,
                    total: orderDetailsData?.data?.resultsPagination?.total || 0,
                    onChange: setModalCurrentPage,
                    showSizeChanger: false,
                    showQuickJumper: true,
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} messages`
                  }}
                  loading={detailsLoading}
                  size="small"
                  scroll={{ y: 300 }}
                  style={{
                    border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                    borderRadius: '6px'
                  }}
                />
              </Card>
            </div>

            {/* Clean Footer Actions */}
            <div style={{
              padding: '20px 32px',
              background: '#fafbfc',
              borderTop: `1px solid ${THEME_CONSTANTS.colors.border}`,
              borderRadius: '0 0 8px 8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary }}>
                Campaign ID: <span style={{ fontFamily: 'monospace', fontWeight: 500 }}>{selectedOrder?._id}</span>
              </div>
              <Space size="middle">
                <Button 
                  onClick={closeModal}
                  style={{ 
                    borderRadius: '6px',
                    border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                    color: THEME_CONSTANTS.colors.text
                  }}
                >
                  Close
                </Button>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={() => {
                    const exportData = modalOrder?.results?.map((result, idx) => ({
                      'S.No': idx + 1,
                      'Phone Number': result?.phone || 'N/A',
                      'Status': result?.messaestatus || 'N/A',
                      'Message Type': modalOrder?.type || 'N/A',
                      'Campaign Name': modalOrder?.CampaignName || 'N/A',
                      'Sent At': result?.timestamp ? new Date(result.timestamp).toLocaleString() : 'N/A',
                      'Created Date': new Date(modalOrder?.createdAt).toLocaleDateString(),
                    })) || [];

                    const ws = XLSX.utils.json_to_sheet(exportData);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, 'Campaign Details');
                    XLSX.writeFile(wb, `campaign-${modalOrder?.CampaignName}-${new Date().toISOString().split('T')[0]}.xlsx`);
                    toast.success('Detailed report exported successfully');
                  }}
                  style={{ 
                    borderRadius: '6px',
                    background: THEME_CONSTANTS.colors.primary,
                    borderColor: THEME_CONSTANTS.colors.primary
                  }}
                >
                  Export Report
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Modal>

      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
}