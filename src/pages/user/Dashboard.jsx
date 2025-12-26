import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Space,
  Button,
  Avatar,
  Progress,
  Divider,
  Modal,
  Tooltip,
  Breadcrumb,
  Input,
  InputNumber,
  Grid,
  Statistic,
} from 'antd';
import {
  SendOutlined,
  CheckCircleOutlined,
  MessageOutlined,
  BarChartOutlined,
  PlusOutlined,
  EyeOutlined,
  ArrowUpOutlined,
  PhoneOutlined,
  MailOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  UserOutlined,
  DashboardOutlined,
  HomeOutlined,
  ReloadOutlined,
  WalletOutlined,
  CreditCardOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';

import { THEME_CONSTANTS } from '../../theme';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const { useBreakpoint } = Grid;

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const screens = useBreakpoint();
  const [messageReports, setMessageReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [walletBalance, setWalletBalance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [stats, setStats] = useState({
    failedMessages: 0,
    pendingMessages: 0,
    sendtoteltemplet: 0,
    sentMessages: 0,
    totalCampaigns: 0,
    totalFailedCount: 0,
    totalMessages: 0,
    totalSuccessCount: 0,
  });

  useEffect(() => {
    if (user?._id) {
      fetchMessageReports();
    }
  }, [user]);

  const fetchMessageReports = async () => {
    try {
      setLoading(true);
      const [reportsData, statsData] = await Promise.all([
        api.getrecentorders(user._id),
        api.getMessageStats(user._id),
      ]);
      toast.success('Dashboard data loaded successfully');

      const messages = reportsData.data || [];
      setMessageReports(messages);

      setStats({
        failedMessages: statsData?.data?.failedMessages || 0,
        pendingMessages: statsData?.data?.pendingMessages || 0,
        sendtoteltemplet: statsData?.data?.sendtoteltemplet || 0,
        sentMessages: statsData?.data?.sentMessages || 0,
        totalCampaigns: statsData?.data?.totalCampaigns || 0,
        totalFailedCount: statsData?.data?.totalFailedCount || 0,
        totalMessages: statsData?.data?.totalMessages || 0,
        totalSuccessCount: statsData?.data?.totalSuccessCount || 0,
      });
    } catch (err) {
      console.error('Error fetching data:', err);
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMoney = async () => {
    if (addAmount && Number.parseFloat(addAmount) > 0) {
      try {
        const data = await api.addWalletRequest({
          amount: Number.parseFloat(addAmount),
          userId: user._id,
        });

        if (data.success) {
          toast.success(`Wallet recharge request of ₹${addAmount} submitted for admin approval!`);
          setAddAmount('');
          setShowAddMoney(false);
          refreshUser();
        } else {
          toast.error('Failed to submit request: ' + data.message);
        }
      } catch (error) {
        toast.error('Error submitting request: ' + error.message);
      }
    }
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(value);

  const messageColumns = [
    {
      title: 'Campaign Name',
      dataIndex: 'CampaignName',
      key: 'campaignName',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 600, color: THEME_CONSTANTS.colors.textPrimary, fontSize: '14px' }}>
            {text || 'N/A'}
          </div>
          <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary, marginTop: '4px' }}>
            {record.type}
          </div>
        </div>
      ),
      width: '30%',
    },
    {
      title: 'Recipients',
      dataIndex: 'cost',
      key: 'recipients',
      render: (cost) => (
        <span style={{ fontWeight: 600, color: THEME_CONSTANTS.colors.textPrimary }}>
          {cost || 0}
        </span>
      ),
      width: '12%',
    },
    {
      title: 'Sent',
      dataIndex: 'successCount',
      key: 'sent',
      render: (sent) => (
        <span style={{ fontWeight: 600, color: THEME_CONSTANTS.colors.success }}>
          {sent || 0}
        </span>
      ),
      width: '12%',
    },
    {
      title: 'Delivered',
      dataIndex: 'totalDelivered',
      key: 'delivered',
      render: (delivered) => (
        <span style={{ fontWeight: 600, color: THEME_CONSTANTS.colors.primary }}>
          {delivered || 0}
        </span>
      ),
      width: '12%',
    },
    {
      title: 'Failed',
      dataIndex: 'failedCount',
      key: 'failed',
      render: (failed) => (
        <span style={{ fontWeight: 600, color: '#ff4d4f' }}>
          {failed || 0}
        </span>
      ),
      width: '12%',
    },
    {
      title: 'Success Rate',
      key: 'successRate',
      render: (text, record) => {
        const rate = record.successCount && record.cost ? Math.round((record.successCount / record.cost) * 100) : 0;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 600, color: THEME_CONSTANTS.colors.primary }}>{rate}%</span>
            <Progress percent={rate} size="small" style={{ width: '50px' }} />
          </div>
        );
      },
      width: '15%',
      responsive: ['md'],
    },
    {
      title: 'Status',
      key: 'status',
      render: (text, record) => {
        const successCount = record?.successCount || 0;
        const failedCount = record?.failedCount || 0;
        
        if (successCount > failedCount && failedCount === 0) {
          return (
            <Tag
              icon={<CheckCircleOutlined />}
              color="#f6ffed"
              style={{
                color: THEME_CONSTANTS.colors.success,
                border: `1px solid ${THEME_CONSTANTS.colors.success}`,
                fontWeight: 600,
              }}
            >
              Success
            </Tag>
          );
        }
        if (failedCount > 0) {
          return (
            <Tag
              icon={<CloseCircleOutlined />}
              color="#fff1f0"
              style={{
                color: '#ff4d4f',
                border: '1px solid #ff4d4f',
                fontWeight: 600,
              }}
            >
              Failed
            </Tag>
          );
        }
        return (
          <Tag
            icon={<ClockCircleOutlined />}
            color="#fffbe6"
            style={{
              color: '#faad14',
              border: '1px solid #faad14',
              fontWeight: 600,
            }}
          >
            Pending
          </Tag>
        );
      },
      width: '12%',
    },
  ];

  return (
    <>
      <div
        style={{
          padding: screens.md ? '24px' : '16px',
          background: THEME_CONSTANTS.colors.background,
          minHeight: '100vh',
        }}
      >
        {/* Breadcrumb */}
        <Breadcrumb
          style={{
            marginBottom: '24px',
            fontSize: '13px',
          }}
        >
          <Breadcrumb.Item>
            <HomeOutlined style={{ marginRight: '6px' }} />
            <span style={{ color: THEME_CONSTANTS.colors.textSecondary }}>Home</span>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <span style={{ color: THEME_CONSTANTS.colors.primary, fontWeight: 600 }}>
              Dashboard
            </span>
          </Breadcrumb.Item>
        </Breadcrumb>

        {/* Header Section */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: THEME_CONSTANTS.colors.textPrimary,
                  marginBottom: '8px',
                }}
              >
                Welcome back, {user?.companyname || 'User'}
              </div>
              <div
                style={{
                  fontSize: '14px',
                  color: THEME_CONSTANTS.colors.textSecondary,
                }}
              >
                Manage your campaigns, templates, and track your message delivery metrics all in one place.
              </div>
            </div>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={async () => {
                  setRefreshing(true);
                  await refreshUser();
                  setRefreshing(false);
                }}
                loading={refreshing}
              >
                Refresh
              </Button>
            </Space>
          </div>

          {/* Wallet Card */}
          <Card
            style={{
              borderRadius: THEME_CONSTANTS.radius.lg,
              border: `1px solid ${THEME_CONSTANTS.colors.borderLight}`,
              boxShadow: THEME_CONSTANTS.shadow.md,
              background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.primary}, ${THEME_CONSTANTS.colors.primary}dd)`,
              color: 'white',
              marginBottom: '24px',
            }}
            bodyStyle={{ padding: '24px' }}
          >
            <Row align="middle" gutter={[24, 24]}>
              <Col xs={24} sm={12}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      background: 'rgba(255,255,255,0.2)',
                      borderRadius: THEME_CONSTANTS.radius.md,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <CreditCardOutlined style={{ fontSize: '28px', color: 'white' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', marginBottom: '4px' }}>
                      Available Balance
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 700 }}>
                      {formatCurrency(user?.Wallet || 0)}
                    </div>
                  </div>
                </div>
              </Col>
              <Col xs={24} sm={12} style={{ textAlign: screens.sm ? 'right' : 'left' }}>
                <Space>
                  <Button
                    onClick={() => setShowAddMoney(true)}
                    style={{
                      background: 'white',
                      color: THEME_CONSTANTS.colors.primary,
                      borderColor: 'white',
                      fontWeight: 600,
                    }}
                    icon={<PlusOutlined />}
                  >
                    Add Money
                  </Button>
                </Space>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)', marginTop: '12px' }}>
                  Ready to use for your campaigns. No hidden charges.
                </div>
              </Col>
            </Row>
          </Card>
        </div>

        {/* Stats Grid - First Row */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} md={6}>
            <Card
              style={{
                borderRadius: THEME_CONSTANTS.radius.lg,
                border: `1px solid ${THEME_CONSTANTS.colors.borderLight}`,
                boxShadow: THEME_CONSTANTS.shadow.sm,
                height: '100%',
              }}
              bodyStyle={{ padding: '20px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '13px', color: THEME_CONSTANTS.colors.textSecondary, fontWeight: 600, marginBottom: '8px' }}>
                    Total Messages
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: THEME_CONSTANTS.colors.textPrimary }}>
                    {loading ? '-' : stats.totalMessages}
                  </div>
                </div>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    background: `${THEME_CONSTANTS.colors.primary}15`,
                    borderRadius: THEME_CONSTANTS.radius.md,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MessageOutlined style={{ fontSize: '24px', color: THEME_CONSTANTS.colors.primary }} />
                </div>
              </div>
              <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary, marginTop: '12px' }}>
                Sent successfully.
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card
              style={{
                borderRadius: THEME_CONSTANTS.radius.lg,
                border: `1px solid ${THEME_CONSTANTS.colors.borderLight}`,
                boxShadow: THEME_CONSTANTS.shadow.sm,
                height: '100%',
              }}
              bodyStyle={{ padding: '20px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '13px', color: THEME_CONSTANTS.colors.textSecondary, fontWeight: 600, marginBottom: '8px' }}>
                    Messages Sent
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: THEME_CONSTANTS.colors.success }}>
                    {loading ? '-' : stats.totalSuccessCount}
                  </div>
                </div>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    background: `${THEME_CONSTANTS.colors.success}15`,
                    borderRadius: THEME_CONSTANTS.radius.md,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CheckCircleOutlined style={{ fontSize: '24px', color: THEME_CONSTANTS.colors.success }} />
                </div>
              </div>
              <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary, marginTop: '12px' }}>
                Successfully delivered.
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card
              style={{
                borderRadius: THEME_CONSTANTS.radius.lg,
                border: `1px solid ${THEME_CONSTANTS.colors.borderLight}`,
                boxShadow: THEME_CONSTANTS.shadow.sm,
                height: '100%',
              }}
              bodyStyle={{ padding: '20px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '13px', color: THEME_CONSTANTS.colors.textSecondary, fontWeight: 600, marginBottom: '8px' }}>
                    Pending Messages
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: '#faad14' }}>
                    {loading ? '-' : stats.pendingMessages}
                  </div>
                </div>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    background: '#faad1415',
                    borderRadius: THEME_CONSTANTS.radius.md,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ClockCircleOutlined style={{ fontSize: '24px', color: '#faad14' }} />
                </div>
              </div>
              <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary, marginTop: '12px' }}>
                In queue.
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card
              style={{
                borderRadius: THEME_CONSTANTS.radius.lg,
                border: `1px solid ${THEME_CONSTANTS.colors.borderLight}`,
                boxShadow: THEME_CONSTANTS.shadow.sm,
                height: '100%',
              }}
              bodyStyle={{ padding: '20px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '13px', color: THEME_CONSTANTS.colors.textSecondary, fontWeight: 600, marginBottom: '8px' }}>
                    Failed Messages
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: '#ff4d4f' }}>
                    {loading ? '-' : stats.totalFailedCount}
                  </div>
                </div>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    background: '#ff4d4f15',
                    borderRadius: THEME_CONSTANTS.radius.md,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CloseCircleOutlined style={{ fontSize: '24px', color: '#ff4d4f' }} />
                </div>
              </div>
              <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary, marginTop: '12px' }}>
                Needs attention.
              </div>
            </Card>
          </Col>
        </Row>

        {/* Stats Grid - Second Row */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} md={6}>
            <Card
              style={{
                borderRadius: THEME_CONSTANTS.radius.lg,
                border: `1px solid ${THEME_CONSTANTS.colors.borderLight}`,
                boxShadow: THEME_CONSTANTS.shadow.sm,
                height: '100%',
              }}
              bodyStyle={{ padding: '20px' }}
            >
              <Statistic
                title="Active Campaigns"
                value={loading ? '-' : stats.totalCampaigns}
                titleStyle={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: THEME_CONSTANTS.colors.textSecondary,
                }}
                valueStyle={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: THEME_CONSTANTS.colors.textPrimary,
                }}
              />
              <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary, marginTop: '12px' }}>
                Running campaigns
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card
              style={{
                borderRadius: THEME_CONSTANTS.radius.lg,
                border: `1px solid ${THEME_CONSTANTS.colors.borderLight}`,
                boxShadow: THEME_CONSTANTS.shadow.sm,
                height: '100%',
              }}
              bodyStyle={{ padding: '20px' }}
            >
              <Statistic
                title="Active Templates"
                value={loading ? '-' : stats.sendtoteltemplet}
                titleStyle={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: THEME_CONSTANTS.colors.textSecondary,
                }}
                valueStyle={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: THEME_CONSTANTS.colors.textPrimary,
                }}
              />
              <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary, marginTop: '12px' }}>
                Ready to use
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card
              style={{
                borderRadius: THEME_CONSTANTS.radius.lg,
                border: `1px solid ${THEME_CONSTANTS.colors.borderLight}`,
                boxShadow: THEME_CONSTANTS.shadow.sm,
                height: '100%',
              }}
              bodyStyle={{ padding: '20px' }}
            >
              <Statistic
                title="Success Rate"
                value={
                  loading
                    ? '-'
                    : stats.totalMessages > 0
                    ? ((stats.totalSuccessCount / stats.totalMessages) * 100).toFixed(2)
                    : 0
                }
                suffix="%"
                titleStyle={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: THEME_CONSTANTS.colors.textSecondary,
                }}
                valueStyle={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: THEME_CONSTANTS.colors.primary,
                }}
              />
              <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary, marginTop: '12px' }}>
                Excellent performance
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card
              style={{
                borderRadius: THEME_CONSTANTS.radius.lg,
                border: `1px solid ${THEME_CONSTANTS.colors.borderLight}`,
                boxShadow: THEME_CONSTANTS.shadow.sm,
                height: '100%',
              }}
              bodyStyle={{ padding: '20px' }}
            >
              <Statistic
                title="Balance Remaining"
                value={formatCurrency(user?.Wallet || 0)}
                titleStyle={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: THEME_CONSTANTS.colors.textSecondary,
                }}
                valueStyle={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: THEME_CONSTANTS.colors.primary,
                }}
              />
              <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary, marginTop: '12px' }}>
                Available for campaigns
              </div>
            </Card>
          </Col>
        </Row>

        {/* Recent Messages Table */}
        <Card
          style={{
            borderRadius: THEME_CONSTANTS.radius.lg,
            border: `1px solid ${THEME_CONSTANTS.colors.borderLight}`,
            boxShadow: THEME_CONSTANTS.shadow.md,
          }}
          bodyStyle={{ padding: 0 }}
        >
          <div
            style={{
              padding: '24px',
              borderBottom: `1px solid ${THEME_CONSTANTS.colors.borderLight}`,
              background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.background}, ${THEME_CONSTANTS.colors.background}dd)`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: THEME_CONSTANTS.colors.textPrimary, margin: '0 0 4px 0' }}>
                  Recent Campaigns
                </h2>
                <p style={{ fontSize: '13px', color: THEME_CONSTANTS.colors.textSecondary, margin: 0 }}>
                  Recent messaging campaigns and their delivery status
                </p>
              </div>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchMessageReports}
                loading={loading}
              >
                Refresh
              </Button>
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
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
              <p style={{ marginTop: '16px', fontSize: '14px', fontWeight: 600, color: THEME_CONSTANTS.colors.textSecondary }}>
                Loading campaign data...
              </p>
            </div>
          ) : messageReports.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
              <MessageOutlined style={{ fontSize: '48px', color: `${THEME_CONSTANTS.colors.textSecondary}40`, marginBottom: '16px' }} />
              <p style={{ fontSize: '16px', fontWeight: 600, color: THEME_CONSTANTS.colors.textPrimary, margin: 0 }}>
                No recent campaigns found
              </p>
              <p style={{ fontSize: '13px', color: THEME_CONSTANTS.colors.textSecondary, margin: '8px 0 0 0' }}>
                Your campaigns will appear here
              </p>
            </div>
          ) : (
            <>
              <Table
                columns={messageColumns}
                dataSource={messageReports.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)}
                rowKey="_id"
                pagination={{
                  current: currentPage,
                  pageSize: itemsPerPage,
                  total: messageReports.length,
                  onChange: setCurrentPage,
                  showSizeChanger: false,
                  style: { textAlign: 'center' },
                }}
                style={{ borderCollapse: 'collapse' }}
                scroll={{ x: 800 }}
              />
            </>
          )}
        </Card>
      </div>

      {/* Add Money Modal */}
      <Modal
        title={
          <div style={{ fontSize: '18px', fontWeight: 700, color: THEME_CONSTANTS.colors.textPrimary }}>
            Add Money to Wallet
          </div>
        }
        open={showAddMoney}
        onCancel={() => setShowAddMoney(false)}
        footer={null}
        bodyStyle={{ padding: '24px' }}
      >
        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: THEME_CONSTANTS.colors.textPrimary, marginBottom: '8px', display: 'block' }}>
            Amount (₹)
          </label>
          <InputNumber
            value={addAmount}
            onChange={setAddAmount}
            placeholder="Enter amount"
            style={{ width: '100%' }}
            min={0}
            prefix="₹"
            size="large"
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: THEME_CONSTANTS.colors.textPrimary, marginBottom: '12px' }}>
            Quick Select
          </p>
          <Row gutter={[12, 12]}>
            {[100, 500, 1000].map((amount) => (
              <Col xs={8} key={amount}>
                <Button
                  block
                  onClick={() => setAddAmount(amount)}
                  style={{
                    border: `1px solid ${THEME_CONSTANTS.colors.borderLight}`,
                    color: THEME_CONSTANTS.colors.primary,
                  }}
                >
                  ₹{amount}
                </Button>
              </Col>
            ))}
          </Row>
        </div>

        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button onClick={() => setShowAddMoney(false)}>Cancel</Button>
          <Button
            type="primary"
            onClick={handleAddMoney}
            disabled={!addAmount || Number.parseFloat(addAmount) <= 0}
            style={{ background: THEME_CONSTANTS.colors.primary }}
          >
            Add Money
          </Button>
        </Space>
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