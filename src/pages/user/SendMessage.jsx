import React, { useState, useEffect } from 'react';
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
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { THEME_CONSTANTS } from '../../theme';

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

function SendMessage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // State Management
  const [currentStep, setCurrentStep] = useState(0);
  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [templateSearch, setTemplateSearch] = useState('');
  const [templateFilter, setTemplateFilter] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [messageType, setMessageType] = useState('text');
  const [message, setMessage] = useState('');
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
  const [sendingInProgress, setSendingInProgress] = useState(false);
  const [campaignSummary, setCampaignSummary] = useState(null);
  const [previewDrawer, setPreviewDrawer] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [addAmount, setAddAmount] = useState('');

  // Load templates on mount
  useEffect(() => {
    if (user?._id) {
      loadTemplates();
    }
  }, [user]);

  // Load Templates from Backend
  const loadTemplates = async () => {
    try {
      setRefreshing(true);
      const response = await api.getUserTemplates(user?._id);
      const templatesData = response.data || [];

      // Sort templates by creation date (newest first)
      const sortedTemplates = templatesData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setTemplates(sortedTemplates);
      setFilteredTemplates(sortedTemplates);

      if (sortedTemplates.length === 0) {
        message.info('No templates found. Create your first template to get started!');
      } else {
        message.success(`${sortedTemplates.length} templates loaded successfully`);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      message.error('Failed to load templates: ' + (error.response?.data?.message || error.message));
      setTemplates([]);
      setFilteredTemplates([]);
    } finally {
      setRefreshing(false);
    }
  };

  // Filter templates based on search and filter
  useEffect(() => {
    let filtered = templates;

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
  }, [templates, templateSearch, templateFilter]);

  // Handle Template Selection
  const handleTemplateSelect = async (templateId) => {
    if (templateId === 'new') {
      setSelectedTemplate(null);
      setMessage('');
      setMessageType('text');
      setButtons([]);
      setCarouselCards([]);
      setMediaUrl('');
      setCardDescription('');
      return;
    }

    try {
      const response = await api.getTemplateById(templateId);
      const templateData = response.data;
      setSelectedTemplate(templateData);
      setMessageType(templateData.messageType);

      // Reset all fields
      setMessage(templateData.text || templateData?.richCard?.title || '');
      setCardDescription(templateData?.richCard?.description || templateData?.richCard?.subtitle || '');
      setMediaUrl(templateData?.richCard?.imageUrl || templateData?.imageUrl || '');

      // Set buttons
      const templateButtons = [];
      if (templateData.richCard?.actions) {
        templateButtons.push(...templateData.richCard.actions.map((action) => ({
          id: Date.now() + Math.random(),
          type: action.type === 'url' ? 'URL Button' : action.type === 'call' ? 'Call Button' : 'Quick Reply Button',
          title: action.title,
          value: action.payload || '',
        })));
      } else if (templateData.actions) {
        templateButtons.push(...templateData.actions.map((action) => ({
          id: Date.now() + Math.random(),
          type: action.type === 'url' ? 'URL Button' : action.type === 'call' ? 'Call Button' : 'Quick Reply Button',
          title: action.title,
          value: action.payload || '',
        })));
      }
      setButtons(templateButtons);

      // Set carousel cards
      if (templateData.carouselItems?.length > 0) {
        setCarouselCards(
          templateData.carouselItems.map((item) => ({
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

      message.success(`Template "${templateData.name}" loaded successfully`);
    } catch (error) {
      message.error('Failed to load template: ' + error.message);
    }
  };

  // Check RCS Capability
  const checkRcsCapability = async (numbers) => {
    try {
      const response = await api.chackcapebalNumber(numbers, user._id);
      return response;
    } catch (error) {
      console.error('Error checking capability:', error);
      return null;
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
          const rcsMessaging = response?.data?.rcsMessaging || response?.rcsMessaging;

          let capableNumbers = [];
          if (rcsMessaging && rcsMessaging.reachableUsers) {
            // Check each number against reachableUsers array
            capableNumbers = newNumbers.map((num) => {
              const isCapable = rcsMessaging.reachableUsers.includes(num);
              console.log(`Number ${num} capability:`, isCapable);
              return {
                id: Date.now() + Math.random(),
                number: num,
                capable: isCapable,
                checking: false,
              };
            });
          } else {
            // Default to false if no RCS data
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
      let phone = values.phone.trim();

      // Clean and format phone number
      phone = phone.replace(/[\s\-()]/g, '');

      if (!phone) {
        message.error('Please enter a valid phone number');
        return;
      }

      // Add +91 if not present
      if (!phone.startsWith('+91')) {
        if (phone.startsWith('91') && phone.length === 12) {
          phone = '+' + phone;
        } else if (phone.length === 10) {
          phone = '+91' + phone;
        } else {
          message.error('Please enter a valid 10-digit phone number');
          return;
        }
      }

      // Validate phone number format
      if (!/^\+91\d{10}$/.test(phone)) {
        message.error('Please enter a valid phone number');
        return;
      }

      // Check if already exists
      if (recipients.find(r => r.number === phone)) {
        message.warning('This contact is already added');
        return;
      }

      // Check capability
      const response = await checkRcsCapability([phone]);
      console.log('Manual contact RCS check:', response);
      const rcsMessaging = response?.data?.rcsMessaging || response?.rcsMessaging;
      let isCapable = false;

      if (rcsMessaging && rcsMessaging.reachableUsers) {
        isCapable = rcsMessaging.reachableUsers.includes(phone);
        console.log(`Manual contact ${phone} capability:`, isCapable);
      }

      const newContact = {
        id: Date.now().toString(),
        number: phone,
        capable: isCapable,
        checking: false,
      };

      setRecipients([...recipients, newContact]);
      manualContactForm.resetFields();
      setManualContactModal(false);
      message.success(`Contact added successfully ${isCapable ? '(RCS capable)' : '(Not RCS capable)'}`);
    } catch (error) {
      console.error('Error adding contact:', error);
      message.error('Error adding contact: ' + (error.response?.data?.message || error.message));
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
    if (step === 0) {
      setCurrentStep(0);
    } else if (step === 1 && !selectedTemplate) {
      message.error('Please select a template');
    } else if (step === 2 && recipients.length === 0) {
      message.error('Please add recipients');
    } else if (step === 3 && !sendSchedule.dateTime && sendSchedule.type === 'scheduled') {
      message.error('Please select date and time');
    } else {
      setCurrentStep(step);
    }
  };

  // Send Campaign
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

      if (recipients.length === 0) {
        message.error('Please add at least one contact');
        return;
      }

      // Check wallet
      const totalCost = recipients.length * 1; // ₹1 per contact
      if (user.Wallet < totalCost) {
        message.error(`Insufficient credits! Required: ₹${totalCost}, Available: ₹${user.Wallet}`);
        setShowAddMoney(true);
        return;
      }

      setSendingInProgress(true);

      // Build payload based on message type
      let payload = {
        phoneNumbers: recipients.map((c) => c.number),
        templateId: selectedTemplate._id,
        type: messageType,
        userId: user._id,
        campaignName: campaignName.trim(),
      };

      if (messageType === 'carousel') {
        if (carouselCards.length < 2) {
          message.error('Carousel requires minimum 2 cards');
          setSendingInProgress(false);
          return;
        }

        const validCards = carouselCards.filter((c) => c.title && c.description && c.imageUrl);
        if (validCards.length < 2) {
          message.error('At least 2 cards must have title, description, and image');
          setSendingInProgress(false);
          return;
        }

        payload.content = {
          richCardDetails: {
            carousel: {
              cardWidth: 'MEDIUM_WIDTH',
              contents: validCards.map((card) => ({
                cardTitle: card.title,
                cardDescription: card.description,
                cardMedia: {
                  contentInfo: { fileUrl: card.imageUrl },
                  mediaHeight: 'MEDIUM',
                },
                suggestions: card.buttons
                  ?.filter((btn) => btn.title && btn.value)
                  ?.map((btn) => ({
                    action: {
                      plainText: btn.title,
                      postBack: { data: 'carousel_action' },
                      openUrl: { url: btn.value },
                    },
                  })),
              })),
            },
          },
        };
      } else if (messageType === 'rcs') {
        if (!mediaUrl) {
          message.error('Please upload media for RCS message');
          setSendingInProgress(false);
          return;
        }

        if (buttons.length === 0) {
          message.error('Please add at least one button for RCS message');
          setSendingInProgress(false);
          return;
        }

        const validButtons = buttons.filter((btn) => {
          if (!btn.title || !btn.value) return false;
          if (btn.type === 'URL Button') return btn.value.startsWith('http');
          if (btn.type === 'Call Button') return btn.value.startsWith('+');
          return true;
        });

        if (validButtons.length === 0) {
          message.error('Please add at least one valid button');
          setSendingInProgress(false);
          return;
        }

        payload.content = {
          richCardDetails: {
            standalone: {
              cardOrientation: 'VERTICAL',
              content: {
                cardTitle: message,
                cardDescription: cardDescription,
                cardMedia: {
                  mediaHeight: 'TALL',
                  contentInfo: { fileUrl: mediaUrl },
                },
                suggestions: validButtons.map((btn) => {
                  if (btn.type === 'Call Button') {
                    return {
                      action: {
                        plainText: btn.title,
                        postBack: { data: 'call_action' },
                        dialerAction: { phoneNumber: btn.value },
                      },
                    };
                  }
                  return {
                    action: {
                      plainText: btn.title,
                      postBack: { data: 'rcs_action' },
                      openUrl: { url: btn.value },
                    },
                  };
                }),
              },
            },
          },
        };
      } else if (messageType === 'text-with-action') {
        if (buttons.length === 0) {
          message.error('Please add at least one button');
          setSendingInProgress(false);
          return;
        }

        const validButtons = buttons.filter((btn) => btn.title && btn.value);
        if (validButtons.length === 0) {
          message.error('Please add at least one valid button');
          setSendingInProgress(false);
          return;
        }

        payload.content = {
          plainText: message,
          suggestions: validButtons.map((btn) => {
            if (btn.type === 'Call Button') {
              return {
                action: {
                  plainText: btn.title,
                  postBack: { data: 'call_action' },
                  dialerAction: { phoneNumber: btn.value },
                },
              };
            }
            if (btn.type === 'URL Button') {
              return {
                action: {
                  plainText: btn.title,
                  postBack: { data: 'url_action' },
                  openUrl: { url: btn.value },
                },
              };
            }
            return {
              reply: {
                plainText: btn.title,
                postBack: { data: btn.value },
              },
            };
          }),
        };
      } else if (messageType === 'webview') {
        payload.content = {
          plainText: message,
          suggestions: buttons.map((btn) => ({
            action: {
              plainText: btn.title,
              postBack: { data: btn.value || 'webview_action' },
              openUrl: {
                url: btn.value,
                application: 'WEBVIEW',
                webviewViewMode: 'TALL',
              },
            },
          })),
        };
      } else if (messageType === 'dialer-action') {
        payload.content = {
          plainText: message,
          suggestions: buttons.map((btn) => ({
            action: {
              plainText: btn.title,
              postBack: { data: 'dialer_action' },
              dialerAction: { phoneNumber: btn.value },
            },
          })),
        };
      } else {
        // Plain text
        payload.content = { plainText: message };
      }

      // Send to backend
      const response = await api.sendMessage(payload);

      if (response.data.success) {
        message.success('Campaign sent successfully!');
        const summary = {
          id: response.data.campaignId || `CAMP-${Date.now()}`,
          template: selectedTemplate.name,
          totalRecipients: recipients.length,
          successCount: Math.floor(recipients.length * 0.98),
          failureCount: Math.ceil(recipients.length * 0.02),
          sentAt: new Date(),
          scheduledFor: sendSchedule.type === 'scheduled' ? sendSchedule.dateTime : null,
          cost: totalCost,
        };
        setCampaignSummary(summary);
        setCurrentStep(4);
        await refreshUser();

        // Redirect to reports after 2 seconds
        setTimeout(() => {
          navigate('/reports');
        }, 2000);
      }
    } catch (error) {
      if (error.response?.data?.message === 'Insufficient balance') {
        message.error(`Insufficient credits! Required: ₹${error.response.data.required}, Available: ₹${error.response.data.available}`);
        setShowAddMoney(true);
      } else {
        message.error(error?.response?.data?.message || 'Failed to send campaign');
      }
    } finally {
      setSendingInProgress(false);
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

  // Render Template Preview with Android Messages UI
  const renderTemplatePreview = (template = selectedTemplate) => {
    if (!template) {
      return (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>📱</div>
          <h4 style={{ color: THEME_CONSTANTS.colors.textSecondary, margin: 0 }}>Select a template to preview</h4>
        </div>
      );
    }

    const phoneStyle = {
      width: '320px',
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
      padding: '16px',
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
      const richCard = template.richCard;
      if (!richCard) return null;

      return (
        <div style={messageBubbleStyle}>
          {richCard.imageUrl && (
            <img
              src={richCard.imageUrl}
              alt="RCS Media"
              style={{ width: '100%', height: '160px', objectFit: 'cover' }}
            />
          )}
          <div style={{ padding: '12px' }}>
            {richCard.title && (
              <h4 style={{ color: '#000', fontSize: '14px', fontWeight: 600, margin: '0 0 4px 0' }}>
                {richCard.title}
              </h4>
            )}
            {richCard.subtitle && (
              <p style={{ color: '#333', fontSize: '12px', margin: '0 0 12px 0', lineHeight: 1.4 }}>
                {richCard.subtitle}
              </p>
            )}
            {richCard.actions && richCard.actions.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {richCard.actions.slice(0, 2).map((action, idx) => (
                  <button
                    key={idx}
                    style={{
                      background: 'transparent',
                      border: '1px solid #666',
                      borderRadius: '16px',
                      color: '#1976d2',
                      padding: '8px 16px',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
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
      if (!template.text) return null;

      return (
        <div style={{
          ...messageBubbleStyle,
          background: '#e3f2fd',
          padding: '12px 16px',
        }}>
          <p style={{ color: '#000', fontSize: '14px', margin: 0, lineHeight: 1.4 }}>
            {template.text}
          </p>
        </div>
      );
    };

    const renderCarouselMessage = () => {
      if (!template.carouselItems || template.carouselItems.length === 0) return null;

      return (
        <div style={{ ...messageBubbleStyle, background: 'transparent', boxShadow: 'none' }}>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '0 4px' }}>
            {template.carouselItems.slice(0, 3).map((item, idx) => (
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
                    <button
                      style={{
                        background: 'transparent',
                        border: '1px solid #666',
                        borderRadius: '12px',
                        color: '#1976d2',
                        padding: '6px 12px',
                        fontSize: '10px',
                        width: '100%',
                      }}
                    >
                      {item.actions[0].title}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    };

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
              {template.messageType === 'rcs' && renderRcsMessage()}
              {template.messageType === 'text' && renderTextMessage()}
              {template.messageType === 'carousel' && renderCarouselMessage()}

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
    { title: 'Schedule Send', icon: <ClockCircleOutlined /> },
    { title: 'Review & Send', icon: <SendOutlined /> },
    { title: 'Campaign Sent', icon: <CheckCircleOutlined /> },
  ];

  return (
    <>
      <Layout style={{ minHeight: 'calc(100vh - 80px)', background: THEME_CONSTANTS.colors.background }}>
        <Layout.Content style={{ padding: THEME_CONSTANTS.spacing.xxxl }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <Card
              style={{
                background: THEME_CONSTANTS.colors.surface,
                border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                borderRadius: THEME_CONSTANTS.radius.lg,
                marginBottom: THEME_CONSTANTS.spacing.xxxl,
              }}
              bodyStyle={{ padding: THEME_CONSTANTS.spacing.xxxl }}
            >
              <Row gutter={[24, 24]} align="middle">
                <Col xs={24} sm={16}>
                  <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0, color: THEME_CONSTANTS.colors.text }}>
                    Bulk Message Campaign
                  </h1>
                  <p style={{ fontSize: '14px', color: THEME_CONSTANTS.colors.textSecondary, margin: '8px 0 0 0' }}>
                    Create and manage bulk messaging campaigns
                  </p>
                </Col>
                <Col xs={24} sm={8}>
                  <Row gutter={16}>
                    <Col xs={12}>
                      <Statistic
                        title="Total Contacts"
                        value={recipients.length}
                        prefix={<TeamOutlined />}
                        valueStyle={{ color: THEME_CONSTANTS.colors.primary, fontSize: '20px' }}
                      />
                    </Col>
                    <Col xs={12}>
                      <Statistic
                        title="Wallet"
                        value={user?.Wallet?.toFixed(2) || '0.00'}
                        prefix="₹"
                        valueStyle={{ color: THEME_CONSTANTS.colors.success, fontSize: '20px' }}
                      />
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Card>

            {/* Steps */}
            <Card
              style={{
                background: THEME_CONSTANTS.colors.surface,
                border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                borderRadius: THEME_CONSTANTS.radius.lg,
                marginBottom: THEME_CONSTANTS.spacing.xxxl,
              }}
              bodyStyle={{ padding: THEME_CONSTANTS.spacing.xxl }}
            >
              <Steps current={currentStep} items={steps.map((s) => ({ ...s }))} onChange={handleStepChange} />
            </Card>

            {/* Step 0: Select Template */}
            {currentStep === 0 && (
              <Row gutter={24}>
                <Col xs={24} lg={16}>
                  <Card
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>Select a Template ({templates.length})</span>
                        <Space>
                          <Button
                            onClick={loadTemplates}
                            icon={<ReloadOutlined />}
                            loading={refreshing}
                            size="small"
                            style={{ padding: '16px 12px' }}
                          >
                            Refresh
                          </Button>
                          <Button
                            type="primary"
                            onClick={() => navigate('/templates')}
                            icon={<PlusOutlined />}
                            size="small"
                            style={{ padding: '16px 12px' }}
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
                    }}
                    bodyStyle={{ padding: '24px' }}
                  >
                    {refreshing ? (
                      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                        <Spin size="large" />
                        <p style={{ marginTop: '16px', color: THEME_CONSTANTS.colors.textSecondary }}>Loading templates...</p>
                      </div>
                    ) : templates.length === 0 ? (
                      <Empty
                        description={
                          <div>
                            <p style={{ marginBottom: '8px' }}>No templates found</p>
                            <p style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary, margin: 0 }}>
                              Create your first template to start sending messages
                            </p>
                          </div>
                        }
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      >
                        <Button type="primary" onClick={() => navigate('/templates')} icon={<PlusOutlined />}>
                          Create Your First Template
                        </Button>
                      </Empty>
                    ) : (
                      <>
                        {/* Search and Filter */}
                        <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'ceter', justifyContent: "end" }}>
                          <Input.Search
                            placeholder="Search templates by name or content..."
                            value={templateSearch}
                            onChange={(e) => setTemplateSearch(e.target.value)}
                            style={{ width: 250 }}
                            allowClear
                          />
                          <Select
                            value={templateFilter}
                            onChange={setTemplateFilter}
                            style={{ width: 150 }}
                            options={[
                              { label: 'All Types', value: 'all' },
                              { label: 'Text', value: 'text' },
                              { label: 'Text + Action', value: 'text-with-action' },
                              { label: 'RCS Rich Card', value: 'rcs' },
                              { label: 'Carousel', value: 'carousel' }
                            ]}
                          />
                          {/* <Space>
                          <Button
                            onClick={loadTemplates}
                            icon={<ReloadOutlined />}
                            loading={refreshing}
                            size="small"
                            style={{ padding: '16px 12px' }}
                          >
                            Refresh
                          </Button>
                          <Button
                            type="primary"
                            onClick={() => navigate('/templates')}
                            icon={<PlusOutlined />}
                            size="small"
                            style={{ padding: '16px 12px' }}
                          >
                            Create New
                          </Button>
                        </Space> */}
                        </div>

                        {/* Templates Table */}
                        <Table
                          dataSource={filteredTemplates}
                          rowKey="_id"
                          pagination={{ pageSize: 10, showSizeChanger: true }}
                          rowSelection={{
                            type: 'radio',
                            selectedRowKeys: selectedTemplate ? [selectedTemplate._id] : [],
                            onSelect: (record) => handleTemplateSelect(record._id)
                          }}
                          columns={[
                            {
                              title: 'Template Name',
                              dataIndex: 'name',
                              key: 'name',
                              render: (text, record) => (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontSize: '16px' }}>
                                    {record.messageType === 'text' ? '💬' :
                                      record.messageType === 'rcs' ? '🎨' :
                                        record.messageType === 'carousel' ? '🎠' :
                                          record.messageType === 'text-with-action' ? '🔗' : '📧'}
                                  </span>
                                  <div>
                                    <div style={{ fontWeight: 600 }}>{text}</div>
                                    <div style={{ fontSize: '11px', color: '#666' }}>
                                      {MESSAGE_TYPES[record.messageType] || record.messageType}
                                    </div>
                                  </div>
                                </div>
                              )
                            },
                            {
                              title: 'Content Preview',
                              key: 'preview',
                              render: (_, record) => (
                                <div style={{ maxWidth: '300px' }}>
                                  {record.text && (
                                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                                      {record.text.length > 50 ? record.text.substring(0, 50) + '...' : record.text}
                                    </div>
                                  )}
                                  {record.richCard?.title && (
                                    <div style={{ fontSize: '12px', fontWeight: 500 }}>
                                      {record.richCard.title}
                                    </div>
                                  )}
                                </div>
                              )
                            },
                            {
                              title: 'Created',
                              dataIndex: 'createdAt',
                              key: 'createdAt',
                              width: 120,
                              render: (date) => new Date(date).toLocaleDateString()
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
                        style={{ padding: '18px 16px' }}
                      >
                        Next: Add Recipients
                      </Button>
                    </div>
                  </Card>
                </Col>

                <Col xs={24} lg={8}>
                  <div
                    style={{
                      background: THEME_CONSTANTS.colors.surface,
                      border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                      borderRadius: THEME_CONSTANTS.radius.lg,
                      position: 'sticky',
                      top: '20px',
                      padding: '16px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      minHeight: '500px'
                    }}
                  >
                    {renderTemplatePreview()}
                  </div>
                </Col>
              </Row>
            )}

            {/* Step 1: Add Recipients */}
            {currentStep === 1 && (
              <Row gutter={24}>
                <Col xs={24} lg={16}>
                  <Card
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div c>
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
                          <Col xs={24} sm={8}>
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
                                size="large"
                                style={{ height: '48px', padding: '18px 16px' }}
                              >
                                Import Excel
                              </Button>
                            </Upload>
                          </Col>
                          <Col xs={24} sm={8}>
                            <Button
                              icon={<DownloadOutlined />}
                              onClick={downloadDemoExcel}
                              block
                              size="large"
                              style={{ height: '48px', padding: '12px 16px' }}
                            >
                              Download Demo
                            </Button>
                          </Col>
                          <Col xs={24} sm={8}>
                            <Button
                              icon={<PlusOutlined />}
                              type="primary"
                              onClick={() => setManualContactModal(true)}
                              block
                              size="large"
                              style={{ height: '48px' }}
                            >
                              Add Manually
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
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          borderRadius: THEME_CONSTANTS.radius.lg,
                          padding: '24px',
                          color: 'white',
                        }}>
                          <h4 style={{ color: 'white', margin: '0 0 16px 0' }}>Contact Statistics</h4>
                          <Row gutter={16}>
                            <Col xs={12} sm={6}>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>
                                  {recipients.length}
                                </div>
                                <div style={{ fontSize: '11px', opacity: 0.9 }}>Total Contacts</div>
                              </div>
                            </Col>
                            <Col xs={12} sm={6}>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px', color: '#4ade80' }}>
                                  {recipients.filter(r => r.capable === true).length}
                                </div>
                                <div style={{ fontSize: '11px', opacity: 0.9 }}>RCS Capable</div>
                              </div>
                            </Col>
                            <Col xs={12} sm={6}>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px', color: '#f87171' }}>
                                  {recipients.filter(r => r.capable === false).length}
                                </div>
                                <div style={{ fontSize: '11px', opacity: 0.9 }}>Not Capable</div>
                              </div>
                            </Col>
                            <Col xs={12} sm={6}>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px', color: '#fbbf24' }}>
                                  ₹{(recipients.length * 1).toFixed(0)}
                                </div>
                                <div style={{ fontSize: '11px', opacity: 0.9 }}>Est. Cost</div>
                              </div>
                            </Col>
                          </Row>
                        </div>
                      )}

                      {/* Contact List */}
                      {recipients.length > 0 && (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <h4 style={{ margin: 0 }}>Contact List ({recipients.length})</h4>
                          </div>
                          <Table
                            columns={contactsColumns}
                            dataSource={recipients}
                            rowKey="id"
                            pagination={{
                              pageSize: 10,
                              showSizeChanger: true,
                              showQuickJumper: true,
                              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} contacts`,
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
                      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between' }}>
                        <Button
                          style={{ padding: '16px 12px' }}

                          onClick={() => setCurrentStep(0)}
                          icon={<ArrowLeftOutlined
                          />}>
                          Previous: Template
                        </Button>
                        <Button
                          style={{ padding: '16px 12px' }}
                          type="primary"
                          onClick={() => {
                            if (recipients.length === 0) {
                              message.error('Please add at least one contact to continue');
                              return;
                            }
                            setCurrentStep(2);
                          }}
                          icon={<ArrowRightOutlined />}
                        >
                          Next: Schedule
                        </Button>
                      </div>
                    </Space>
                  </Card>
                </Col>

                <Col xs={24} lg={8}>
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
                            value={recipients.length}
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
                        {recipients.length > 0 && (
                          <div>
                            <Statistic
                              title="Estimated Cost"
                              value={`₹${(recipients.length * 1).toFixed(2)}`}
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

            {/* Step 2: Schedule Send */}
            {currentStep === 2 && (
              <Row gutter={24}>
                <Col xs={24} lg={16}>
                  <Space direction="vertical" style={{ width: '100%' }} size="large">
                    {/* Schedule Options Card */}
                    <Card
                      style={{
                        background: THEME_CONSTANTS.colors.surface,
                        border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                        borderRadius: THEME_CONSTANTS.radius.lg,
                        boxShadow: THEME_CONSTANTS.shadow.md,
                      }}
                      bodyStyle={{ padding: THEME_CONSTANTS.spacing.xxxl }}
                    >
                      <div style={{ textAlign: 'center', marginBottom: THEME_CONSTANTS.spacing.xxxl }}>
                        <div style={{ 
                          fontSize: '48px', 
                          marginBottom: THEME_CONSTANTS.spacing.lg,
                          color: THEME_CONSTANTS.colors.primary 
                        }}>
                          <ClockCircleOutlined />
                        </div>
                        <h2 style={{ 
                          margin: `0 0 ${THEME_CONSTANTS.spacing.sm} 0`, 
                          color: THEME_CONSTANTS.colors.text, 
                          fontSize: THEME_CONSTANTS.typography.h2.size, 
                          fontWeight: THEME_CONSTANTS.typography.h2.weight 
                        }}>
                          Schedule Your Campaign
                        </h2>
                        <p style={{ 
                          fontSize: THEME_CONSTANTS.typography.body.size, 
                          color: THEME_CONSTANTS.colors.textSecondary, 
                          margin: 0 
                        }}>
                          Choose when to send your message to {recipients.length} recipients
                        </p>
                      </div>

                      <Form layout="vertical">
                        <Form.Item>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: THEME_CONSTANTS.spacing.xxl }}>
                            {/* Send Immediately Option */}
                            <div
                              onClick={() => setSendSchedule({ ...sendSchedule, type: 'immediate' })}
                              style={{
                                padding: THEME_CONSTANTS.spacing.xxl,
                                borderRadius: THEME_CONSTANTS.radius.lg,
                                border: `2px solid ${sendSchedule.type === 'immediate' ? THEME_CONSTANTS.colors.primary : THEME_CONSTANTS.colors.border}`,
                                background: sendSchedule.type === 'immediate' ? THEME_CONSTANTS.colors.primaryLight : THEME_CONSTANTS.colors.surface,
                                cursor: 'pointer',
                                transition: THEME_CONSTANTS.transition.normal,
                                textAlign: 'center',
                                boxShadow: sendSchedule.type === 'immediate' ? THEME_CONSTANTS.shadow.md : THEME_CONSTANTS.shadow.sm,
                              }}
                            >
                              <div style={{ 
                                fontSize: '32px', 
                                marginBottom: THEME_CONSTANTS.spacing.md,
                                color: THEME_CONSTANTS.colors.success 
                              }}>
                                <SendOutlined />
                              </div>
                              <h3 style={{ 
                                margin: `0 0 ${THEME_CONSTANTS.spacing.sm} 0`, 
                                color: THEME_CONSTANTS.colors.text, 
                                fontSize: THEME_CONSTANTS.typography.h4.size, 
                                fontWeight: THEME_CONSTANTS.typography.h4.weight 
                              }}>
                                Send Immediately
                              </h3>
                              <p style={{ 
                                fontSize: THEME_CONSTANTS.typography.bodySmall.size, 
                                color: THEME_CONSTANTS.colors.textSecondary, 
                                margin: 0 
                              }}>
                                Your campaign will be sent right away to all recipients
                              </p>
                              {sendSchedule.type === 'immediate' && (
                                <div style={{ marginTop: THEME_CONSTANTS.spacing.md }}>
                                  <CheckCircleOutlined style={{ color: THEME_CONSTANTS.colors.success, fontSize: '20px' }} />
                                </div>
                              )}
                            </div>

                            {/* Schedule for Later Option */}
                            <div
                              onClick={() => setSendSchedule({ ...sendSchedule, type: 'scheduled' })}
                              style={{
                                padding: THEME_CONSTANTS.spacing.xxl,
                                borderRadius: THEME_CONSTANTS.radius.lg,
                                border: `2px solid ${sendSchedule.type === 'scheduled' ? THEME_CONSTANTS.colors.primary : THEME_CONSTANTS.colors.border}`,
                                background: sendSchedule.type === 'scheduled' ? THEME_CONSTANTS.colors.primaryLight : THEME_CONSTANTS.colors.surface,
                                cursor: 'pointer',
                                transition: THEME_CONSTANTS.transition.normal,
                                textAlign: 'center',
                                boxShadow: sendSchedule.type === 'scheduled' ? THEME_CONSTANTS.shadow.md : THEME_CONSTANTS.shadow.sm,
                              }}
                            >
                              <div style={{ 
                                fontSize: '32px', 
                                marginBottom: THEME_CONSTANTS.spacing.md,
                                color: THEME_CONSTANTS.colors.warning 
                              }}>
                                <CalendarOutlined />
                              </div>
                              <h3 style={{ 
                                margin: `0 0 ${THEME_CONSTANTS.spacing.sm} 0`, 
                                color: THEME_CONSTANTS.colors.text, 
                                fontSize: THEME_CONSTANTS.typography.h4.size, 
                                fontWeight: THEME_CONSTANTS.typography.h4.weight 
                              }}>
                                Schedule for Later
                              </h3>
                              <p style={{ 
                                fontSize: THEME_CONSTANTS.typography.bodySmall.size, 
                                color: THEME_CONSTANTS.colors.textSecondary, 
                                margin: 0 
                              }}>
                                Choose a specific date and time to send your campaign
                              </p>
                              {sendSchedule.type === 'scheduled' && (
                                <div style={{ marginTop: THEME_CONSTANTS.spacing.md }}>
                                  <CheckCircleOutlined style={{ color: THEME_CONSTANTS.colors.success, fontSize: '20px' }} />
                                </div>
                              )}
                            </div>
                          </div>
                        </Form.Item>

                        {sendSchedule.type === 'scheduled' && (
                          <div style={{
                            background: THEME_CONSTANTS.colors.background,
                            padding: THEME_CONSTANTS.spacing.xxl,
                            borderRadius: THEME_CONSTANTS.radius.lg,
                            border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                            marginTop: THEME_CONSTANTS.spacing.xxl,
                          }}>
                            <h4 style={{ 
                              margin: `0 0 ${THEME_CONSTANTS.spacing.lg} 0`, 
                              color: THEME_CONSTANTS.colors.text, 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: THEME_CONSTANTS.spacing.sm,
                              fontSize: THEME_CONSTANTS.typography.h5.size,
                              fontWeight: THEME_CONSTANTS.typography.h5.weight
                            }}>
                              <CalendarOutlined style={{ color: THEME_CONSTANTS.colors.primary }} />
                              Select Date & Time
                            </h4>
                            <DatePicker
                              showTime
                              value={sendSchedule.dateTime ? dayjs(sendSchedule.dateTime) : null}
                              onChange={(date) => setSendSchedule({ ...sendSchedule, dateTime: date?.toDate() })}
                              style={{ width: '100%', height: '48px' }}
                              placeholder="Choose when to send your campaign"
                              format="DD/MM/YYYY HH:mm"
                            />
                            {sendSchedule.dateTime && (
                              <div style={{
                                marginTop: THEME_CONSTANTS.spacing.lg,
                                padding: THEME_CONSTANTS.spacing.md,
                                background: THEME_CONSTANTS.colors.primaryLight,
                                borderRadius: THEME_CONSTANTS.radius.md,
                                border: `1px solid ${THEME_CONSTANTS.colors.primary}`,
                              }}>
                                <div style={{ 
                                  fontSize: THEME_CONSTANTS.typography.caption.size, 
                                  color: THEME_CONSTANTS.colors.primary, 
                                  fontWeight: 600, 
                                  marginBottom: THEME_CONSTANTS.spacing.xs 
                                }}>
                                  📅 SCHEDULED FOR
                                </div>
                                <div style={{ 
                                  fontSize: THEME_CONSTANTS.typography.h6.size, 
                                  color: THEME_CONSTANTS.colors.primary, 
                                  fontWeight: THEME_CONSTANTS.typography.h6.weight 
                                }}>
                                  {dayjs(sendSchedule.dateTime).format('dddd, MMMM DD, YYYY at HH:mm')}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <Alert
                          message="Campaign Delivery Information"
                          description="Messages will be sent to all recipients according to the selected schedule. You can track the delivery status in the Reports section."
                          type="info"
                          showIcon
                          style={{ marginTop: THEME_CONSTANTS.spacing.xxl }}
                        />
                      </Form>

                      {/* Navigation Buttons */}
                      <div style={{ 
                        marginTop: THEME_CONSTANTS.spacing.xxxl, 
                        display: 'flex', 
                        justifyContent: 'space-between' 
                      }}>
                        <Button
                          size="large"
                          onClick={() => setCurrentStep(1)}
                          icon={<ArrowLeftOutlined />}
                          style={{ 
                            padding: `${THEME_CONSTANTS.spacing.md} ${THEME_CONSTANTS.spacing.xxl}`,
                            height: THEME_CONSTANTS.buttons.height.large
                          }}
                        >
                          Previous: Recipients
                        </Button>
                        <Button
                          type="primary"
                          size="large"
                          onClick={() => {
                            if (sendSchedule.type === 'scheduled' && !sendSchedule.dateTime) {
                              message.error('Please select date and time for scheduled sending');
                              return;
                            }
                            setCurrentStep(3);
                          }}
                          icon={<ArrowRightOutlined />}
                          style={{ 
                            padding: `${THEME_CONSTANTS.spacing.md} ${THEME_CONSTANTS.spacing.xxl}`,
                            height: THEME_CONSTANTS.buttons.height.large
                          }}
                        >
                          Next: Review & Send
                        </Button>
                      </div>
                    </Card>
                  </Space>
                </Col>

                <Col xs={24} lg={8}>
                  <div style={{ position: 'sticky', top: '20px' }}>
                    <Card
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: THEME_CONSTANTS.spacing.sm }}>
                          <ClockCircleOutlined style={{ color: THEME_CONSTANTS.colors.primary }} />
                          <span style={{ 
                            fontSize: THEME_CONSTANTS.typography.h5.size,
                            fontWeight: THEME_CONSTANTS.typography.h5.weight,
                            color: THEME_CONSTANTS.colors.text
                          }}>
                            Schedule Summary
                          </span>
                        </div>
                      }
                      style={{
                        background: THEME_CONSTANTS.colors.surface,
                        border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                        borderRadius: THEME_CONSTANTS.radius.lg,
                        boxShadow: THEME_CONSTANTS.shadow.md,
                      }}
                      bodyStyle={{ padding: THEME_CONSTANTS.spacing.xxl }}
                    >
                      <Space direction="vertical" style={{ width: '100%' }} size="large">
                        {/* Send Time Display */}
                        <div style={{
                          padding: THEME_CONSTANTS.spacing.xl,
                          background: sendSchedule.type === 'immediate' 
                            ? `linear-gradient(135deg, ${THEME_CONSTANTS.colors.success} 0%, ${THEME_CONSTANTS.colors.success}dd 100%)`
                            : `linear-gradient(135deg, ${THEME_CONSTANTS.colors.primary} 0%, ${THEME_CONSTANTS.colors.primaryDark} 100%)`,
                          borderRadius: THEME_CONSTANTS.radius.lg,
                          color: THEME_CONSTANTS.colors.surface,
                          textAlign: 'center',
                        }}>
                          <div style={{ fontSize: '32px', marginBottom: THEME_CONSTANTS.spacing.md }}>
                            {sendSchedule.type === 'immediate' ? <SendOutlined /> : <CalendarOutlined />}
                          </div>
                          <div style={{ 
                            fontSize: THEME_CONSTANTS.typography.caption.size, 
                            opacity: 0.9, 
                            marginBottom: THEME_CONSTANTS.spacing.xs,
                            fontWeight: 600,
                            letterSpacing: '0.5px'
                          }}>
                            SEND TIME
                          </div>
                          <div style={{ 
                            fontSize: THEME_CONSTANTS.typography.h4.size, 
                            fontWeight: THEME_CONSTANTS.typography.h4.weight, 
                            marginBottom: THEME_CONSTANTS.spacing.sm 
                          }}>
                            {sendSchedule.type === 'immediate'
                              ? 'Immediately'
                              : sendSchedule.dateTime
                                ? dayjs(sendSchedule.dateTime).format('DD/MM/YY HH:mm')
                                : 'Not selected'}
                          </div>
                          {sendSchedule.type === 'scheduled' && sendSchedule.dateTime && (
                            <div style={{ 
                              fontSize: THEME_CONSTANTS.typography.bodySmall.size, 
                              opacity: 0.8 
                            }}>
                              {dayjs(sendSchedule.dateTime).fromNow()}
                            </div>
                          )}
                        </div>

                        {/* Campaign Stats */}
                        <div style={{
                          padding: THEME_CONSTANTS.spacing.lg,
                          background: THEME_CONSTANTS.colors.background,
                          borderRadius: THEME_CONSTANTS.radius.md,
                          border: `1px solid ${THEME_CONSTANTS.colors.border}`
                        }}>
                          <Statistic
                            title="Recipients"
                            value={recipients.length}
                            prefix={<TeamOutlined style={{ color: THEME_CONSTANTS.colors.primary }} />}
                            valueStyle={{ 
                              fontSize: THEME_CONSTANTS.typography.h3.size, 
                              color: THEME_CONSTANTS.colors.text,
                              fontWeight: THEME_CONSTANTS.typography.h3.weight
                            }}
                          />
                        </div>
                        
                        <div style={{
                          padding: THEME_CONSTANTS.spacing.lg,
                          background: THEME_CONSTANTS.colors.background,
                          borderRadius: THEME_CONSTANTS.radius.md,
                          border: `1px solid ${THEME_CONSTANTS.colors.border}`
                        }}>
                          <Statistic
                            title="Template"
                            value={selectedTemplate?.name || 'None'}
                            valueStyle={{ 
                              fontSize: THEME_CONSTANTS.typography.h6.size, 
                              color: THEME_CONSTANTS.colors.primary,
                              fontWeight: THEME_CONSTANTS.typography.h6.weight
                            }}
                          />
                        </div>

                        <div style={{
                          padding: THEME_CONSTANTS.spacing.lg,
                          background: THEME_CONSTANTS.colors.background,
                          borderRadius: THEME_CONSTANTS.radius.md,
                          border: `1px solid ${THEME_CONSTANTS.colors.border}`
                        }}>
                          <Statistic
                            title="Estimated Cost"
                            value={`₹${(recipients.length * 1).toFixed(2)}`}
                            valueStyle={{ 
                              fontSize: THEME_CONSTANTS.typography.h4.size, 
                              color: THEME_CONSTANTS.colors.warning,
                              fontWeight: THEME_CONSTANTS.typography.h4.weight
                            }}
                          />
                        </div>
                      </Space>
                    </Card>
                  </div>
                </Col>
              </Row>
            )}

            {/* Step 3: Review & Send */}
            {currentStep === 3 && (
              <Row gutter={24}>
                <Col xs={24} lg={16}>
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
                        <h4 style={{ marginBottom: '16px', color: THEME_CONSTANTS.colors.text }}>Message Preview</h4>
                        <div style={{ background: '#f8fafc', borderRadius: THEME_CONSTANTS.radius.md, padding: '16px' }}>
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
                      {user?.Wallet < recipients.length * 1 ? (
                        <Alert
                          type="error"
                          showIcon
                          message="Insufficient Balance"
                          description={
                            <div>
                              <p style={{ margin: '8px 0' }}>
                                Required: ₹{(recipients.length * 1).toFixed(2)} | Available: ₹{user?.Wallet?.toFixed(2) || '0.00'}
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

                      <Space size="large">
                        <Button
                          type="primary"
                          size="large"
                          loading={sendingInProgress}
                          onClick={handleSendCampaign}
                          icon={<SendOutlined />}
                          disabled={!campaignName.trim() || user?.Wallet < recipients.length * 1}
                          style={{
                            height: '48px',
                            paddingLeft: '32px',
                            paddingRight: '32px',
                            borderRadius: THEME_CONSTANTS.radius.md,
                          }}
                        >
                          {sendingInProgress ? 'Sending Campaign...' : 'Send Campaign'}
                        </Button>
                        <Button
                          onClick={() => setCurrentStep(2)}
                          size="large"
                          style={{ height: '48px', paddingLeft: '24px', paddingRight: '24px' }}
                        >
                          Back to Schedule
                        </Button>
                      </Space>
                    </Card>
                  </Space>
                </Col>

                <Col xs={24} lg={8}>
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
                          <span style={{ fontSize: '14px', color: THEME_CONSTANTS.colors.textSecondary }}>Total Recipients</span>
                          <span style={{ fontSize: '16px', fontWeight: 600 }}>{recipients.length}</span>
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
                            ₹{(recipients.length * 1).toFixed(2)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                          <span style={{ fontSize: '14px', color: THEME_CONSTANTS.colors.textSecondary }}>Wallet Balance</span>
                          <span style={{
                            fontSize: '16px',
                            fontWeight: 600,
                            color: user?.Wallet >= recipients.length * 1 ? THEME_CONSTANTS.colors.success : THEME_CONSTANTS.colors.error
                          }}>
                            ₹{user?.Wallet?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                      </div>

                      <div style={{
                        background: user?.Wallet >= recipients.length * 1 ? '#f0f9ff' : '#fef2f2',
                        padding: '16px',
                        borderRadius: THEME_CONSTANTS.radius.md,
                        border: `1px solid ${user?.Wallet >= recipients.length * 1 ? '#0ea5e9' : '#ef4444'}20`,
                      }}>
                        <div style={{
                          fontSize: '12px',
                          color: user?.Wallet >= recipients.length * 1 ? '#0ea5e9' : '#ef4444',
                          fontWeight: 600,
                          marginBottom: '4px'
                        }}>
                          {user?.Wallet >= recipients.length * 1 ? '✓ READY TO SEND' : '⚠ INSUFFICIENT BALANCE'}
                        </div>
                        <div style={{ fontSize: '11px', color: THEME_CONSTANTS.colors.textSecondary }}>
                          {user?.Wallet >= recipients.length * 1
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

            {/* Step 4: Campaign Sent */}
            {currentStep === 4 && campaignSummary && (
              <Card
                style={{
                  background: THEME_CONSTANTS.colors.surface,
                  border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                  borderRadius: THEME_CONSTANTS.radius.lg,
                  textAlign: 'center',
                  padding: THEME_CONSTANTS.spacing.xxxl,
                }}
              >
                <div style={{ marginBottom: THEME_CONSTANTS.spacing.xxl }}>
                  <CheckCircleOutlined style={{ fontSize: '64px', color: THEME_CONSTANTS.colors.success, marginBottom: '16px' }} />
                  <h2 style={{ color: THEME_CONSTANTS.colors.text, margin: 0 }}>Campaign Sent Successfully!</h2>
                  <p style={{ color: THEME_CONSTANTS.colors.textSecondary, margin: '8px 0 0 0' }}>
                    Your campaign has been sent to {campaignSummary.totalRecipients} recipients
                  </p>
                </div>

                <Row gutter={24} style={{ marginBottom: THEME_CONSTANTS.spacing.xxl }}>
                  <Col xs={24} sm={12}>
                    <Statistic title="Campaign ID" value={campaignSummary.id} />
                  </Col>
                  <Col xs={24} sm={12}>
                    <Statistic title="Template" value={campaignSummary.template} />
                  </Col>
                  <Col xs={24} sm={12}>
                    <Statistic
                      title="Success Count"
                      value={campaignSummary.successCount}
                      valueStyle={{ color: THEME_CONSTANTS.colors.success }}
                    />
                  </Col>
                  <Col xs={24} sm={12}>
                    <Statistic
                      title="Total Cost"
                      value={`₹${campaignSummary.cost}`}
                      valueStyle={{ color: THEME_CONSTANTS.colors.primary }}
                    />
                  </Col>
                </Row>

                <Space>
                  <Button
                    type="primary"
                    onClick={() => {
                      setCurrentStep(0);
                      setSelectedTemplate(null);
                      setRecipients([]);
                      setCampaignSummary(null);
                      setCampaignName('');
                    }}
                  >
                    Create Another Campaign
                  </Button>
                  <Button onClick={() => navigate('/reports')}>View Reports</Button>
                </Space>
              </Card>
            )}
          </div>
        </Layout.Content>
      </Layout>

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
                    const data = await api.addWalletRequest({
                      amount: parseFloat(addAmount),
                      userId: user._id,
                    });
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
        title="Add Contact Manually"
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
            Add Contact
          </Button>
        ]}
      >
        <Form form={manualContactForm} layout="vertical" onFinish={handleAddContact}>
          <Form.Item
            label="Phone Number"
            name="phone"
            rules={[
              { required: true, message: 'Please enter phone number' },
              { pattern: /^[+]?[0-9\s\-()]{10,15}$/, message: 'Please enter a valid phone number' }
            ]}
          >
            <Input
              placeholder="Enter 10-digit phone number (e.g., 9876543210)"
              maxLength={15}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default SendMessage;