import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Card,
  Form,
  Button,
  Space,
  Row,
  Col,
  Steps,
  DatePicker,
  Upload,
  Divider,
  Modal,
  Input,
  Empty,
  Tag,
  Tooltip,
  Alert,
  Statistic,
  Progress,
  Layout,
  Breadcrumb,
  Badge,
  Avatar,
  Drawer,
  Radio,
  Checkbox,
  Spin,
  Popconfirm,
  Select,
  Table,
  message,
} from 'antd';
import {
  SendOutlined,
  UploadOutlined,
  EyeOutlined,
  DeleteOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  DownloadOutlined,
  PhoneOutlined,
  MailOutlined,
  UserOutlined,
  CalendarOutlined,
  FileExcelOutlined,
  FormOutlined,
  CopyOutlined,
  CloseOutlined,
  CheckOutlined,
  ArrowRightOutlined,
  HomeOutlined,
  FileTextOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  PercentageOutlined,
  RiseOutlined,
  ReloadOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { FaMobileAlt, FaCheckDouble } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import RCSMessagePreview from '../../components/RCSMesagePreview';
import { THEME_CONSTANTS } from '../../theme';
import { fetchUserTemplates } from '../../redux/slices/templateSlice';
import { sendBulkMessage, checkCapability } from '../../redux/slices/campaignSlice';
import { _get, _post } from '../../helper/apiClient.jsx';

// Add CSS for animations
const styles = `
  @keyframes progressFill {
    0% { width: 0%; }
    100% { width: 100%; }
  }
  
  .custom-step-circle {
    position: relative;
  }
  
  .custom-step-number {
    position: absolute;
    top: -8px;
    right: -8px;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

const MESSAGE_TYPES = {
  text: 'Plain Text',
  'text-with-action': 'Text with Actions',
  rcs: 'RCS Rich Card',
  carousel: 'Carousel',
  webview: 'Webview Action',
  'dialer-action': 'Dialer Action',
};

const BUTTON_TYPES = ['URL Button', 'Call Button', 'Quick Reply Button'];

// Virtual scrolling component for large contact lists
  const VirtualizedContactList = ({ contacts, deleteContact, loading }) => {
  const [scrollTop, setScrollTop] = useState(0);
  const itemHeight = 50;
  const containerHeight = 384;
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleCount + 5, contacts.length);
  const visibleItems = contacts.slice(startIndex, endIndex);
  const totalHeight = contacts.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  if (contacts.length === 0) {
    return <Empty description="No contacts added" style={{ padding: '40px 0' }} />;
  }

  return (
    <div style={{ border: `1px solid ${THEME_CONSTANTS.colors.border}`, borderRadius: THEME_CONSTANTS.radius.md, overflow: 'hidden' }}>
      <div
        style={{ height: containerHeight, overflowY: 'auto' }}
        onScroll={(e) => setScrollTop(e.target.scrollTop)}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div style={{ transform: `translateY(${offsetY}px)` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8fafc', position: 'sticky', top: 0, zIndex: 10 }}>
                <tr>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: THEME_CONSTANTS.colors.textSecondary, borderBottom: `1px solid ${THEME_CONSTANTS.colors.border}` }}>
                    SN
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: THEME_CONSTANTS.colors.textSecondary, borderBottom: `1px solid ${THEME_CONSTANTS.colors.border}` }}>
                    Phone
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: THEME_CONSTANTS.colors.textSecondary, borderBottom: `1px solid ${THEME_CONSTANTS.colors.border}` }}>
                    Status
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: THEME_CONSTANTS.colors.textSecondary, borderBottom: `1px solid ${THEME_CONSTANTS.colors.border}` }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((contact, idx) => {
                  const actualIndex = startIndex + idx;
                  const isChecking = contact.checking;
                  const isCapable = contact.capable;

                  return (
                    <tr
                      key={contact.id}
                      style={{
                        height: itemHeight,
                        borderBottom: `1px solid ${THEME_CONSTANTS.colors.border}`,
                        background: actualIndex % 2 === 0 ? '#ffffff' : '#f8fafc',
                      }}
                    >
                      <td style={{ padding: '8px 16px', fontSize: '13px' }}>{actualIndex + 1}</td>
                      <td style={{ padding: '8px 16px', fontSize: '13px', fontFamily: 'monospace' }}>
                        <span style={{
                          color: isCapable === true ? THEME_CONSTANTS.colors.success : isCapable === false ? THEME_CONSTANTS.colors.error : THEME_CONSTANTS.colors.text
                        }}>
                          {contact.number}
                        </span>
                      </td>
                      <td style={{ padding: '8px 16px', fontSize: '13px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {isChecking && <Spin size="small" />}
                          {isCapable === true && <Tag color="green">✓ Valid</Tag>}
                          {isCapable === false && <Tag color="red">✗ Invalid</Tag>}
                          {isCapable === null && !isChecking && <Tag>Pending</Tag>}
                        </div>
                      </td>
                      <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => deleteContact(contact.id)}
                          disabled={loading}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

function CreateCampaign() {
  const { user, token } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  // Redux state
  const { userTemplates, loading: templatesLoading, error: templatesError } = useSelector(state => state.templates);
  const { sendingMessage, messageError, capabilityResults } = useSelector(state => state.campaigns);

  // State Management
  const [currentStep, setCurrentStep] = useState(0);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [templateSearch, setTemplateSearch] = useState('');
  const [templateFilter, setTemplateFilter] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [messageType, setMessageType] = useState('text');
  const [messageText, setMessageText] = useState('');
  const [cardDescription, setCardDescription] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [footer, setFooter] = useState('');
  const [buttons, setButtons] = useState([]);
  const [carouselCards, setCarouselCards] = useState([]);

  const [recipients, setRecipients] = useState([]);
  const [sendSchedule, setSendSchedule] = useState({ type: 'immediate', dateTime: null });
  const [campaignName, setCampaignName] = useState('');

  const [manualContactModal, setManualContactModal] = useState(false);
  const [manualContactForm] = Form.useForm();

  const [checkingCapability, setCheckingCapability] = useState(false);
  const [campaignSummary, setCampaignSummary] = useState(null);
  const [previewDrawer, setPreviewDrawer] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [addAmount, setAddAmount] = useState('');

  // Load templates on mount
  useEffect(() => {
    if (user?._id) {
      dispatch(fetchUserTemplates({ userId: user._id }));
    }
  }, [user, dispatch]);

  // Load Templates from Redux
  const loadTemplates = () => {
    if (user?._id) {
      dispatch(fetchUserTemplates({ userId: user._id }));
    }
  };

  // Filter templates based on search and filter
  useEffect(() => {
    let filtered = userTemplates;

    // Apply search filter
    if (templateSearch) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
        (template.text && template.text.toLowerCase().includes(templateSearch.toLowerCase())) ||
        (template.richCard?.title && template.richCard.title.toLowerCase().includes(templateSearch.toLowerCase()))
      );
    }

    // Apply type filter
    if (templateFilter !== 'all') {
      filtered = filtered.filter(template => template.messageType === templateFilter);
    }

    setFilteredTemplates(filtered);
  }, [userTemplates, templateSearch, templateFilter]);

  // Handle Template Selection
  const handleTemplateSelect = async (template) => {
    try {
      setSelectedTemplate(template);
      setMessageType(template.messageType);

      // Reset all fields
      setMessageText(template.text || template?.richCard?.title || '');
      setCardDescription(template?.richCard?.description || template?.richCard?.subtitle || '');
      setMediaUrl(template?.richCard?.imageUrl || template?.imageUrl || '');

      // Set buttons
      const templateButtons = [];
      if (template.richCard?.actions) {
        templateButtons.push(...template.richCard.actions.map((action) => ({
          id: Date.now() + Math.random(),
          type: action.type === 'url' ? 'URL Button' : action.type === 'call' ? 'Call Button' : 'Quick Reply Button',
          title: action.title,
          value: action.payload || '',
        })));
      } else if (template.actions) {
        templateButtons.push(...template.actions.map((action) => ({
          id: Date.now() + Math.random(),
          type: action.type === 'url' ? 'URL Button' : action.type === 'call' ? 'Call Button' : 'Quick Reply Button',
          title: action.title,
          value: action.payload || '',
        })));
      }
      setButtons(templateButtons);

      // Set carousel cards
      if (template.carouselItems?.length > 0) {
        setCarouselCards(
          template.carouselItems.map((item) => ({
            id: Date.now() + Math.random(),
            title: item.title,
            description: item.subtitle || item.description || '',
            imageUrl: item.imageUrl || '',
            buttons: item.actions?.map((action) => ({
              id: Date.now() + Math.random(),
              type: action.type === 'url' ? 'URL Button' : 'Call Button',
              title: action.title,
              value: action.payload || action.url || action.phoneNumber || '',
            })) || [],
          }))
        );
      }

      message.success(`Template "${template.name}" selected successfully`);
      
      // Scroll to preview section on mobile
      if (window.innerWidth <= 768) {
        setTimeout(() => {
          const previewElement = document.querySelector('.template-preview-section');
          if (previewElement) {
            previewElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    } catch (error) {
      message.error('Failed to select template: ' + error.message);
    }
  };

  // Check RCS Capability for batch of numbers using Redux
  const checkRcsCapability = async (numbers) => {
    try {
      const result = await dispatch(checkCapability({
        phoneNumbers: numbers,
        userId: user._id
      })).unwrap();
      return result;
    } catch (error) {
      console.error('Error checking capability:', error);
      throw error;
    }
  };

  // Import Excel File
  const handleExcelUpload = async (file) => {
    try {
      setCheckingCapability(true);

      if (!file) {
        message.error('Please select a file');
        return false;
      }

      // Check file type
      const allowedTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'];
      if (!allowedTypes.includes(file.type)) {
        message.error('Please upload only Excel (.xlsx, .xls) or CSV files');
        setCheckingCapability(false);
        return false;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        message.error('File size should be less than 5MB');
        setCheckingCapability(false);
        return false;
      }

      const reader = new FileReader();

      reader.onload = async (evt) => {
        try {
          const wb = XLSX.read(evt.target.result, { type: 'array', cellText: false, cellDates: false });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const data = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: '' });

          const imported = [];
          const seen = new Set();
          let skippedFirst = false;

          for (let i = 0; i < data.length; i++) {
            const row = data[i];
            if (!row || row.length === 0) continue;

            // Skip header
            if (!skippedFirst) {
              const firstCell = String(row[0] || '').toLowerCase();
              if (['index', 'sn', 'number', 'name', 'phone'].some((h) => firstCell.includes(h))) {
                skippedFirst = true;
                continue;
              }
            }

            row.forEach((cell) => {
              if (!cell && cell !== 0) return;

              let num = String(cell).trim();
              num = num.replace(/[\s\-()\.]/g, '');
              num = num.replace(/[^\d+]/g, '');

              if (num.startsWith('+91')) {
                num = num.substring(3);
              } else if (num.startsWith('+')) {
                num = num.substring(1);
                if (num.startsWith('91')) num = num.substring(2);
              } else if (num.startsWith('91') && num.length > 10) {
                num = num.substring(2);
              } else if (num.startsWith('0')) {
                num = num.substring(1);
              }

              if (/^\d{10}$/.test(num)) {
                const fullNum = '+91' + num;
                if (!seen.has(fullNum)) {
                  seen.add(fullNum);
                  imported.push(fullNum);
                }
              }
            });
          }

          if (imported.length === 0) {
            message.error('No valid phone numbers found in the file. Please check the format.');
            setCheckingCapability(false);
            return;
          }

          // Remove duplicates with existing contacts
          const existingNumbers = new Set(recipients.map(r => r.number));
          const newNumbers = imported.filter(num => !existingNumbers.has(num));

          if (newNumbers.length === 0) {
            message.warning('All numbers from the file are already added');
            setCheckingCapability(false);
            return;
          }

          // Check RCS capability
          const response = await checkRcsCapability(newNumbers);
          console.log('RCS Capability Response:', response);

          let capableNumbers = [];
          if (response && response.data) {
            // Map response data to contacts with capability status
            capableNumbers = newNumbers.map((num) => {
              const capabilityResult = response.data.find(r => r.phoneNumber === num);
              const isCapable = capabilityResult ? capabilityResult.isCapable : false;
              console.log(`Number ${num} capability:`, isCapable);
              return {
                id: Date.now() + Math.random(),
                number: num,
                capable: isCapable,
                checking: false,
              };
            });
          } else {
            // Default to false if no response
            capableNumbers = newNumbers.map((num) => ({
              id: Date.now() + Math.random(),
              number: num,
              capable: false,
              checking: false,
            }));
          }

          setRecipients((prev) => [...prev, ...capableNumbers]);
          setUploadedFile(file.name);
          const capableCount = capableNumbers.filter(c => c.capable).length;
          message.success(`${capableNumbers.length} contacts imported (${capableCount} RCS capable) from ${file.name}`);
        } catch (error) {
          console.error('Error parsing file:', error);
          message.error('Error parsing file: ' + error.message);
        } finally {
          setCheckingCapability(false);
        }
      };

      reader.onerror = () => {
        message.error('Error reading file');
        setCheckingCapability(false);
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error uploading file:', error);
      message.error('Error uploading file: ' + error.message);
      setCheckingCapability(false);
    }

    return false; // Prevent default upload
  };

  // Add Contact Manually
  const handleAddContact = async (values) => {
    try {
      setCheckingCapability(true);
      let phoneNumbers = values.phone.trim();

      if (!phoneNumbers) {
        message.error('Please enter phone numbers');
        return;
      }

      // Split by newlines and commas, clean each number
      const numbers = phoneNumbers
        .split(/[\n,]+/)
        .map(num => num.trim().replace(/[\s\-()]/g, ''))
        .filter(num => num.length > 0);

      if (numbers.length === 0) {
        message.error('Please enter valid phone numbers');
        return;
      }

      const validNumbers = [];
      const existingNumbers = new Set(recipients.map(r => r.number));

      for (let phone of numbers) {
        // Add +91 if not present
        if (!phone.startsWith('+91')) {
          if (phone.startsWith('91') && phone.length === 12) {
            phone = '+' + phone;
          } else if (phone.length === 10) {
            phone = '+91' + phone;
          } else {
            continue; // Skip invalid numbers
          }
        }

        // Validate phone number format
        if (/^\+91\d{10}$/.test(phone) && !existingNumbers.has(phone)) {
          validNumbers.push(phone);
        }
      }

      if (validNumbers.length === 0) {
        message.warning('No new valid numbers found');
        return;
      }

      // Check capability for all numbers
      const response = await checkRcsCapability(validNumbers);
      
      const newContacts = validNumbers.map(phone => {
        let isCapable = false;
        if (response && response.data) {
          const capabilityResult = response.data.find(r => r.phoneNumber === phone);
          isCapable = capabilityResult ? capabilityResult.isCapable : false;
        }
        
        return {
          id: Date.now() + Math.random(),
          number: phone,
          capable: isCapable,
          checking: false,
        };
      });

      setRecipients([...recipients, ...newContacts]);
      manualContactForm.resetFields();
      setManualContactModal(false);
      
      const capableCount = newContacts.filter(c => c.capable).length;
      message.success(`${newContacts.length} contacts added (${capableCount} RCS capable)`);
    } catch (error) {
      console.error('Error adding contacts:', error);
      message.error('Error adding contacts: ' + (error.response?.data?.message || error.message));
    } finally {
      setCheckingCapability(false);
    }
  };

  // Delete Contact
  const deleteContact = (id) => {
    setRecipients(recipients.filter((c) => c.id !== id));
    message.success('Contact removed');
  };

  // Handle Step Change
  const handleStepChange = (step) => {
    // Prevent jumping to steps without validation
    if (step > currentStep + 1) {
      return; // Don't allow jumping ahead
    }
    
    if (step === 0) {
      setCurrentStep(0);
    } else if (step === 1) {
      if (!selectedTemplate) {
        message.error('Please select a template first');
        return;
      }
      setCurrentStep(1);
    } else if (step === 2) {
      if (!selectedTemplate) {
        message.error('Please select a template first');
        return;
      }
      if (recipients.filter(r => r.capable === true).length === 0) {
        message.error('Please add valid recipients first');
        return;
      }
      setCurrentStep(2);
    }
  };

  // Send Campaign using Redux with optimized loading
  const handleSendCampaign = async () => {
    try {
      // Validation
      if (!selectedTemplate) {
        message.error('Please select a template');
        return;
      }

      if (!campaignName.trim()) {
        message.error('Please enter campaign name');
        return;
      }

      // Filter only RCS capable contacts for billing calculation
      const validRecipients = recipients.filter(r => r.capable === true);
      
      if (validRecipients.length === 0) {
        message.error('No valid RCS contacts found. Please add valid contacts.');
        return;
      }

      // Check wallet - ONLY charge for RCS capable numbers
      const totalCost = validRecipients.length * 1;
      if (user.Wallet < totalCost) {
        message.error(`Insufficient credits! Required: ₹${totalCost}, Available: ₹${user.Wallet}`);
        setShowAddMoney(true);
        return;
      }

      // Show immediate success for large campaigns
      if (recipients.length > 10000) {
        Modal.confirm({
          title: 'Large Campaign Detected',
          content: `You're about to send ${recipients.length} messages (${validRecipients.length} RCS capable). This will be processed in background. You'll receive real-time updates in Reports section.`,
          okText: 'Start Campaign',
          cancelText: 'Cancel',
          onOk: async () => {
            await processCampaign();
          }
        });
      } else {
        await processCampaign();
      }

      async function processCampaign() {
        // Build payload - include ALL recipients but only charge for RCS capable
        const payload = {
          name: campaignName.trim(),
          description: `Bulk campaign with ${recipients.length} total recipients (${validRecipients.length} RCS capable) using template: ${selectedTemplate.name}`,
          templateId: selectedTemplate._id,
          recipients: recipients.map(r => ({
            phoneNumber: r.number.replace('+91', ''), // Remove +91 prefix for backend
            variables: r.variables || {},
            isRcsCapable: r.capable === true // Flag for billing
          })),
          batchSize: Math.min(500, Math.max(100, Math.floor(recipients.length / 10))), // Dynamic batch size (max 500)
          autoStart: true,
          estimatedCost: totalCost // Only for RCS capable numbers
        };

        // Show loading with progress for large campaigns
        const hideLoading = message.loading(
          recipients.length > 10000 
            ? `Creating campaign for ${recipients.length} contacts... This may take a moment.`
            : 'Creating campaign...', 
          0
        );

        try {
          // Dispatch Redux action to create and start campaign
          const result = await dispatch(sendBulkMessage(payload)).unwrap();
          
          hideLoading();
          
          if (result.success) {
            // Show different success messages based on campaign size
            if (recipients.length > 10000) {
              Modal.success({
                title: 'Campaign Created Successfully!',
                content: (
                  <div>
                    <p>✅ Campaign "{campaignName}" has been created and started.</p>
                    <p>📊 Total Recipients: {recipients.length}</p>
                    <p>💰 RCS Capable: {validRecipients.length} (₹{totalCost} charged)</p>
                    <p>🚀 Processing in background with real-time updates.</p>
                    <p>📈 Track progress in Reports section.</p>
                  </div>
                ),
                onOk: () => navigate('/reports')
              });
            } else {
              message.success(`Campaign created! Sending to ${validRecipients.length} RCS capable numbers.`);
              setTimeout(() => navigate('/reports'), 1500);
            }
          }
        } catch (error) {
          hideLoading();
          throw error;
        }
      }
    } catch (error) {
      const errorMessage = typeof error === 'string' ? error : error?.message || 'Failed to send campaign';
      if (errorMessage.includes('Insufficient balance')) {
        setShowAddMoney(true);
      }
      message.error(errorMessage);
    }
  };

  // Download Demo Excel
  const downloadDemoExcel = () => {
    const demoData = [
      ['Index', 'Number'],
      ['1', '7201000140'],
      ['2', '7201000141'],
      ['3', '7201000142'],
    ];
    const ws = XLSX.utils.aoa_to_sheet(demoData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Contacts');
    XLSX.writeFile(wb, 'demo_contacts.xlsx');
    message.success('Demo file downloaded');
  };

  // Add Button
  const addButton = () => {
    setButtons([...buttons, { id: Date.now(), type: 'URL Button', title: '', value: '', postBackData: 'SA1L1C1' }]);
  };

  // Update Button
  const updateButton = (id, field, value) => {
    setButtons(
      buttons.map((b) => {
        if (b.id === id) {
          const updated = { ...b, [field]: value };
          if (field === 'type') {
            if (value === 'Call Button' && !updated.title) updated.title = 'Call Now';
            if (value === 'URL Button') updated.title = '';
          }
          return updated;
        }
        return b;
      })
    );
  };

  // Delete Button
  const deleteButton = (id) => {
    setButtons(buttons.filter((b) => b.id !== id));
  };

  // Add Carousel Card
  const addCarouselCard = () => {
    setCarouselCards([...carouselCards, { id: Date.now(), title: '', description: '', imageUrl: '', buttons: [] }]);
  };

  // Update Carousel Card
  const updateCarouselCard = (id, field, value) => {
    setCarouselCards(carouselCards.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  // Delete Carousel Card
  const deleteCarouselCard = (id) => {
    setCarouselCards(carouselCards.filter((c) => c.id !== id));
  };

  // Render Template Preview with RCSMessagePreview Component
  const renderTemplatePreview = (template = selectedTemplate) => {
    if (!template) {
      return (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}><FaMobileAlt /></div>
          <h4 style={{ color: THEME_CONSTANTS.colors.textSecondary, margin: 0 }}>Select a template to preview</h4>
        </div>
      );
    }

    return (
      <div style={{ 
        width: '100%',
        maxWidth: '400px',
        margin: '0 auto'
      }}>
        <RCSMessagePreview data={template} />
      </div>
    );
  };

  const contactsColumns = [
    {
      title: 'Phone',
      dataIndex: 'number',
      key: 'number',
      render: (text) => <span style={{ fontFamily: 'monospace' }}>{text}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'capable',
      key: 'capable',
      render: (capable) => {
        if (capable === true) return <Tag color="green">✓ Valid</Tag>;
        if (capable === false) return <Tag color="red">✗ Invalid</Tag>;
        return <Tag>Pending</Tag>;
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Popconfirm title="Remove contact?" onConfirm={() => deleteContact(record.id)}>
          <Button type="text" danger size="small" icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  const steps = [
    { title: 'Select Template', icon: <FormOutlined /> },
    { title: 'Add Recipients', icon: <TeamOutlined /> },
    { title: 'Review & Send', icon: <SendOutlined /> },
  ];

  // Custom Steps Component with Circular Design
  const CustomSteps = ({ current, steps, onChange }) => {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 0',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        borderRadius: '16px',
        marginBottom: '32px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
      }}>
        {steps.map((step, index) => {
          const isActive = index === current;
          const isCompleted = index < current;
          const isClickable = index <= current;
          
          return (
            <React.Fragment key={index}>
              <div
                onClick={() => isClickable && onChange && onChange(index)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: isClickable ? 'pointer' : 'default',
                  transition: 'all 0.3s ease',
                  transform: isActive && window.innerWidth > 768 ? 'scale(1.05)' : 'scale(1)',
                  position: 'relative'
                }}
              >
                {/* Circle */}
                <div 
                  className="custom-step-circle"
                  style={{
                    width: window.innerWidth <= 768 ? '40px' : '56px',
                    height: window.innerWidth <= 768 ? '40px' : '56px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: window.innerWidth <= 768 ? '16px' : '20px',
                    fontWeight: '600',
                    marginBottom: window.innerWidth <= 768 ? '8px' : '12px',
                    transition: 'all 0.3s ease',
                    background: isCompleted 
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                      : isActive 
                      ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                      : '#e5e7eb',
                    color: isCompleted || isActive ? '#ffffff' : '#9ca3af',
                    boxShadow: isActive 
                      ? '0 8px 25px rgba(59, 130, 246, 0.4)'
                      : isCompleted
                      ? '0 8px 25px rgba(16, 185, 129, 0.4)'
                      : '0 2px 8px rgba(0,0,0,0.1)',
                    border: isActive ? '3px solid rgba(59, 130, 246, 0.3)' : 'none'
                  }}
                >
                  {isCompleted ? (
                    <CheckOutlined style={{ fontSize: '24px' }} />
                  ) : (
                    React.cloneElement(step.icon, { style: { fontSize: '24px' } })
                  )}
                  
                  {/* Step Number */}
                  <div 
                    className="custom-step-number"
                    style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: isCompleted 
                        ? '#10b981'
                        : isActive 
                        ? '#3b82f6'
                        : '#9ca3af',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                    }}
                  >
                    {index + 1}
                  </div>
                </div>
                
                <div style={{
                  textAlign: 'center',
                  maxWidth: '120px'
                }}>
                  <h4 style={{
                    margin: 0,
                    fontSize: '14px',
                    fontWeight: '600',
                    color: isActive ? '#1f2937' : isCompleted ? '#374151' : '#9ca3af',
                    transition: 'color 0.3s ease'
                  }}>
                    {step.title}
                  </h4>
                  <div style={{
                    marginTop: '4px',
                    fontSize: '12px',
                    color: isCompleted ? '#10b981' : isActive ? '#3b82f6' : '#d1d5db',
                    fontWeight: '500'
                  }}>
                    {isCompleted ? 'Completed' : isActive ? 'In Progress' : 'Pending'}
                  </div>
                </div>
              </div>
              
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div style={{
                  width: '80px',
                  height: '3px',
                  margin: '0 24px',
                  marginTop: '-32px',
                  background: index < current 
                    ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                    : '#e5e7eb',
                  borderRadius: '2px',
                  transition: 'background 0.3s ease',
                  position: 'relative'
                }}>
                  {/* Animated progress */}
                  {index === current - 1 && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      height: '100%',
                      width: '100%',
                      background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                      borderRadius: '2px',
                      animation: 'progressFill 0.5s ease-in-out'
                    }} />
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <div style={{ 
        background: THEME_CONSTANTS.colors.background, 
        minHeight: '100vh',
        fontFamily: THEME_CONSTANTS.typography.body.fontFamily
      }}>
        <div style={{ 
          maxWidth: THEME_CONSTANTS.layout.maxContentWidth, 
          margin: '0 auto',
          padding: `${THEME_CONSTANTS.spacing.xl} ${THEME_CONSTANTS.spacing.lg}`,
          '@media (max-width: 768px)': {
            padding: THEME_CONSTANTS.spacing.md
          }
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
                  Bulk Message Campaign
                </span>
              </Breadcrumb.Item>
            </Breadcrumb>

            <Row gutter={[16, 16]} align="middle" justify="space-between">
              <Col xs={24} lg={18}>
                <Row gutter={[16, 16]} align="middle">
                  <Col xs={24} sm={6} md={4} lg={3}>
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
                      <SendOutlined style={{
                        color: THEME_CONSTANTS.colors.primary,
                        fontSize: '32px'
                      }} />
                    </div>
                  </Col>
                  <Col xs={24} sm={18} md={20} lg={21}>
                    <div>
                      <h1 style={{
                        fontSize: 'clamp(24px, 4vw, 32px)',
                        fontWeight: THEME_CONSTANTS.typography.h1.weight,
                        color: THEME_CONSTANTS.colors.text,
                        marginBottom: THEME_CONSTANTS.spacing.sm,
                        lineHeight: THEME_CONSTANTS.typography.h1.lineHeight
                      }}>
                        Bulk Message Campaign 📨
                      </h1>
                      <p style={{
                        color: THEME_CONSTANTS.colors.textSecondary,
                        fontSize: 'clamp(13px, 2.5vw, 14px)',
                        fontWeight: 500,
                        lineHeight: THEME_CONSTANTS.typography.body.lineHeight,
                        margin: 0
                      }}>
                        Create and manage bulk messaging campaigns with real-time delivery tracking.
                      </p>
                    </div>
                  </Col>
                </Row>
              </Col>
              <Col xs={24} lg={6}>
                <div style={{ marginTop: '16px' }}>
                  <Row gutter={[12, 12]}>
                    <Col xs={12} sm={12}>
                      <Statistic
                        title="Total Contacts"
                        value={recipients.length}
                        prefix={<TeamOutlined />}
                        valueStyle={{ color: THEME_CONSTANTS.colors.primary, fontSize: 'clamp(16px, 3vw, 20px)' }}
                      />
                    </Col>
                    <Col xs={12} sm={12}>
                      <Statistic
                        title="Wallet"
                        value={user?.Wallet?.toFixed(2) || '0.00'}
                        prefix="₹"
                        valueStyle={{ color: THEME_CONSTANTS.colors.success, fontSize: 'clamp(16px, 3vw, 20px)' }}
                      />
                    </Col>
                  </Row>
                </div>
              </Col>
            </Row>
          </div>

          {/* Enhanced Steps Navigation */}
          <CustomSteps 
            current={currentStep} 
            steps={steps} 
            onChange={handleStepChange}
          />

            {/* Step 0: Select Template */}
            {currentStep === 0 && (
              <Row gutter={[16, 24]}>
                <Col xs={24} xl={16}>
                  <Card
                    title={
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}>
                        <span style={{
                          color: THEME_CONSTANTS.colors.text,
                          fontSize: 'clamp(14px, 2.5vw, 16px)',
                          fontWeight: THEME_CONSTANTS.typography.h5.weight
                        }}>Select a Template ({userTemplates.length})</span>
                        <Space size="small">
                          <Button
                            onClick={loadTemplates}
                            icon={<ReloadOutlined />}
                            loading={templatesLoading}
                            size="small"
                            style={{ 
                              borderColor: THEME_CONSTANTS.colors.border,
                              color: THEME_CONSTANTS.colors.textSecondary
                            }}
                          >
                            Refresh
                          </Button>
                          <Button
                            type="primary"
                            onClick={() => navigate('/templates')}
                            icon={<PlusOutlined />}
                            size="small"
                            style={{ 
                              backgroundColor: THEME_CONSTANTS.colors.primary,
                              borderColor: THEME_CONSTANTS.colors.primary
                            }}
                          >
                            Create New
                          </Button>
                        </Space>
                      </div>
                    }
                    style={{
                      background: THEME_CONSTANTS.colors.surface,
                      border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                      borderRadius: THEME_CONSTANTS.radius.lg,
                      boxShadow: THEME_CONSTANTS.shadow.sm
                    }}
                    bodyStyle={{ padding: 'clamp(16px, 3vw, 24px)' }}
                  >
                    {templatesLoading ? (
                      <div style={{ textAlign: 'center', padding: `${THEME_CONSTANTS.spacing.xxxl} ${THEME_CONSTANTS.spacing.lg}` }}>
                        <Spin size="large" />
                        <p style={{ 
                          marginTop: THEME_CONSTANTS.spacing.lg, 
                          color: THEME_CONSTANTS.colors.textSecondary,
                          fontSize: THEME_CONSTANTS.typography.body.size
                        }}>Loading templates...</p>
                      </div>
                    ) : filteredTemplates.length === 0 ? (
                      <Empty
                        description={
                          <div>
                            <p style={{ 
                              marginBottom: THEME_CONSTANTS.spacing.sm,
                              color: THEME_CONSTANTS.colors.text,
                              fontSize: THEME_CONSTANTS.typography.body.size
                            }}>No templates found</p>
                            <p style={{ 
                              fontSize: THEME_CONSTANTS.typography.caption.size, 
                              color: THEME_CONSTANTS.colors.textSecondary, 
                              margin: 0 
                            }}>
                              Create your first template to start sending messages
                            </p>
                          </div>
                        }
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      >
                        <Button 
                          type="primary" 
                          onClick={() => navigate('/templates')} 
                          icon={<PlusOutlined />}
                          style={{
                            background: THEME_CONSTANTS.colors.primary,
                            borderColor: THEME_CONSTANTS.colors.primary,
                            borderRadius: THEME_CONSTANTS.radius.md
                          }}
                        >
                          Create Your First Template
                        </Button>
                      </Empty>
                    ) : (
                      <>
                        {/* Search and Filter */}
                        <div style={{ 
                          marginBottom: '16px', 
                          display: 'flex', 
                          gap: '8px', 
                          alignItems: 'center', 
                          justifyContent: 'flex-end',
                          flexDirection: window.innerWidth <= 768 ? 'column' : 'row'
                        }}>
                          <Input.Search
                            placeholder={window.innerWidth <= 768 ? 'Search...' : 'Search templates...'}
                            value={templateSearch}
                            onChange={(e) => setTemplateSearch(e.target.value)}
                            style={{ width: window.innerWidth <= 768 ? '100%' : 'min(250px, 100%)', minWidth: '200px' }}
                            allowClear
                            size={window.innerWidth <= 768 ? 'small' : 'default'}
                          />
                          <Select
                            value={templateFilter}
                            onChange={setTemplateFilter}
                            style={{ width: window.innerWidth <= 768 ? '100%' : 'min(150px, 100%)', minWidth: '120px' }}
                            size={window.innerWidth <= 768 ? 'small' : 'default'}
                            options={[
                              { label: 'All Types', value: 'all' },
                              { label: 'Text', value: 'text' },
                              { label: 'Text + Action', value: 'text-with-action' },
                              { label: 'RCS Rich Card', value: 'rcs' },
                              { label: 'Carousel', value: 'carousel' }
                            ]}
                          />
                        </div>

                        {/* Templates Table */}
                        <Table
                          dataSource={filteredTemplates}
                          rowKey="_id"
                          pagination={{ pageSize: 10, showSizeChanger: true }}
                          onRow={(record) => ({
                            onClick: () => handleTemplateSelect(record),
                            style: {
                              cursor: 'pointer',
                              backgroundColor: selectedTemplate?._id === record._id ? THEME_CONSTANTS.colors.primaryLight : 'transparent'
                            }
                          })}
                          scroll={{ x: 600 }}
                          size="small"
                          columns={[
                            {
                              title: 'Template Name',
                              dataIndex: 'name',
                              key: 'name',
                              width: 200,
                              render: (text, record) => (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontSize: '16px' }}>
                                    {record.messageType === 'text' ? '💬' :
                                      record.messageType === 'rcs' ? '🎨' :
                                        record.messageType === 'carousel' ? '🎠' :
                                          record.messageType === 'text-with-action' ? '🔗' : '📧'}
                                  </span>
                                  <div>
                                    <div style={{ 
                                      fontWeight: 600,
                                      color: THEME_CONSTANTS.colors.text
                                    }}>{text}</div>
                                    <div style={{ 
                                      fontSize: '11px', 
                                      color: THEME_CONSTANTS.colors.textSecondary 
                                    }}>
                                      {MESSAGE_TYPES[record.messageType] || record.messageType}
                                    </div>
                                  </div>
                                </div>
                              )
                            },
                            {
                              title: 'Content Preview',
                              key: 'preview',
                              width: 250,
                              render: (_, record) => (
                                <div style={{ maxWidth: '200px' }}>
                                  {record.text && (
                                    <div style={{ 
                                      fontSize: '12px', 
                                      color: THEME_CONSTANTS.colors.textSecondary, 
                                      marginBottom: '4px' 
                                    }}>
                                      {record.text.length > 30 ? record.text.substring(0, 30) + '...' : record.text}
                                    </div>
                                  )}
                                  {record.richCard?.title && (
                                    <div style={{ 
                                      fontSize: '12px', 
                                      fontWeight: 500,
                                      color: THEME_CONSTANTS.colors.text
                                    }}>
                                      {record.richCard.title}
                                    </div>
                                  )}
                                  {record.messageType === 'text-with-action' && record.actions && record.actions.length > 0 && (
                                    <div style={{ marginTop: '4px' }}>
                                      {record.actions.slice(0, 2).map((action, idx) => (
                                        <Tag key={idx} size="small" style={{ fontSize: '10px', marginBottom: '2px' }}>
                                          {action.title}
                                        </Tag>
                                      ))}
                                      {record.actions.length > 2 && (
                                        <Tag size="small" style={{ fontSize: '10px' }}>+{record.actions.length - 2} more</Tag>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )
                            },
                            {
                              title: 'Created',
                              dataIndex: 'createdAt',
                              key: 'createdAt',
                              width: 100,
                              render: (date) => (
                                <span style={{
                                  color: THEME_CONSTANTS.colors.textSecondary,
                                  fontSize: '11px'
                                }}>
                                  {new Date(date).toLocaleDateString()}
                                </span>
                              )
                            }
                          ]}
                        />
                      </>
                    )}

                    {/* Navigation Buttons */}
                    <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        type="primary"
                        onClick={() => {
                          if (!selectedTemplate) {
                            message.error('Please select a template to continue');
                            return;
                          }
                          setCurrentStep(1);
                        }}
                        icon={<ArrowRightOutlined />}
                        size={window.innerWidth <= 768 ? 'default' : 'large'}
                        block={window.innerWidth <= 768}
                        style={{ 
                          backgroundColor: THEME_CONSTANTS.colors.primary,
                          borderColor: THEME_CONSTANTS.colors.primary
                        }}
                      >
                        {window.innerWidth <= 768 ? 'Next' : 'Next: Add Recipients'}
                      </Button>
                    </div>
                  </Card>
                </Col>

                <Col xs={24} xl={8}>
                  <div
                    className="template-preview-section"
                    style={{
                      background: THEME_CONSTANTS.colors.surface,
                      border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                      borderRadius: THEME_CONSTANTS.radius.lg,
                      position: 'sticky',
                      top: '20px',
                      padding: 'clamp(12px, 2vw, 16px)',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      minHeight: 'clamp(300px, 50vh, 500px)',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ width: '100%', maxWidth: '100%' }}>
                      {renderTemplatePreview()}
                    </div>
                  </div>
                </Col>
              </Row>
            )}

            {/* Step 1: Add Recipients */}
            {currentStep === 1 && (
              <Row gutter={[16, 24]}>
                <Col xs={24} xl={16}>
                  <Card
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <span>Manage Recipients</span>
                          <div style={{ fontSize: '12px', fontWeight: 400, color: THEME_CONSTANTS.colors.textSecondary, marginTop: '4px' }}>
                            {recipients.length} contacts added • {recipients.filter(r => r.capable === true).length} RCS capable
                          </div>
                        </div>
                        {recipients.length > 0 && (
                          <Button
                            danger
                            size="small"
                            onClick={() => {
                              Modal.confirm({
                                title: 'Clear All Contacts',
                                content: 'Are you sure you want to remove all contacts?',
                                onOk: () => {
                                  setRecipients([]);
                                  message.success('All contacts cleared');
                                }
                              });
                            }}
                            style={{ padding: '4px 8px' }}
                          >
                            Clear All
                          </Button>
                        )}
                      </div>
                    }
                    style={{
                      background: THEME_CONSTANTS.colors.surface,
                      border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                      borderRadius: THEME_CONSTANTS.radius.lg,
                    }}
                    bodyStyle={{ padding: '24px' }}
                  >
                    <Space direction="vertical" style={{ width: '100%' }} size="large">
                      {/* Upload Options */}
                      <div style={{
                        background: '#f8fafc',
                        borderRadius: THEME_CONSTANTS.radius.md,
                        padding: '20px',
                        border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                      }}>
                        <h4 style={{ margin: '0 0 16px 0', color: THEME_CONSTANTS.colors.text }}>Add Contacts</h4>
                        <Row gutter={[16, 16]}>
                          <Col xs={12} sm={6}>
                            <Upload
                              beforeUpload={handleExcelUpload}
                              accept=".xlsx,.xls,.csv"
                              maxCount={1}
                              showUploadList={false}
                            >
                              <Button
                                icon={<UploadOutlined />}
                                loading={checkingCapability}
                                block
                                size={window.innerWidth <= 768 ? 'default' : 'large'}
                                style={{ height: window.innerWidth <= 768 ? '40px' : '48px' }}
                              >
                                {window.innerWidth <= 768 ? 'Import' : 'Import Excel'}
                              </Button>
                            </Upload>
                          </Col>
                          <Col xs={12} sm={6}>
                            <Button
                              icon={<DownloadOutlined />}
                              onClick={downloadDemoExcel}
                              block
                              size={window.innerWidth <= 768 ? 'default' : 'large'}
                              style={{ height: window.innerWidth <= 768 ? '40px' : '48px' }}
                            >
                              {window.innerWidth <= 768 ? 'Demo' : 'Download Demo'}
                            </Button>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Button
                              icon={<PlusOutlined />}
                              type="primary"
                              onClick={() => setManualContactModal(true)}
                              block
                              size={window.innerWidth <= 768 ? 'default' : 'large'}
                              style={{ height: window.innerWidth <= 768 ? '40px' : '48px' }}
                            >
                              {window.innerWidth <= 768 ? 'Manual' : 'Add Manually'}
                            </Button>
                          </Col>
                        </Row>

                        {uploadedFile && (
                          <div style={{ marginTop: '12px', padding: '8px 12px', background: '#e6f7ff', borderRadius: '6px', fontSize: '12px' }}>
                            📄 Last uploaded: {uploadedFile}
                          </div>
                        )}
                      </div>

                      {/* Contact Statistics */}
                      {recipients.length > 0 && (
                        <div style={{
                          background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.primaryLight} 0%, #e0f2fe 100%)`,
                          borderRadius: THEME_CONSTANTS.radius.lg,
                          padding: 'clamp(16px, 3vw, 24px)',
                          color: THEME_CONSTANTS.colors.text,
                          border: `1px solid ${THEME_CONSTANTS.colors.primary}20`
                        }}>
                          <h4 style={{ color: THEME_CONSTANTS.colors.text, margin: '0 0 16px 0', fontSize: 'clamp(14px, 2.5vw, 16px)' }}>Contact Statistics</h4>
                          <Row gutter={[12, 12]}>
                            <Col xs={12} sm={6}>
                              <div>
                                <div style={{ fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: 700, marginBottom: '4px' }}>
                                  {recipients.length}
                                </div>
                                <div style={{ fontSize: 'clamp(10px, 2vw, 11px)', opacity: 0.9 }}>Total Contacts</div>
                              </div>
                            </Col>
                            <Col xs={12} sm={6}>
                              <div>
                                <div style={{ fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: 700, marginBottom: '4px', color: THEME_CONSTANTS.colors.success }}>
                                  {recipients.filter(r => r.capable === true).length}
                                </div>
                                <div style={{ fontSize: 'clamp(10px, 2vw, 11px)', opacity: 0.9 }}>RCS Capable</div>
                              </div>
                            </Col>
                            <Col xs={12} sm={6}>
                              <div>
                                <div style={{ fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: 700, marginBottom: '4px', color: THEME_CONSTANTS.colors.danger }}>
                                  {recipients.filter(r => r.capable === false).length}
                                </div>
                                <div style={{ fontSize: 'clamp(10px, 2vw, 11px)', opacity: 0.9 }}>Not Capable</div>
                              </div>
                            </Col>
                            <Col xs={12} sm={6}>
                              <div>
                                <div style={{ fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: 700, marginBottom: '4px', color: THEME_CONSTANTS.colors.warning }}>
                                  ₹{(recipients.length * 1).toFixed(0)}
                                </div>
                                <div style={{ fontSize: 'clamp(10px, 2vw, 11px)', opacity: 0.9 }}>Est. Cost</div>
                              </div>
                            </Col>
                          </Row>
                        </div>
                      )}

                      {/* Contact List */}
                      {recipients.length > 0 && (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <h4 style={{ margin: 0 }}>Valid Contacts ({recipients.filter(r => r.capable === true).length})</h4>
                          </div>
                          <Table
                            columns={contactsColumns}
                            dataSource={recipients.filter(r => r.capable === true)}
                            rowKey="id"
                            pagination={{
                              pageSize: 10,
                              showSizeChanger: true,
                              showQuickJumper: true,
                              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} valid contacts`,
                              pageSizeOptions: ['10', '20', '50', '100'],
                            }}
                            size="small"
                            scroll={{ y: 400 }}
                            style={{
                              border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                              borderRadius: THEME_CONSTANTS.radius.md,
                            }}
                          />
                        </div>
                      )}

                      {recipients.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>📞</div>
                          <h4 style={{ color: THEME_CONSTANTS.colors.textSecondary, margin: '0 0 8px 0' }}>No contacts added yet</h4>
                          <p style={{ fontSize: '14px', color: THEME_CONSTANTS.colors.textSecondary, margin: 0 }}>
                            Upload an Excel file or add contacts manually to get started
                          </p>
                        </div>
                      )}

                      {/* Navigation Buttons */}
                      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                        <Button
                          onClick={() => setCurrentStep(0)}
                          icon={<ArrowLeftOutlined />}
                          size={window.innerWidth <= 768 ? 'default' : 'large'}
                          style={{ flex: window.innerWidth <= 768 ? '1' : 'none' }}
                        >
                          {window.innerWidth <= 768 ? 'Back' : 'Previous'}
                        </Button>
                        <Button
                          type="primary"
                          onClick={() => {
                            if (recipients.filter(r => r.capable === true).length === 0) {
                              message.error('Please add at least one valid contact to continue');
                              return;
                            }
                            setCurrentStep(2);
                          }}
                          icon={<ArrowRightOutlined />}
                          size={window.innerWidth <= 768 ? 'default' : 'large'}
                          style={{ flex: window.innerWidth <= 768 ? '1' : 'none' }}
                        >
                          {window.innerWidth <= 768 ? 'Next' : 'Next: Review & Send'}
                        </Button>
                      </div>
                    </Space>
                  </Card>
                </Col>

                <Col xs={24} xl={8}>
                  <div style={{ position: 'sticky', top: '20px' }}>
                    <Space direction="vertical" style={{ width: '100%' }} size="large">
                      <Card
                        title="Campaign Summary"
                        style={{
                          background: THEME_CONSTANTS.colors.surface,
                          border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                          borderRadius: THEME_CONSTANTS.radius.lg,
                        }}
                        bodyStyle={{ padding: '20px' }}
                      >
                      <Space direction="vertical" style={{ width: '100%' }} size="large">
                        <div>
                          <Statistic
                            title="Selected Template"
                            value={selectedTemplate?.name || 'None'}
                            valueStyle={{ fontSize: '16px', color: THEME_CONSTANTS.colors.primary }}
                          />
                        </div>
                        <div>
                          <Statistic
                            title="Total Recipients"
                            value={recipients.filter(r => r.capable === true).length}
                            valueStyle={{ fontSize: '24px', color: THEME_CONSTANTS.colors.text }}
                          />
                        </div>
                        <div>
                          <Statistic
                            title="RCS Capable Contacts"
                            value={recipients.filter((r) => r.capable === true).length}
                            valueStyle={{ fontSize: '20px', color: THEME_CONSTANTS.colors.success }}
                          />
                        </div>
                        {recipients.filter(r => r.capable === true).length > 0 && (
                          <div>
                            <Statistic
                              title="Estimated Cost"
                              value={`₹${(recipients.filter(r => r.capable === true).length * 1).toFixed(2)}`}
                              valueStyle={{ fontSize: '20px', color: THEME_CONSTANTS.colors.warning }}
                            />
                          </div>
                        )}

                        {recipients.length > 0 && (
                          <div style={{
                            background: '#f0f5ff',
                            padding: '16px',
                            borderRadius: THEME_CONSTANTS.radius.md,
                            border: `1px solid ${THEME_CONSTANTS.colors.primary}20`,
                          }}>
                            <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary, marginBottom: '8px' }}>
                              DELIVERY RATE
                            </div>
                            <Progress
                              percent={Math.round((recipients.filter(r => r.capable === true).length / recipients.length) * 100)}
                              strokeColor={THEME_CONSTANTS.colors.success}
                              size="small"
                            />
                            <div style={{ fontSize: '11px', color: THEME_CONSTANTS.colors.textSecondary, marginTop: '4px' }}>
                              {recipients.filter(r => r.capable === true).length} out of {recipients.length} contacts can receive RCS messages
                            </div>
                          </div>
                        )}
                      </Space>
                    </Card>
                    </Space>
                  </div>
                </Col>
              </Row>
            )}

            {/* Step 2: Review & Send */}
            {currentStep === 2 && (
              <Row gutter={[16, 24]}>
                <Col xs={24} xl={16}>
                  <Space direction="vertical" style={{ width: '100%' }} size="large">
                    {/* Campaign Preview */}
                    <Card
                      title="Campaign Preview"
                      style={{
                        background: THEME_CONSTANTS.colors.surface,
                        border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                        borderRadius: THEME_CONSTANTS.radius.lg,
                      }}
                      bodyStyle={{ padding: '24px' }}
                    >
                      <div style={{ marginBottom: THEME_CONSTANTS.spacing.xxl }}>
                        <div style={{ 
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          minHeight: window.innerWidth <= 768 ? '400px' : '500px'
                        }}>
                          {renderTemplatePreview(selectedTemplate)}
                        </div>
                      </div>
                    </Card>

                    {/* Campaign Details */}
                    <Card
                      title="Campaign Details"
                      style={{
                        background: THEME_CONSTANTS.colors.surface,
                        border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                        borderRadius: THEME_CONSTANTS.radius.lg,
                      }}
                      bodyStyle={{ padding: '24px' }}
                    >
                      <Row gutter={[24, 16]}>
                        <Col xs={24} sm={12}>
                          <div style={{
                            padding: '16px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: THEME_CONSTANTS.radius.md,
                            color: 'white',
                          }}>
                            <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '4px' }}>TEMPLATE</div>
                            <div style={{ fontSize: '18px', fontWeight: 600 }}>{selectedTemplate?.name}</div>
                            <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>
                              {MESSAGE_TYPES[selectedTemplate?.messageType]}
                            </div>
                          </div>
                        </Col>
                        <Col xs={24} sm={12}>
                          <div style={{
                            padding: '16px',
                            background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
                            borderRadius: THEME_CONSTANTS.radius.md,
                            color: 'white',
                          }}>
                            <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '4px' }}>RECIPIENTS</div>
                            <div style={{ fontSize: '18px', fontWeight: 600 }}>{recipients.length} contacts</div>
                            <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>
                              {recipients.filter(r => r.capable === true).length} RCS capable
                            </div>
                          </div>
                        </Col>
                        <Col xs={24} sm={12}>
                          <div style={{
                            padding: '16px',
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            borderRadius: THEME_CONSTANTS.radius.md,
                            color: 'white',
                          }}>
                            <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '4px' }}>SEND TIME</div>
                            <div style={{ fontSize: '18px', fontWeight: 600 }}>
                              {sendSchedule.type === 'immediate' ? 'Immediately' : dayjs(sendSchedule.dateTime).format('DD/MM/YY HH:mm')}
                            </div>
                            <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>
                              {sendSchedule.type === 'immediate' ? 'Send now' : 'Scheduled'}
                            </div>
                          </div>
                        </Col>
                        <Col xs={24} sm={12}>
                          <div style={{
                            padding: '16px',
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                            borderRadius: THEME_CONSTANTS.radius.md,
                            color: 'white',
                          }}>
                            <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '4px' }}>TOTAL COST</div>
                            <div style={{ fontSize: '18px', fontWeight: 600 }}>₹{(recipients.length * 1).toFixed(2)}</div>
                            <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>
                              ₹1 per contact
                            </div>
                          </div>
                        </Col>
                      </Row>

                      <Divider style={{ margin: '24px 0' }} />

                      <Form layout="vertical">
                        <Form.Item
                          label="Campaign Name"
                          required
                          style={{ marginBottom: '24px' }}
                        >
                          <Input
                            placeholder="Enter campaign name"
                            value={campaignName}
                            onChange={(e) => setCampaignName(e.target.value)}
                            size="large"
                            style={{ borderRadius: THEME_CONSTANTS.radius.md }}
                          />
                        </Form.Item>
                      </Form>

                      {/* Wallet Check */}
                      {user?.Wallet < recipients.filter(r => r.capable === true).length * 1 ? (
                        <Alert
                          type="error"
                          showIcon
                          message="Insufficient Balance"
                          description={
                            <div>
                              <p style={{ margin: '8px 0' }}>
                                Required: ₹{(recipients.filter(r => r.capable === true).length * 1).toFixed(2)} | Available: ₹{user?.Wallet?.toFixed(2) || '0.00'}
                              </p>
                              <Button
                                type="primary"
                                size="small"
                                onClick={() => setShowAddMoney(true)}
                              >
                                Add Money to Wallet
                              </Button>
                            </div>
                          }
                          style={{ marginBottom: '24px' }}
                        />
                      ) : (
                        <Alert
                          type="success"
                          showIcon
                          message="Ready to Send"
                          description={`Your wallet balance (₹${user?.Wallet?.toFixed(2)}) is sufficient for this campaign.`}
                          style={{ marginBottom: '24px' }}
                        />
                      )}

                      <div style={{ 
                        marginTop: '24px', 
                        display: 'flex', 
                        gap: '12px',
                        flexDirection: window.innerWidth <= 768 ? 'column-reverse' : 'row',
                        justifyContent: window.innerWidth <= 768 ? 'stretch' : 'flex-start'
                      }}>
                        <Button
                          onClick={() => setCurrentStep(1)}
                          size={window.innerWidth <= 768 ? 'large' : 'large'}
                          style={{ 
                            height: '48px',
                            flex: window.innerWidth <= 768 ? '1' : 'none',
                            minWidth: window.innerWidth <= 768 ? 'auto' : '140px'
                          }}
                        >
                          {window.innerWidth <= 768 ? 'Back' : 'Back to Recipients'}
                        </Button>
                        <Button
                          type="primary"
                          size="large"
                          loading={sendingMessage}
                          onClick={handleSendCampaign}
                          icon={<SendOutlined />}
                          disabled={!campaignName.trim() || user?.Wallet < recipients.filter(r => r.capable === true).length * 1}
                          style={{
                            height: '48px',
                            flex: window.innerWidth <= 768 ? '1' : 'none',
                            minWidth: window.innerWidth <= 768 ? 'auto' : '180px'
                          }}
                        >
                          {sendingMessage ? 'Sending...' : 'Send Campaign'}
                        </Button>
                      </div>
                    </Card>
                  </Space>
                </Col>

                <Col xs={24} xl={8}>
                  <Card
                    title="Final Summary"
                    style={{
                      background: THEME_CONSTANTS.colors.surface,
                      border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                      borderRadius: THEME_CONSTANTS.radius.lg,
                      position: 'sticky',
                      top: '20px',
                    }}
                    bodyStyle={{ padding: '20px' }}
                  >
                    <Space direction="vertical" style={{ width: '100%' }} size="large">
                      <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🚀</div>
                        <h3 style={{ margin: '0 0 8px 0', color: THEME_CONSTANTS.colors.text }}>Ready to Launch</h3>
                        <p style={{ fontSize: '14px', color: THEME_CONSTANTS.colors.textSecondary, margin: 0 }}>
                          Your campaign is ready to be sent
                        </p>
                      </div>

                      <Divider style={{ margin: '16px 0' }} />

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '14px', color: THEME_CONSTANTS.colors.textSecondary }}>Valid Recipients</span>
                          <span style={{ fontSize: '16px', fontWeight: 600 }}>{recipients.filter(r => r.capable === true).length}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '14px', color: THEME_CONSTANTS.colors.textSecondary }}>RCS Capable</span>
                          <span style={{ fontSize: '16px', fontWeight: 600, color: THEME_CONSTANTS.colors.success }}>
                            {recipients.filter(r => r.capable === true).length}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '14px', color: THEME_CONSTANTS.colors.textSecondary }}>Campaign Cost</span>
                          <span style={{ fontSize: '16px', fontWeight: 600, color: THEME_CONSTANTS.colors.warning }}>
                            ₹{(recipients.filter(r => r.capable === true).length * 1).toFixed(2)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                          <span style={{ fontSize: '14px', color: THEME_CONSTANTS.colors.textSecondary }}>Wallet Balance</span>
                          <span style={{
                            fontSize: '16px',
                            fontWeight: 600,
                            color: user?.Wallet >= recipients.filter(r => r.capable === true).length * 1 ? THEME_CONSTANTS.colors.success : THEME_CONSTANTS.colors.error
                          }}>
                            ₹{user?.Wallet?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                      </div>

                      <div style={{
                        background: user?.Wallet >= recipients.filter(r => r.capable === true).length * 1 ? '#f0f9ff' : '#fef2f2',
                        padding: '16px',
                        borderRadius: THEME_CONSTANTS.radius.md,
                        border: `1px solid ${user?.Wallet >= recipients.filter(r => r.capable === true).length * 1 ? '#0ea5e9' : '#ef4444'}20`,
                      }}>
                        <div style={{
                          fontSize: '12px',
                          color: user?.Wallet >= recipients.filter(r => r.capable === true).length * 1 ? '#0ea5e9' : '#ef4444',
                          fontWeight: 600,
                          marginBottom: '4px'
                        }}>
                          {user?.Wallet >= recipients.filter(r => r.capable === true).length * 1 ? '✓ READY TO SEND' : '⚠ INSUFFICIENT BALANCE'}
                        </div>
                        <div style={{ fontSize: '11px', color: THEME_CONSTANTS.colors.textSecondary }}>
                          {user?.Wallet >= recipients.filter(r => r.capable === true).length * 1
                            ? 'Your campaign will be sent immediately after confirmation'
                            : 'Please add money to your wallet to proceed'
                          }
                        </div>
                      </div>
                    </Space>
                  </Card>
                </Col>
              </Row>
            )}


        </div>
      </div>

      {/* Add Money Modal */}
      <Modal
        title="Add Money to Wallet"
        open={showAddMoney}
        onCancel={() => {
          setShowAddMoney(false);
          setAddAmount('');
        }}
        footer={null}
      >
        <Form layout="vertical">
          <Form.Item label="Amount">
            <Input
              type="number"
              placeholder="Enter amount"
              value={addAmount}
              onChange={(e) => setAddAmount(e.target.value)}
            />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
            {[100, 500, 1000].map((amount) => (
              <Button key={amount} onClick={() => setAddAmount(amount.toString())}>
                ₹{amount}
              </Button>
            ))}
          </div>

          <Space style={{ width: '100%' }}>
            <Button onClick={() => setShowAddMoney(false)} style={{ flex: 1 }}>
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={async () => {
                if (addAmount && parseFloat(addAmount) > 0) {
                  try {
                    const response = await _post('v1/wallet/request', {
                      amount: parseFloat(addAmount),
                      userId: user._id,
                    }, {}, localStorage.getItem('token'));
                    const data = response.data;
                    if (data.success) {
                      message.success('Recharge request submitted!');
                      setAddAmount('');
                      setShowAddMoney(false);
                      await refreshUser();
                    }
                  } catch (error) {
                    message.error('Error: ' + error.message);
                  }
                }
              }}
              style={{ flex: 1 }}
            >
              Add Money
            </Button>
          </Space>
        </Form>
      </Modal>

      {/* Manual Contact Modal */}
      <Modal
        title="Add Contacts Manually"
        open={manualContactModal}
        onCancel={() => {
          setManualContactModal(false);
          manualContactForm.resetFields();
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setManualContactModal(false);
            manualContactForm.resetFields();
          }}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={checkingCapability}
            onClick={() => manualContactForm.submit()}
          >
            Add Contacts
          </Button>
        ]}
      >
        <Form form={manualContactForm} layout="vertical" onFinish={handleAddContact}>
          <Form.Item
            label="Phone Numbers"
            name="phone"
            rules={[
              { required: true, message: 'Please enter phone numbers' }
            ]}
          >
            <Input.TextArea
              rows={6}
              placeholder={`Enter phone numbers (one per line or comma separated):
9876543210
9876543211
9876543212

Or comma separated: 9876543210, 9876543211, 9876543212`}
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '-16px', marginBottom: '16px' }}>
            💡 You can add multiple numbers separated by commas or new lines. Numbers will be automatically formatted with +91 prefix.
          </div>
        </Form>
      </Modal>
    </>
  );
}

export default CreateCampaign;