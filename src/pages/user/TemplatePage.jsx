

import React, { useState, useEffect, useRef } from 'react';
import {
  Layout,
  Form,
  Input,
  Select,
  Card,
  Button,
  Upload,
  Table,
  Modal,
  Space,
  Tooltip,
  Empty,
  Divider,
  Row,
  Col,
  Tag,
  Grid,
  Breadcrumb,
  Tabs,
  Popconfirm,
  Spin,
  Progress,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  CloudUploadOutlined,
  HomeOutlined,
  FileTextOutlined,
  FormOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  ReloadOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  PhoneOutlined,
  LinkOutlined,
  MessageOutlined,
  MobileOutlined,
  DownloadOutlined,
  ClearOutlined,
  CheckOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { THEME_CONSTANTS } from '../../theme';
import ApiService from '../../services/api';
import { getMessageTypeLabel } from '../../utils/messageTypes';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const { useBreakpoint } = Grid;

export default function CreateTemplatePage() {
  const { user } = useAuth();
  const screens = useBreakpoint();
  const [form] = Form.useForm();
  const previewRef = useRef(null);
  const carouselContainerRef = useRef(null);

  // Templates list state
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(true);

  // Form states
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    text: '',
    imageUrl: '',
  });
  const [mediaFile, setMediaFile] = useState(null);
  const [messageType, setMessageType] = useState('text');
  const [actions, setActions] = useState([{ type: 'reply', title: '', payload: '' }]);
  const [richCard, setRichCard] = useState({ 
    title: '', 
    subtitle: '', 
    imageUrl: '', 
    actions: [],
    mediaFile: null 
  });
  const [carouselItems, setCarouselItems] = useState([
    { title: '', subtitle: '', imageUrl: '', actions: [], mediaFile: null }
  ]);
  const [carouselSuggestions, setCarouselSuggestions] = useState([]);
  const [error, setError] = useState('');
  const [previewMode, setPreviewMode] = useState('desktop');

  // Upload states
  const [uploadingIndexes, setUploadingIndexes] = useState(new Set());

  // Preview states
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  useEffect(() => {
    if (user?._id) {
      fetchTemplates();
    }
  }, [user]);

  const fetchTemplates = async () => {
    try {
      setTableLoading(true);
      const response = await ApiService.getUserTemplates(user?._id);
      setTemplates(response.data || []);
      toast.success('Templates fetched successfully');
    } catch (err) {
      toast.error('Failed to fetch templates');
      console.error(err);
    } finally {
      setTableLoading(false);
    }
  };

  const uploadFile = async (file) => {
    try {
      const result = await ApiService.uploadFile(file);
      return result.url;
    } catch (error) {
      toast.error('File upload failed: ' + error.message);
      return null;
    }
  };

  const handleImageSelect = async (file, target = 'main', index = null) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result;
        
        if (target === 'main') {
          setMediaFile(file);
          setFormData({ ...formData, imageUrl: base64 });
        } else if (target === 'richCard') {
          setRichCard({ ...richCard, imageUrl: base64, mediaFile: file });
        } else if (target === 'carousel' && index !== null) {
          const newItems = [...carouselItems];
          newItems[index].imageUrl = base64;
          newItems[index].mediaFile = file;
          setCarouselItems(newItems);
        }
      };
      reader.readAsDataURL(file);
      return false;
    }
  };

  const handleDeleteImage = (target = 'main', index = null) => {
    if (target === 'main') {
      setMediaFile(null);
      setFormData({ ...formData, imageUrl: '' });
    } else if (target === 'richCard') {
      setRichCard({ ...richCard, imageUrl: '', mediaFile: null });
    } else if (target === 'carousel' && index !== null) {
      const newItems = [...carouselItems];
      newItems[index].imageUrl = '';
      newItems[index].mediaFile = null;
      setCarouselItems(newItems);
    }
    toast.success('Image removed');
  };

  const addAction = (target = 'main') => {
    const newAction = { type: 'reply', title: '', payload: '' };
    if (target === 'main') {
      setActions([...actions, newAction]);
    } else if (target === 'richCard') {
      setRichCard({ ...richCard, actions: [...richCard.actions, newAction] });
    }
  };

  const removeAction = (index, target = 'main') => {
    if (target === 'main') {
      setActions(actions.filter((_, i) => i !== index));
    } else if (target === 'richCard') {
      setRichCard({
        ...richCard,
        actions: richCard.actions.filter((_, i) => i !== index),
      });
    }
  };

  const addCarouselItem = () => {
    setCarouselItems([...carouselItems, { title: '', subtitle: '', imageUrl: '', actions: [], mediaFile: null }]);
    // Scroll to bottom after adding new card
    setTimeout(() => {
      if (carouselContainerRef.current) {
        carouselContainerRef.current.scrollTo({
          top: carouselContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 100);
  };

  const removeCarouselItem = (index) => {
    if (carouselItems.length === 1) {
      toast.error('At least one carousel item is required');
      return;
    }
    setCarouselItems(carouselItems.filter((_, i) => i !== index));
  };

  const addCarouselAction = (carouselIndex) => {
    const newItems = [...carouselItems];
    if (!newItems[carouselIndex].actions) {
      newItems[carouselIndex].actions = [];
    }
    newItems[carouselIndex].actions.push({ type: 'reply', title: '', payload: '' });
    setCarouselItems(newItems);
  };

  const removeCarouselAction = (carouselIndex, actionIndex) => {
    const newItems = [...carouselItems];
    newItems[carouselIndex].actions = newItems[carouselIndex].actions.filter(
      (_, i) => i !== actionIndex
    );
    setCarouselItems(newItems);
  };

  const updateCarouselAction = (carouselIndex, actionIndex, field, value) => {
    const newItems = [...carouselItems];
    newItems[carouselIndex].actions[actionIndex][field] = value;
    setCarouselItems(newItems);
  };

  const handlePreview = (template) => {
    setPreviewData(template);
    setPreviewOpen(true);
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      text: template.text || '',
      imageUrl: template.imageUrl || '',
    });
    setMessageType(template.messageType);
    setActions(template.actions || [{ type: 'reply', title: '', payload: '' }]);
    setRichCard(template.richCard || { title: '', subtitle: '', imageUrl: '', actions: [], mediaFile: null });
    setCarouselItems(template.carouselItems || [{ title: '', subtitle: '', imageUrl: '', actions: [], mediaFile: null }]);
    setCarouselSuggestions(template.carouselSuggestions || []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    Modal.confirm({
      title: 'Delete Template',
      content: 'Are you sure you want to delete this template? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await ApiService.deleteTemplate(id);
          toast.success('Template deleted successfully');
          fetchTemplates();
        } catch (err) {
          toast.error('Failed to delete template');
        }
      },
    });
  };

  const resetForm = () => {
    form.resetFields();
    setFormData({ name: '', text: '', imageUrl: '' });
    setMessageType('text');
    setActions([{ type: 'reply', title: '', payload: '' }]);
    setRichCard({ title: '', subtitle: '', imageUrl: '', actions: [], mediaFile: null });
    setCarouselItems([{ title: '', subtitle: '', imageUrl: '', actions: [], mediaFile: null }]);
    setCarouselSuggestions([]);
    setEditingTemplate(null);
    setMediaFile(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error('Template name is required');
      setError('Template name is required');
      return;
    }

    if ((messageType === 'text' || messageType === 'text-with-action') && !formData.text.trim()) {
      toast.error('Template text is required');
      setError('Template text is required');
      return;
    }

    const templateData = {
      name: formData.name.trim(),
      messageType,
      text: formData.text.trim(),
      imageUrl: formData.imageUrl.trim(),
      userId: user?._id,
    };

    if (messageType === 'text-with-action') {
      const validActions = actions.filter((a) => a.title.trim() && a.payload.trim());
      if (validActions.length === 0) {
        toast.error('At least one action button is required');
        setError('At least one action button is required');
        return;
      }
      templateData.actions = validActions;
    } else if (messageType === 'rcs') {
      if (!richCard.title.trim()) {
        toast.error('Card title is required');
        setError('Card title is required');
        return;
      }
      templateData.richCard = {
        ...richCard,
        actions: richCard.actions.filter((a) => a.title.trim() && a.payload.trim()),
      };
    } else if (messageType === 'carousel') {
      const validItems = carouselItems
        .filter((item) => {
          if (!item.title.trim()) return false;
          const validActions = (item.actions || []).filter(
            (a) => a.title.trim() && a.payload.trim()
          );
          return validActions.length > 0;
        })
        .map((item) => ({
          ...item,
          actions: item.actions.filter((a) => a.title.trim() && a.payload.trim()),
        }));

      if (validItems.length === 0) {
        const msg = 'Each carousel item must have a title and at least one valid action button';
        toast.error(msg);
        setError(msg);
        return;
      }

      templateData.carouselItems = validItems;
      templateData.carouselSuggestions = carouselSuggestions.filter(
        (s) => s.title && s.title.trim() && s.payload && s.payload.trim()
      );
    }

    try {
      setLoading(true);
      if (editingTemplate) {
        await ApiService.updateTemplate(editingTemplate._id, templateData);
        toast.success('Template updated successfully');
      } else {
        await ApiService.createTemplate(templateData);
        toast.success('Template created successfully');
      }
      await fetchTemplates();
      resetForm();
      setError('');
    } catch (err) {
      console.error('Template save error:', err);
      let errorMsg = 'Failed to save template';
      const serverMsg = err.response?.data?.message || err.message || '';

      if (serverMsg.includes('E11000') && serverMsg.includes('name')) {
        errorMsg = `Template name "${formData.name}" already exists. Please use a different name.`;
      } else {
        errorMsg = serverMsg || errorMsg;
      }

      toast.error(errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const typeDescriptions = {
    text: 'Simple text-only message',
    'text-with-action': 'Text message with interactive action buttons',
    rcs: 'Single card with image, title, description, and action buttons',
    carousel: 'Multiple scrollable cards with images and buttons',
  };

  const typeColors = {
    text: THEME_CONSTANTS.colors.success,
    'text-with-action': '#faad14',
    rcs: THEME_CONSTANTS.colors.primary,
    carousel: '#13c2c2',
  };

  const getActionIcon = (type) => {
    switch (type) {
      case 'reply':
        return <MessageOutlined />;
      case 'url':
        return <LinkOutlined />;
      case 'call':
        return <PhoneOutlined />;
      default:
        return <MessageOutlined />;
    }
  };

  // Mobile Phone Frame Component
  const MobilePhoneFrame = ({ children, title }) => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px',
      padding: '16px',
    }}>
      <div style={{
        fontSize: '12px',
        fontWeight: 600,
        color: '#666',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}>
        {title}
      </div>
      <div style={{
        width: '100%',
        maxWidth: '375px',
        aspectRatio: '9/18',
        background: '#000',
        borderRadius: '32px',
        padding: '12px',
        border: '8px solid #1a1a1a',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Phone Status Bar */}
        <div style={{
          height: '24px',
          background: '#000',
          borderRadius: '16px 16px 0 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingX: '16px',
          fontSize: '11px',
          color: '#fff',
          marginBottom: '8px',
        }}>
          <span>9:41</span>
          <span>●●●●●</span>
        </div>

        {/* Phone Content Area */}
        <div style={{
          flex: 1,
          background: '#f5f5f5',
          borderRadius: '16px',
          overflow: 'auto',
          padding: '0',
          display: 'flex',
          flexDirection: 'column',
          scrollBehavior: 'smooth',
        }}>
          {children}
        </div>
      </div>
    </div>
  );

  // RCS Message Preview Component with realistic mobile UI
  const RCSMessagePreview = ({ data }) => {
    if (!data) return null;

    const phoneStyle = {
      width: '300px',
      height: '600px',
      background: '#000',
      borderRadius: '24px',
      padding: '8px',
      margin: '0 auto',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    };

    const screenStyle = {
      width: '100%',
      height: '100%',
      background: '#ffffff',
      borderRadius: '16px',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    };

    const headerStyle = {
      background: '#ffffff',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      borderBottom: '1px solid #e0e0e0',
    };

    const chatAreaStyle = {
      flex: 1,
      padding: '5px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      overflowY: 'auto',
      background: '#f5f5f5',
    };

    const messageBubbleStyle = {
      minWidth: '240px',
      maxWidth: '95%',
      alignSelf: 'flex-end',
      background: '#e3f2fd',
      borderRadius: '18px 18px 4px 18px',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    };

    const renderRcsMessage = () => {
      const card = typeof data === 'object' ? data.richCard : richCard;
      if (!card || (!card.title && !card.imageUrl)) return null;

      return (
        <div style={messageBubbleStyle}>
          {card.imageUrl && (
            <img
              src={card.imageUrl}
              alt="RCS Media"
              style={{ width: '100%', height: '160px', objectFit: 'cover' }}
            />
          )}
          <div style={{ padding: '12px' }}>
            {card.title && (
              <h4 style={{ color: '#000', fontSize: '14px', fontWeight: 600, margin: '0 0 4px 0' }}>
                {card.title}
              </h4>
            )}
            {card.subtitle && (
              <p style={{ color: '#333', fontSize: '12px', margin: '0 0 12px 0', lineHeight: 1.4 }}>
                {card.subtitle}
              </p>
            )}
            {card.actions && card.actions.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {card.actions.filter(a => a.title && a.title.trim()).slice(0, 2).map((action, idx) => (
                  <button
                    key={idx}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #dadce0',
                      borderRadius: '20px',
                      color: '#1a73e8',
                      padding: '8px 16px',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    }}
                  >
                    {action.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    };

    const renderTextMessage = () => {
      const text = typeof data === 'object' ? data.text : formData.text;
      if (!text) return null;

      return (
        <div style={{
          ...messageBubbleStyle,
          background: '#1976d2',
          padding: '12px 16px',
        }}>
          <p style={{ color: '#ffffff', fontSize: '14px', margin: 0, lineHeight: 1.4 }}>
            {text}
          </p>
        </div>
      );
    };

    const renderCarouselMessage = () => {
      const items = typeof data === 'object' ? data.carouselItems : carouselItems;
      const validItems = items ? items.filter(item => item.title && item.title.trim()) : [];
      if (validItems.length === 0) return null;

      return (
        <div style={{ ...messageBubbleStyle, background: 'transparent', boxShadow: 'none' }}>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '0 4px' }}>
            {validItems.slice(0, 3).map((item, idx) => (
              <div
                key={idx}
                style={{
                  minWidth: '180px',
                  background: '#e3f2fd',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}
              >
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    style={{ width: '100%', height: '100px', objectFit: 'cover' }}
                  />
                )}
                <div style={{ padding: '10px' }}>
                  <h5 style={{ color: '#000', fontSize: '12px', fontWeight: 600, margin: '0 0 4px 0' }}>
                    {item.title}
                  </h5>
                  {item.subtitle && (
                    <p style={{ color: '#333', fontSize: '10px', margin: '0 0 8px 0' }}>
                      {item.subtitle}
                    </p>
                  )}
                  {item.actions && item.actions.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {item.actions.filter(a => a.title && a.title.trim()).slice(0, 2).map((action, actionIdx) => (
                        <button
                          key={actionIdx}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #dadce0',
                            borderRadius: '20px',
                            color: '#1a73e8',
                            padding: '6px 12px',
                            fontSize: '10px',
                            width: '100%',
                            fontWeight: 500,
                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                          }}
                        >
                          {action.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    };

    const messageType = typeof data === 'object' ? data.messageType : data;
    const actionButtons = typeof data === 'object' ? data.actions : actions;

    return (
      <div style={{ padding: '20px', background: '#f5f7fa', borderRadius: '12px' }}>
        <div style={phoneStyle}>
          <div style={screenStyle}>
            {/* Header */}
            <div style={headerStyle}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#4caf50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'white', fontSize: '12px', fontWeight: 600 }}>B</span>
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Business</h4>
                <p style={{ margin: 0, fontSize: '11px', color: '#666' }}>RCS • Online</p>
              </div>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#e0e0e0' }} />
            </div>

            {/* Chat Area */}
            <div style={chatAreaStyle}>
              {messageType === 'rcs' && renderRcsMessage()}
              {messageType === 'text' && renderTextMessage()}
              {messageType === 'text-with-action' && (
                <>
                  {renderTextMessage()}
                  {actionButtons && actionButtons.length > 0 && actionButtons.some(a => a.title && a.title.trim()) && (
                    <div style={{ alignSelf: 'flex-end', maxWidth: '95%', marginTop: '1px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {actionButtons.filter(a => a.title && a.title.trim()).slice(0, 3).map((action, idx) => (
                          <button
                            key={idx}
                            style={{
                              background: '#ffffff',
                              border: '1px solid #dadce0',
                              color: '#1a73e8',
                              padding: '8px 16px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: 500,
                              cursor: 'pointer',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                            }}
                          >
                            {action.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
              {messageType === 'carousel' && renderCarouselMessage()}
              
              {/* Delivery Status */}
              <div style={{ alignSelf: 'flex-end', marginTop: '4px' }}>
                <span style={{ fontSize: '10px', color: '#666' }}>✓✓ Delivered</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Table columns configuration
  const columns = [
    {
      title: 'Template Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              background: '#e8f4fd',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FileTextOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: '#000', fontSize: '14px' }}>
              {text}
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              ID: {record._id?.slice(-8) || 'N/A'}
            </div>
          </div>
        </div>
      ),
      width: '35%',
    },
    {
      title: 'Type',
      dataIndex: 'messageType',
      key: 'type',
      render: (type) => (
        <Tag
          style={{
            background: `${typeColors[type] || '#1890ff'}15`,
            color: typeColors[type] || '#1890ff',
            border: `1px solid ${typeColors[type] || '#1890ff'}`,
            fontWeight: 600,
            padding: '6px 12px',
            borderRadius: '8px',
          }}
        >
          {getMessageTypeLabel ? getMessageTypeLabel(type) : type}
        </Tag>
      ),
      width: '20%',
    },
    {
      title: 'Preview',
      key: 'preview',
      render: (text, record) => (
        <Button
          type="text"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handlePreview(record)}
          style={{ color: '#1890ff' }}
        >
          View
        </Button>
      ),
      width: '15%',
    },
    {
      title: 'Status',
      key: 'status',
      render: (text, record) => {
        const createdDate = new Date(record.createdAt);
        const now = new Date();
        const secondsDiff = (now - createdDate) / 1000;
        return secondsDiff < 3 ? (
          <Tag color="processing">Processing</Tag>
        ) : (
          <Tag color="success">Active</Tag>
        );
      },
      width: '15%',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => (
        <Space size="small">
          <Tooltip title="Edit Template">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              style={{ color: '#1890ff' }}
            />
          </Tooltip>
          <Tooltip title="Delete Template">
            <Popconfirm
              title="Delete Template"
              description="Are you sure you want to delete this template?"
              onConfirm={() => handleDelete(record._id)}
              okText="Delete"
              cancelText="Cancel"
              okType="danger"
            >
              <Button type="text" size="small" icon={<DeleteOutlined />} danger />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
      width: '15%',
    },
  ];

  // Render carousel item editor
  const renderCarouselItemEditor = (item, index) => (
    <Card
      key={index}
      style={{
        marginBottom: '16px',
        borderRadius: '8px',
        border: '1px solid #e8e8e8',
      }}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AppstoreOutlined style={{ color: '#1890ff' }} />
          <span>Card {index + 1}</span>
          {item.imageUrl && (
            <CheckOutlined style={{ color: '#52c41a', marginLeft: 'auto' }} />
          )}
        </div>
      }
      extra={
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => removeCarouselItem(index)}
        >
          Remove
        </Button>
      }
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Form.Item label="Card Title" required>
            <Input
              placeholder="Enter card title"
              value={item.title}
              onChange={(e) => {
                const newItems = [...carouselItems];
                newItems[index].title = e.target.value;
                setCarouselItems(newItems);
              }}
              maxLength={80}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item label="Card Subtitle">
            <Input
              placeholder="Enter card subtitle (optional)"
              value={item.subtitle}
              onChange={(e) => {
                const newItems = [...carouselItems];
                newItems[index].subtitle = e.target.value;
                setCarouselItems(newItems);
              }}
              maxLength={200}
            />
          </Form.Item>
        </Col>
      </Row>

      {/* Card Image Upload */}
      <Form.Item label="Card Image (Aspect Ratio: 3:2.5)">
        <Upload
          accept="image/*"
          maxCount={1}
          listType="picture-card"
          beforeUpload={(file) => handleImageSelect(file, 'carousel', index)}
          onRemove={() => handleDeleteImage('carousel', index)}
        >
          {!item.imageUrl ? (
            <div style={{ textAlign: 'center' }}>
              <CloudUploadOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                Upload Image
              </div>
            </div>
          ) : null}
        </Upload>
        {item.imageUrl && (
          <div style={{ marginTop: '12px', position: 'relative', display: 'inline-block' }}>
            <img
              src={item.imageUrl}
              alt="Preview"
              style={{
                maxWidth: '200px',
                maxHeight: '150px',
                borderRadius: '8px',
                border: '1px solid #e8e8e8',
              }}
            />
            <CheckOutlined
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                color: '#52c41a',
                fontSize: '18px',
                background: 'white',
                borderRadius: '50%',
                padding: '2px',
              }}
            />
          </div>
        )}
      </Form.Item>

      {/* Carousel Item Actions */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontWeight: 600, fontSize: '13px' }}>Action Buttons</span>
          <Button
            type="dashed"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => addCarouselAction(index)}
          >
            Add Button
          </Button>
        </div>

        {item.actions?.map((action, actionIdx) => (
          <Card
            key={actionIdx}
            style={{
              marginBottom: '8px',
              borderRadius: '6px',
              backgroundColor: '#fafafa',
            }}
            size="small"
          >
            <Row gutter={[8, 8]}>
              <Col xs={24} sm={6}>
                <Select
                  value={action.type}
                  onChange={(value) => updateCarouselAction(index, actionIdx, 'type', value)}
                  size="small"
                  options={[
                    { label: 'Reply', value: 'reply' },
                    { label: 'URL', value: 'url' },
                    { label: 'Call', value: 'call' },
                  ]}
                />
              </Col>
              <Col xs={24} sm={9}>
                <Input
                  placeholder="Button Text"
                  size="small"
                  value={action.title}
                  onChange={(e) => updateCarouselAction(index, actionIdx, 'title', e.target.value)}
                  maxLength={40}
                />
              </Col>
              <Col xs={24} sm={9}>
                <Input
                  placeholder={action.type === 'url' ? 'https://...' : action.type === 'call' ? '+1234567890' : 'Text'}
                  size="small"
                  value={action.payload}
                  onChange={(e) => updateCarouselAction(index, actionIdx, 'payload', e.target.value)}
                />
              </Col>
              <Col xs={24} style={{ textAlign: 'right' }}>
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => removeCarouselAction(index, actionIdx)}
                >
                  Remove
                </Button>
              </Col>
            </Row>
          </Card>
        ))}
      </div>
    </Card>
  );

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
                  {editingTemplate ? 'Edit Template' : 'Create Template'}
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
                      <FormOutlined style={{
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
                        {editingTemplate ? 'Edit Template 📝' : 'Create New Template 🎨'}
                      </h1>
                      <p style={{
                        color: THEME_CONSTANTS.colors.textSecondary,
                        fontSize: THEME_CONSTANTS.typography.body.size,
                        fontWeight: 500,
                        lineHeight: THEME_CONSTANTS.typography.body.lineHeight,
                        margin: 0
                      }}>
                        Design and customize message templates with real-time mobile preview
                      </p>
                    </div>
                  </Col>
                </Row>
              </Col>
              <Col xs={24} lg={6}>
                <div style={{ textAlign: { xs: 'center', lg: 'right' } }}>
                  {/* Template actions can go here if needed */}
                </div>
              </Col>
            </Row>
          </div>

            {/* Main Form & Preview Layout */}
            <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
              {/* Left: Form Section */}
              <Col xs={24} lg={15} xl={16}>
                <Card
                  style={{
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    border: '1px solid #e8e8e8',
                    position: screens.lg ? 'sticky' : 'static',
                    top: '20px',
                  }}
                  bodyStyle={{ padding: '24px' }}
                >
                  <Form layout="vertical" form={form} onFinish={handleSubmit}>
                    {/* Template Basic Info */}
                    <Divider orientation="left" style={{ marginTop: 0, marginBottom: '20px' }}>
                      <FormOutlined style={{ marginRight: '8px' }} />
                      Template Information
                    </Divider>

                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          label="Template Name"
                          required
                          rules={[{ required: true, message: 'Please enter template name' }]}
                        >
                          <Input
                            placeholder="e.g., Welcome Message"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            maxLength={80}
                            prefix={<FileTextOutlined />}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          label="Message Type"
                          required
                          rules={[{ required: true, message: 'Please select message type' }]}
                        >
                          <Select
                            value={messageType}
                            onChange={setMessageType}
                            options={[
                              { label: '📝 Plain Text', value: 'text' },
                              { label: '🔘 Text with Actions', value: 'text-with-action' },
                              { label: '🎴 Single Rich Card', value: 'rcs' },
                              { label: '🎠 Carousel', value: 'carousel' },
                            ]}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    {/* Type Description */}
                    {typeDescriptions[messageType] && (
                      <div
                        style={{
                          padding: '12px 16px',
                          background: `${typeColors[messageType]}15`,
                          borderLeft: `4px solid ${typeColors[messageType]}`,
                          borderRadius: '6px',
                          marginBottom: '20px',
                          fontSize: '13px',
                          color: '#666',
                        }}
                      >
                        <strong>ℹ️ {getMessageTypeLabel ? getMessageTypeLabel(messageType) : messageType}:</strong> {typeDescriptions[messageType]}
                      </div>
                    )}

                    {/* Message Text */}
                    {(messageType === 'text' || messageType === 'text-with-action') && (
                      <Form.Item
                        label="Message Text"
                        required
                        rules={[{ required: true, message: 'Please enter message text' }]}
                      >
                        <Input.TextArea
                          rows={6}
                          placeholder="Enter your message..."
                          value={formData.text}
                          onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                          maxLength={2000}
                          showCount
                        />
                      </Form.Item>
                    )}

                    {/* Text with Action Buttons */}
                    {messageType === 'text-with-action' && (
                      <div style={{ marginBottom: '24px' }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '16px',
                        }}>
                          <span style={{ fontWeight: 600, fontSize: '14px' }}>Action Buttons</span>
                          <Button
                            type="dashed"
                            size="small"
                            icon={<PlusOutlined />}
                            onClick={() => addAction('main')}
                          >
                            Add Button
                          </Button>
                        </div>

                        {actions.map((action, index) => (
                          <Card
                            key={index}
                            style={{
                              marginBottom: '12px',
                              borderRadius: '8px',
                              backgroundColor: '#fafafa',
                            }}
                            size="small"
                          >
                            <Row gutter={[12, 12]}>
                              <Col xs={24} sm={6}>
                                <Select
                                  value={action.type}
                                  onChange={(value) => {
                                    const newActions = [...actions];
                                    newActions[index].type = value;
                                    setActions(newActions);
                                  }}
                                  options={[
                                    { label: '💬 Reply', value: 'reply' },
                                    { label: '🔗 URL', value: 'url' },
                                    { label: '📞 Call', value: 'call' },
                                  ]}
                                />
                              </Col>
                              <Col xs={24} sm={9}>
                                <Input
                                  placeholder="Button Text"
                                  value={action.title}
                                  onChange={(e) => {
                                    const newActions = [...actions];
                                    newActions[index].title = e.target.value;
                                    setActions(newActions);
                                  }}
                                  maxLength={40}
                                />
                              </Col>
                              <Col xs={24} sm={9}>
                                <Input
                                  placeholder={action.type === 'url' ? 'https://...' : action.type === 'call' ? '+1234567890' : 'Response text'}
                                  value={action.payload}
                                  onChange={(e) => {
                                    const newActions = [...actions];
                                    newActions[index].payload = e.target.value;
                                    setActions(newActions);
                                  }}
                                />
                              </Col>
                              <Col xs={24} style={{ textAlign: 'right' }}>
                                <Button
                                  type="text"
                                  danger
                                  size="small"
                                  icon={<DeleteOutlined />}
                                  onClick={() => removeAction(index, 'main')}
                                >
                                  Remove
                                </Button>
                              </Col>
                            </Row>
                          </Card>
                        ))}
                      </div>
                    )}

                    {/* Rich Card Section */}
                    {messageType === 'rcs' && (
                      <div style={{ marginBottom: '24px' }}>
                        <Divider orientation="left" style={{ marginTop: 0, marginBottom: '20px' }}>
                          <AppstoreOutlined style={{ marginRight: '8px' }} />
                          Rich Card Details
                        </Divider>

                        <Row gutter={[16, 16]}>
                          <Col xs={24} sm={12}>
                            <Form.Item label="Card Title" required>
                              <Input
                                placeholder="Enter card title"
                                value={richCard.title}
                                onChange={(e) => setRichCard({ ...richCard, title: e.target.value })}
                                maxLength={80}
                              />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Form.Item label="Card Subtitle">
                              <Input
                                placeholder="Optional subtitle"
                                value={richCard.subtitle}
                                onChange={(e) => setRichCard({ ...richCard, subtitle: e.target.value })}
                                maxLength={200}
                              />
                            </Form.Item>
                          </Col>
                        </Row>

                        {/* Rich Card Image */}
                        <Form.Item label="Card Image (Aspect Ratio: 2:1)">
                          <Upload
                            accept="image/*"
                            maxCount={1}
                            listType="picture-card"
                            beforeUpload={(file) => handleImageSelect(file, 'richCard')}
                            onRemove={() => handleDeleteImage('richCard')}
                          >
                            {!richCard.imageUrl ? (
                              <div style={{ textAlign: 'center' }}>
                                <CloudUploadOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
                                <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                                  Upload Image
                                </div>
                              </div>
                            ) : null}
                          </Upload>
                          {richCard.imageUrl && (
                            <div style={{ marginTop: '12px', position: 'relative', display: 'inline-block' }}>
                              <img
                                src={richCard.imageUrl}
                                alt="Preview"
                                style={{
                                  maxWidth: '200px',
                                  maxHeight: '150px',
                                  borderRadius: '8px',
                                  border: '1px solid #e8e8e8',
                                }}
                              />
                              <CheckOutlined
                                style={{
                                  position: 'absolute',
                                  top: '8px',
                                  right: '8px',
                                  color: '#52c41a',
                                  fontSize: '18px',
                                  background: 'white',
                                  borderRadius: '50%',
                                  padding: '2px',
                                }}
                              />
                            </div>
                          )}
                        </Form.Item>

                        {/* Rich Card Actions */}
                        <div style={{ marginBottom: '16px' }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '16px',
                          }}>
                            <span style={{ fontWeight: 600, fontSize: '14px' }}>Card Buttons</span>
                            <Button
                              type="dashed"
                              size="small"
                              icon={<PlusOutlined />}
                              onClick={() => addAction('richCard')}
                            >
                              Add Button
                            </Button>
                          </div>

                          {richCard.actions?.map((action, index) => (
                            <Card
                              key={index}
                              style={{
                                marginBottom: '12px',
                                borderRadius: '8px',
                                backgroundColor: '#fafafa',
                              }}
                              size="small"
                            >
                              <Row gutter={[12, 12]}>
                                <Col xs={24} sm={6}>
                                  <Select
                                    value={action.type}
                                    onChange={(value) => {
                                      const newActions = [...richCard.actions];
                                      newActions[index].type = value;
                                      setRichCard({ ...richCard, actions: newActions });
                                    }}
                                    options={[
                                      { label: '💬 Reply', value: 'reply' },
                                      { label: '🔗 URL', value: 'url' },
                                      { label: '📞 Call', value: 'call' },
                                    ]}
                                  />
                                </Col>
                                <Col xs={24} sm={9}>
                                  <Input
                                    placeholder="Button Text"
                                    value={action.title}
                                    onChange={(e) => {
                                      const newActions = [...richCard.actions];
                                      newActions[index].title = e.target.value;
                                      setRichCard({ ...richCard, actions: newActions });
                                    }}
                                    maxLength={40}
                                  />
                                </Col>
                                <Col xs={24} sm={9}>
                                  <Input
                                    placeholder={action.type === 'url' ? 'https://...' : action.type === 'call' ? '+1234567890' : 'Response text'}
                                    value={action.payload}
                                    onChange={(e) => {
                                      const newActions = [...richCard.actions];
                                      newActions[index].payload = e.target.value;
                                      setRichCard({ ...richCard, actions: newActions });
                                    }}
                                  />
                                </Col>
                                <Col xs={24} style={{ textAlign: 'right' }}>
                                  <Button
                                    type="text"
                                    danger
                                    size="small"
                                    icon={<DeleteOutlined />}
                                    onClick={() => removeAction(index, 'richCard')}
                                  >
                                    Remove
                                  </Button>
                                </Col>
                              </Row>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Carousel Section */}
                    {messageType === 'carousel' && (
                      <div style={{ marginBottom: '24px' }}>
                        <Divider orientation="left" style={{ marginTop: 0, marginBottom: '20px' }}>
                          <UnorderedListOutlined style={{ marginRight: '8px' }} />
                          Carousel Items ({carouselItems.length}/10)
                        </Divider>

                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '16px',
                        }}>
                          <span style={{ fontSize: '13px', color: '#666' }}>
                            Add up to 10 cards. Each card requires an image and at least one button.
                          </span>
                          <Button
                            type="dashed"
                            size="small"
                            icon={<PlusOutlined />}
                            onClick={addCarouselItem}
                            disabled={carouselItems.length >= 10}
                          >
                            Add Card
                          </Button>
                        </div>

                        <div ref={carouselContainerRef} style={{ maxHeight: '800px', overflowY: 'auto' }}>
                          {carouselItems.map((item, index) => renderCarouselItemEditor(item, index))}
                        </div>
                      </div>
                    )}

                    {/* Error Message */}
                    {error && (
                      <div
                        style={{
                          padding: '12px 16px',
                          background: '#ff4d4f15',
                          color: '#ff4d4f',
                          borderRadius: '6px',
                          marginBottom: '16px',
                          borderLeft: '4px solid #ff4d4f',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <ExclamationCircleOutlined />
                        {error}
                      </div>
                    )}

                    {/* Form Actions */}
                    <Divider style={{ margin: '20px 0' }} />
                    <Form.Item style={{ marginBottom: 0 }}>
                      <Space style={{ float: 'right', width: '100%', justifyContent: 'flex-end' }}>
                        <Button onClick={resetForm} icon={<ClearOutlined />}>
                          Clear All
                        </Button>
                        <Button
                          type="primary"
                          htmlType="submit"
                          loading={loading}
                          style={{ background: '#1890ff' }}
                          onClick={handleSubmit}
                          icon={editingTemplate ? <EditOutlined /> : <CheckOutlined />}
                        >
                          {editingTemplate ? '💾 Update Template' : '✨ Create Template'}
                        </Button>
                      </Space>
                    </Form.Item>
                  </Form>
                </Card>
              </Col>

              {/* Right: Mobile Preview */}
              <Col xs={24} lg={7} xl={8}>
                <Card
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MobileOutlined style={{ color: '#1890ff' }} />
                      <span>Mobile Preview</span>
                    </div>
                  }
                  style={{
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    border: '1px solid #e8e8e8',
                    position: screens.lg ? 'sticky' : 'static',
                    top: '20px',
                  }}
                  bodyStyle={{ padding: '24px', minHeight: '600px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                >
                  <RCSMessagePreview data={messageType} />

                  {!messageType && (
                    <div style={{
                      textAlign: 'center',
                      color: '#999',
                      padding: '40px 20px',
                    }}>
                      <MobileOutlined style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }} />
                      <p>Select a message type to see preview</p>
                    </div>
                  )}
                </Card>
              </Col>
            </Row>

            {/* Templates Table Section */}
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CopyOutlined style={{ color: '#1890ff' }} />
                  <span>Your Templates ({templates.length})</span>
                </div>
              }
              style={{
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                border: '1px solid #e8e8e8',
              }}
              bodyStyle={{ padding: 0 }}
            >
              <div
                style={{
                  padding: '24px',
                  borderBottom: '1px solid #e8e8e8',
                  background: 'linear-gradient(135deg, #fafafa, #f5f5f5)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <h2 style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#000',
                    margin: '0 0 4px 0',
                  }}>
                    Saved Templates
                  </h2>
                  <p style={{
                    fontSize: '13px',
                    color: '#666',
                    margin: 0,
                  }}>
                    View and manage all your created templates
                  </p>
                </div>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={fetchTemplates}
                  loading={tableLoading}
                >
                  Refresh
                </Button>
              </div>

              {tableLoading ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '60px 20px',
                }}>
                  <Spin />
                  <p style={{
                    marginTop: '16px',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#999',
                  }}>
                    Loading templates...
                  </p>
                </div>
              ) : templates.length === 0 ? (
                <Empty description="No templates yet" style={{ padding: '60px 20px' }} />
              ) : (
                <Table
                  columns={columns}
                  dataSource={templates}
                  rowKey="_id"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `Total ${total} templates`,
                  }}
                  scroll={{ x: 800 }}
                  style={{ borderCollapse: 'collapse' }}
                />
              )}
            </Card>
        </div>
      </div>

      {/* Full-Screen Preview Modal */}
      {previewOpen && previewData && (
        <Modal
          title={
            <div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#000' }}>
                Template Preview
              </div>
              <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                {getMessageTypeLabel ? getMessageTypeLabel(previewData.messageType) : previewData.messageType}
              </div>
            </div>
          }
          open={previewOpen}
          onCancel={() => setPreviewOpen(false)}
          width={800}
          footer={null}
          bodyStyle={{ padding: '24px' }}
          style={{ maxWidth: '90vw' }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            maxHeight: '600px',
            overflowY: 'auto',
          }}>
            <RCSMessagePreview data={previewData} />
          </div>
        </Modal>
      )}

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