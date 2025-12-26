// import React, { useState, useEffect, useRef } from 'react';
// import {
//   Layout,
//   Form,
//   Input,
//   Select,
//   Card,
//   Button,
//   Upload,
//   Modal,
//   Space,
//   Tooltip,
//   Divider,
//   Row,
//   Col,
//   Tag,
//   Grid,
//   Breadcrumb,
//   Spin,
// } from 'antd';
// import {
//   PlusOutlined,
//   DeleteOutlined,
//   CloudUploadOutlined,
//   HomeOutlined,
//   FileTextOutlined,
//   FormOutlined,
//   ClearOutlined,
//   CheckOutlined,
//   ExclamationCircleOutlined,
//   AppstoreOutlined,
//   UnorderedListOutlined,
//   PhoneOutlined,
//   LinkOutlined,
//   MessageOutlined,
//   MobileOutlined,
//   ArrowLeftOutlined,
// } from '@ant-design/icons';
// import { THEME_CONSTANTS } from '../../theme';
// import ApiService from '../../services/api';
// import { getMessageTypeLabel } from '../../utils/messageTypes';
// import { useAuth } from '../../context/AuthContext';
// import { useNavigate, useLocation } from 'react-router-dom';
// import toast from 'react-hot-toast';

// const { useBreakpoint } = Grid;

// export default function CreateTemplate() {
//   const { user } = useAuth();
//   const navigate = useNavigate();
//   const location = useLocation();
//   const screens = useBreakpoint();
//   const [form] = Form.useForm();
//   const previewRef = useRef(null);

//   // Check if editing existing template
//   const editingTemplate = location.state?.editTemplate || null;

//   // Form states
//   const [formData, setFormData] = useState({
//     name: '',
//     text: '',
//     imageUrl: '',
//   });
//   const [mediaFile, setMediaFile] = useState(null);
//   const [messageType, setMessageType] = useState('text');
//   const [actions, setActions] = useState([{ type: 'reply', title: '', payload: '' }]);
//   const [richCard, setRichCard] = useState({ 
//     title: '', 
//     subtitle: '', 
//     imageUrl: '', 
//     actions: [],
//     mediaFile: null 
//   });
//   const [carouselItems, setCarouselItems] = useState([
//     { title: '', subtitle: '', imageUrl: '', actions: [], mediaFile: null }
//   ]);
//   const [carouselSuggestions, setCarouselSuggestions] = useState([]);
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     if (editingTemplate) {
//       setFormData({
//         name: editingTemplate.name,
//         text: editingTemplate.text || '',
//         imageUrl: editingTemplate.imageUrl || '',
//       });
//       setMessageType(editingTemplate.messageType);
//       setActions(editingTemplate.actions || [{ type: 'reply', title: '', payload: '' }]);
//       setRichCard(editingTemplate.richCard || { title: '', subtitle: '', imageUrl: '', actions: [], mediaFile: null });
//       setCarouselItems(editingTemplate.carouselItems || [{ title: '', subtitle: '', imageUrl: '', actions: [], mediaFile: null }]);
//       setCarouselSuggestions(editingTemplate.carouselSuggestions || []);
//     }
//   }, [editingTemplate]);

//   const handleImageSelect = async (file, target = 'main', index = null) => {
//     if (file) {
//       const reader = new FileReader();
//       reader.onload = (e) => {
//         const base64 = e.target.result;
        
//         if (target === 'main') {
//           setMediaFile(file);
//           setFormData({ ...formData, imageUrl: base64 });
//         } else if (target === 'richCard') {
//           setRichCard({ ...richCard, imageUrl: base64, mediaFile: file });
//         } else if (target === 'carousel' && index !== null) {
//           const newItems = [...carouselItems];
//           newItems[index].imageUrl = base64;
//           newItems[index].mediaFile = file;
//           setCarouselItems(newItems);
//         }
//       };
//       reader.readAsDataURL(file);
//       return false;
//     }
//   };

//   const handleDeleteImage = (target = 'main', index = null) => {
//     if (target === 'main') {
//       setMediaFile(null);
//       setFormData({ ...formData, imageUrl: '' });
//     } else if (target === 'richCard') {
//       setRichCard({ ...richCard, imageUrl: '', mediaFile: null });
//     } else if (target === 'carousel' && index !== null) {
//       const newItems = [...carouselItems];
//       newItems[index].imageUrl = '';
//       newItems[index].mediaFile = null;
//       setCarouselItems(newItems);
//     }
//     toast.success('Image removed');
//   };

//   const addAction = (target = 'main') => {
//     const newAction = { type: 'reply', title: '', payload: '' };
//     if (target === 'main') {
//       setActions([...actions, newAction]);
//     } else if (target === 'richCard') {
//       setRichCard({ ...richCard, actions: [...richCard.actions, newAction] });
//     }
//   };

//   const removeAction = (index, target = 'main') => {
//     if (target === 'main') {
//       setActions(actions.filter((_, i) => i !== index));
//     } else if (target === 'richCard') {
//       setRichCard({
//         ...richCard,
//         actions: richCard.actions.filter((_, i) => i !== index),
//       });
//     }
//   };

//   const addCarouselItem = () => {
//     setCarouselItems([...carouselItems, { title: '', subtitle: '', imageUrl: '', actions: [], mediaFile: null }]);
//     setTimeout(() => {
//       const carouselSection = document.querySelector('[data-carousel-section]');
//       if (carouselSection) {
//         carouselSection.scrollTop = carouselSection.scrollHeight;
//       }
//     }, 100);
//   };

//   const removeCarouselItem = (index) => {
//     if (carouselItems.length === 1) {
//       toast.error('At least one carousel item is required');
//       return;
//     }
//     setCarouselItems(carouselItems.filter((_, i) => i !== index));
//   };

//   const addCarouselAction = (carouselIndex) => {
//     const newItems = [...carouselItems];
//     if (!newItems[carouselIndex].actions) {
//       newItems[carouselIndex].actions = [];
//     }
//     newItems[carouselIndex].actions.push({ type: 'reply', title: '', payload: '' });
//     setCarouselItems(newItems);
//   };

//   const removeCarouselAction = (carouselIndex, actionIndex) => {
//     const newItems = [...carouselItems];
//     newItems[carouselIndex].actions = newItems[carouselIndex].actions.filter(
//       (_, i) => i !== actionIndex
//     );
//     setCarouselItems(newItems);
//   };

//   const updateCarouselAction = (carouselIndex, actionIndex, field, value) => {
//     const newItems = [...carouselItems];
//     newItems[carouselIndex].actions[actionIndex][field] = value;
//     setCarouselItems(newItems);
//   };

//   const resetForm = () => {
//     form.resetFields();
//     setFormData({ name: '', text: '', imageUrl: '' });
//     setMessageType('text');
//     setActions([{ type: 'reply', title: '', payload: '' }]);
//     setRichCard({ title: '', subtitle: '', imageUrl: '', actions: [], mediaFile: null });
//     setCarouselItems([{ title: '', subtitle: '', imageUrl: '', actions: [], mediaFile: null }]);
//     setCarouselSuggestions([]);
//     setMediaFile(null);
//     setError('');
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     // Validation
//     if (!formData.name.trim()) {
//       toast.error('Template name is required');
//       setError('Template name is required');
//       return;
//     }

//     if ((messageType === 'text' || messageType === 'text-with-action') && !formData.text.trim()) {
//       toast.error('Template text is required');
//       setError('Template text is required');
//       return;
//     }

//     const templateData = {
//       name: formData.name.trim(),
//       messageType,
//       text: formData.text.trim(),
//       imageUrl: formData.imageUrl.trim(),
//       userId: user?._id,
//     };

//     if (messageType === 'text-with-action') {
//       const validActions = actions.filter((a) => a.title.trim() && a.payload.trim());
//       if (validActions.length === 0) {
//         toast.error('At least one action button is required');
//         setError('At least one action button is required');
//         return;
//       }
//       templateData.actions = validActions;
//     } else if (messageType === 'rcs') {
//       if (!richCard.title.trim()) {
//         toast.error('Card title is required');
//         setError('Card title is required');
//         return;
//       }
//       templateData.richCard = {
//         ...richCard,
//         actions: richCard.actions.filter((a) => a.title.trim() && a.payload.trim()),
//       };
//     } else if (messageType === 'carousel') {
//       const validItems = carouselItems
//         .filter((item) => {
//           if (!item.title.trim()) return false;
//           const validActions = (item.actions || []).filter(
//             (a) => a.title.trim() && a.payload.trim()
//           );
//           return validActions.length > 0;
//         })
//         .map((item) => ({
//           ...item,
//           actions: item.actions.filter((a) => a.title.trim() && a.payload.trim()),
//         }));

//       if (validItems.length === 0) {
//         const msg = 'Each carousel item must have a title and at least one valid action button';
//         toast.error(msg);
//         setError(msg);
//         return;
//       }

//       templateData.carouselItems = validItems;
//       templateData.carouselSuggestions = carouselSuggestions.filter(
//         (s) => s.title && s.title.trim() && s.payload && s.payload.trim()
//       );
//     }

//     try {
//       setLoading(true);
//       if (editingTemplate) {
//         await ApiService.updateTemplate(editingTemplate._id, templateData);
//         toast.success('Template updated successfully');
//       } else {
//         await ApiService.createTemplate(templateData);
//         toast.success('Template created successfully');
//       }
//       navigate('/templates');
//       setError('');
//     } catch (err) {
//       console.error('Template save error:', err);
//       let errorMsg = 'Failed to save template';
//       const serverMsg = err.response?.data?.message || err.message || '';

//       if (serverMsg.includes('E11000') && serverMsg.includes('name')) {
//         errorMsg = `Template name "${formData.name}" already exists. Please use a different name.`;
//       } else {
//         errorMsg = serverMsg || errorMsg;
//       }

//       toast.error(errorMsg);
//       setError(errorMsg);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const typeDescriptions = {
//     text: 'Simple text-only message',
//     'text-with-action': 'Text message with interactive action buttons',
//     rcs: 'Single card with image, title, description, and action buttons',
//     carousel: 'Multiple scrollable cards with images and buttons',
//   };

//   const typeColors = {
//     text: THEME_CONSTANTS.colors.success,
//     'text-with-action': '#faad14',
//     rcs: THEME_CONSTANTS.colors.primary,
//     carousel: '#13c2c2',
//   };

//   // RCS Message Preview Component
//   const RCSMessagePreview = ({ data }) => {
//     if (!data) return null;

//     const phoneStyle = {
//       width: '300px',
//       height: '600px',
//       background: '#000',
//       borderRadius: '24px',
//       padding: '8px',
//       margin: '0 auto',
//       boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
//     };

//     const screenStyle = {
//       width: '100%',
//       height: '100%',
//       background: '#ffffff',
//       borderRadius: '16px',
//       display: 'flex',
//       flexDirection: 'column',
//       overflow: 'hidden',
//     };

//     const headerStyle = {
//       background: '#ffffff',
//       padding: '12px 16px',
//       display: 'flex',
//       alignItems: 'center',
//       gap: '12px',
//       borderBottom: '1px solid #e0e0e0',
//     };

//     const chatAreaStyle = {
//       flex: 1,
//       padding: '5px',
//       display: 'flex',
//       flexDirection: 'column',
//       gap: '12px',
//       overflowY: 'auto',
//       background: '#f5f5f5',
//     };

//     const messageBubbleStyle = {
//       minWidth: '240px',
//       maxWidth: '95%',
//       alignSelf: 'flex-end',
//       background: '#e3f2fd',
//       borderRadius: '18px 18px 4px 18px',
//       overflow: 'hidden',
//       boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
//     };

//     const renderRcsMessage = () => {
//       if (!richCard.title && !richCard.imageUrl) return null;

//       return (
//         <div style={messageBubbleStyle}>
//           {richCard.imageUrl && (
//             <img
//               src={richCard.imageUrl}
//               alt="RCS Media"
//               style={{ width: '100%', height: '160px', objectFit: 'cover' }}
//             />
//           )}
//           <div style={{ padding: '12px' }}>
//             {richCard.title && (
//               <h4 style={{ color: '#000', fontSize: '14px', fontWeight: 600, margin: '0 0 4px 0' }}>
//                 {richCard.title}
//               </h4>
//             )}
//             {richCard.subtitle && (
//               <p style={{ color: '#333', fontSize: '12px', margin: '0 0 12px 0', lineHeight: 1.4 }}>
//                 {richCard.subtitle}
//               </p>
//             )}
//             {richCard.actions && richCard.actions.length > 0 && (
//               <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
//                 {richCard.actions.filter(a => a.title.trim()).slice(0, 2).map((action, idx) => (
//                   <button
//                     key={idx}
//                     style={{
//                       background: 'transparent',
//                       border: '1px solid #666',
//                       borderRadius: '16px',
//                       color: '#1976d2',
//                       padding: '8px 16px',
//                       fontSize: '12px',
//                       fontWeight: 500,
//                       cursor: 'pointer',
//                       transition: 'all 0.2s',
//                     }}
//                   >
//                     {action.title}
//                   </button>
//                 ))}
//               </div>
//             )}
//           </div>
//         </div>
//       );
//     };

//     const renderTextMessage = () => {
//       if (!formData.text) return null;

//       return (
//         <div style={{
//           ...messageBubbleStyle,
//           background: '#1976d2',
//           padding: '12px 16px',
//         }}>
//           <p style={{ color: '#fff', fontSize: '14px', margin: 0, lineHeight: 1.4 }}>
//             {formData.text}
//           </p>
//         </div>
//       );
//     };

//     const renderCarouselMessage = () => {
//       const validItems = carouselItems.filter(item => item.title.trim());
//       if (validItems.length === 0) return null;

//       return (
//         <div style={{ ...messageBubbleStyle, background: 'transparent', boxShadow: 'none' }}>
//           <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '0 4px' }}>
//             {validItems.slice(0, 3).map((item, idx) => (
//               <div
//                 key={idx}
//                 style={{
//                   minWidth: '180px',
//                   background: '#e3f2fd',
//                   borderRadius: '12px',
//                   overflow: 'hidden',
//                   boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
//                 }}
//               >
//                 {item.imageUrl && (
//                   <img
//                     src={item.imageUrl}
//                     alt={item.title}
//                     style={{ width: '100%', height: '100px', objectFit: 'cover' }}
//                   />
//                 )}
//                 <div style={{ padding: '10px' }}>
//                   <h5 style={{ color: '#000', fontSize: '12px', fontWeight: 600, margin: '0 0 4px 0' }}>
//                     {item.title}
//                   </h5>
//                   {item.subtitle && (
//                     <p style={{ color: '#333', fontSize: '10px', margin: '0 0 8px 0' }}>
//                       {item.subtitle}
//                     </p>
//                   )}
//                   {item.actions && item.actions.length > 0 && (
//                     <button
//                       style={{
//                         background: 'transparent',
//                         border: '1px solid #666',
//                         borderRadius: '12px',
//                         color: '#1976d2',
//                         padding: '6px 12px',
//                         fontSize: '10px',
//                         width: '100%',
//                       }}
//                     >
//                       {item.actions[0].title}
//                     </button>
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       );
//     };

//     return (
//       <div style={{ padding: '20px', background: '#f5f7fa', borderRadius: '12px' }}>
//         <div style={phoneStyle}>
//           <div style={screenStyle}>
//             {/* Header */}
//             <div style={headerStyle}>
//               <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#4caf50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//                 <span style={{ color: 'white', fontSize: '12px', fontWeight: 600 }}>B</span>
//               </div>
//               <div style={{ flex: 1 }}>
//                 <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Business</h4>
//                 <p style={{ margin: 0, fontSize: '11px', color: '#666' }}>RCS • Online</p>
//               </div>
//               <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#e0e0e0' }} />
//             </div>

//             {/* Chat Area */}
//             <div style={chatAreaStyle}>
//               {data === 'rcs' && renderRcsMessage()}
//               {data === 'text' && renderTextMessage()}
//               {data === 'text-with-action' && (
//                 <>
//                   {renderTextMessage()}
//                   {actions.some(a => a.title.trim()) && (
//                     <div style={{ alignSelf: 'flex-end', maxWidth: '95%', marginTop: '8px' }}>
//                       <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
//                         {actions.filter(a => a.title.trim()).slice(0, 3).map((action, idx) => (
//                           <button
//                             key={idx}
//                             style={{
//                               background: 'transparent',
//                               border: '1px solid #5f6368',
//                               color: '#1a73e8',
//                               padding: '8px 16px',
//                               borderRadius: '20px',
//                               fontSize: '12px',
//                               fontWeight: 500,
//                               cursor: 'pointer',
//                             }}
//                           >
//                             {action.title}
//                           </button>
//                         ))}
//                       </div>
//                     </div>
//                   )}
//                 </>
//               )}
//               {data === 'carousel' && renderCarouselMessage()}
              
//               {/* Delivery Status */}
//               <div style={{ alignSelf: 'flex-end', marginTop: '4px' }}>
//                 <span style={{ fontSize: '10px', color: '#666' }}>✓✓ Delivered</span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   // Render carousel item editor
//   const renderCarouselItemEditor = (item, index) => (
//     <Card
//       key={index}
//       style={{
//         marginBottom: '16px',
//         borderRadius: '8px',
//         border: '1px solid #e8e8e8',
//       }}
//       title={
//         <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
//           <AppstoreOutlined style={{ color: '#1890ff' }} />
//           <span>Card {index + 1}</span>
//           {item.imageUrl && (
//             <CheckOutlined style={{ color: '#52c41a', marginLeft: 'auto' }} />
//           )}
//         </div>
//       }
//       extra={
//         <Button
//           type="text"
//           danger
//           size="small"
//           icon={<DeleteOutlined />}
//           onClick={() => removeCarouselItem(index)}
//         >
//           Remove
//         </Button>
//       }
//     >
//       <Row gutter={[16, 16]}>
//         <Col xs={24} sm={12}>
//           <Form.Item label="Card Title" required>
//             <Input
//               placeholder="Enter card title"
//               value={item.title}
//               onChange={(e) => {
//                 const newItems = [...carouselItems];
//                 newItems[index].title = e.target.value;
//                 setCarouselItems(newItems);
//               }}
//               maxLength={80}
//             />
//           </Form.Item>
//         </Col>
//         <Col xs={24} sm={12}>
//           <Form.Item label="Card Subtitle">
//             <Input
//               placeholder="Enter card subtitle (optional)"
//               value={item.subtitle}
//               onChange={(e) => {
//                 const newItems = [...carouselItems];
//                 newItems[index].subtitle = e.target.value;
//                 setCarouselItems(newItems);
//               }}
//               maxLength={200}
//             />
//           </Form.Item>
//         </Col>
//       </Row>

//       {/* Card Image Upload */}
//       <Form.Item label="Card Image (Aspect Ratio: 3:2.5)">
//         <Upload
//           accept="image/*"
//           maxCount={1}
//           listType="picture-card"
//           beforeUpload={(file) => handleImageSelect(file, 'carousel', index)}
//           onRemove={() => handleDeleteImage('carousel', index)}
//         >
//           {!item.imageUrl ? (
//             <div style={{ textAlign: 'center' }}>
//               <CloudUploadOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
//               <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
//                 Upload Image
//               </div>
//             </div>
//           ) : null}
//         </Upload>
//         {item.imageUrl && (
//           <div style={{ marginTop: '12px', position: 'relative', display: 'inline-block' }}>
//             <img
//               src={item.imageUrl}
//               alt="Preview"
//               style={{
//                 maxWidth: '200px',
//                 maxHeight: '150px',
//                 borderRadius: '8px',
//                 border: '1px solid #e8e8e8',
//               }}
//             />
//             <CheckOutlined
//               style={{
//                 position: 'absolute',
//                 top: '8px',
//                 right: '8px',
//                 color: '#52c41a',
//                 fontSize: '18px',
//                 background: 'white',
//                 borderRadius: '50%',
//                 padding: '2px',
//               }}
//             />
//           </div>
//         )}
//       </Form.Item>

//       {/* Carousel Item Actions */}
//       <div style={{ marginBottom: '16px' }}>
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
//           <span style={{ fontWeight: 600, fontSize: '13px' }}>Action Buttons</span>
//           <Button
//             type="dashed"
//             size="small"
//             icon={<PlusOutlined />}
//             onClick={() => addCarouselAction(index)}
//           >
//             Add Button
//           </Button>
//         </div>

//         {item.actions?.map((action, actionIdx) => (
//           <Card
//             key={actionIdx}
//             style={{
//               marginBottom: '8px',
//               borderRadius: '6px',
//               backgroundColor: '#fafafa',
//             }}
//             size="small"
//           >
//             <Row gutter={[8, 8]}>
//               <Col xs={24} sm={6}>
//                 <Select
//                   value={action.type}
//                   onChange={(value) => updateCarouselAction(index, actionIdx, 'type', value)}
//                   size="small"
//                   options={[
//                     { label: 'Reply', value: 'reply' },
//                     { label: 'URL', value: 'url' },
//                     { label: 'Call', value: 'call' },
//                   ]}
//                 />
//               </Col>
//               <Col xs={24} sm={9}>
//                 <Input
//                   placeholder="Button Text"
//                   size="small"
//                   value={action.title}
//                   onChange={(e) => updateCarouselAction(index, actionIdx, 'title', e.target.value)}
//                   maxLength={40}
//                 />
//               </Col>
//               <Col xs={24} sm={9}>
//                 <Input
//                   placeholder={action.type === 'url' ? 'https://...' : action.type === 'call' ? '+1234567890' : 'Text'}
//                   size="small"
//                   value={action.payload}
//                   onChange={(e) => updateCarouselAction(index, actionIdx, 'payload', e.target.value)}
//                 />
//               </Col>
//               <Col xs={24} style={{ textAlign: 'right' }}>
//                 <Button
//                   type="text"
//                   danger
//                   size="small"
//                   icon={<DeleteOutlined />}
//                   onClick={() => removeCarouselAction(index, actionIdx)}
//                 >
//                   Remove
//                 </Button>
//               </Col>
//             </Row>
//           </Card>
//         ))}
//       </div>
//     </Card>
//   );

//   return (
//     <Layout style={{ minHeight: '100vh', background: '#fafafa' }}>
//       <Layout.Content style={{ padding: screens.md ? '24px' : '16px' }}>
//         <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
//           {/* Breadcrumb Navigation */}
//           <Breadcrumb style={{ marginBottom: '24px', fontSize: '13px' }}>
//             <Breadcrumb.Item>
//               <HomeOutlined style={{ marginRight: '6px' }} />
//               Home
//             </Breadcrumb.Item>
//             <Breadcrumb.Item>
//               <Button 
//                 type="link" 
//                 size="small" 
//                 onClick={() => navigate('/templates')}
//                 style={{ padding: 0, height: 'auto' }}
//               >
//                 Templates
//               </Button>
//             </Breadcrumb.Item>
//             <Breadcrumb.Item>
//               <span style={{ color: '#1890ff', fontWeight: 600 }}>
//                 {editingTemplate ? 'Edit Template' : 'Create Template'}
//               </span>
//             </Breadcrumb.Item>
//           </Breadcrumb>

//           {/* Page Header */}
//           <div style={{
//             marginBottom: '32px',
//             paddingBottom: '24px',
//             borderBottom: '2px solid #e8e8e8',
//           }}>
//             <Row gutter={[16, 16]} align="middle">
//               <Col xs={24} sm={4} md={3} lg={2}>
//                 <div
//                   style={{
//                     width: '64px',
//                     height: '64px',
//                     background: '#e8f4fd',
//                     borderRadius: '16px',
//                     display: 'flex',
//                     alignItems: 'center',
//                     justifyContent: 'center',
//                     boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
//                     margin: '0 auto',
//                   }}
//                 >
//                   <FormOutlined
//                     style={{
//                       color: '#1890ff',
//                       fontSize: '32px',
//                     }}
//                   />
//                 </div>
//               </Col>
//               <Col xs={24} sm={20} md={21} lg={22}>
//                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                   <div>
//                     <h1
//                       style={{
//                         fontSize: screens.md ? '32px' : '24px',
//                         fontWeight: 700,
//                         color: '#000',
//                         marginBottom: '8px',
//                       }}
//                     >
//                       {editingTemplate ? 'Edit Template 📝' : 'Create New Template 🎨'}
//                     </h1>
//                     <p
//                       style={{
//                         color: '#666',
//                         fontSize: '14px',
//                         fontWeight: 500,
//                         margin: 0,
//                       }}
//                     >
//                       Design and customize message templates with real-time mobile preview
//                     </p>
//                   </div>
//                   <Button
//                     icon={<ArrowLeftOutlined />}
//                     onClick={() => navigate('/templates')}
//                     style={{ borderRadius: '8px' }}
//                   >
//                     Back to Templates
//                   </Button>
//                 </div>
//               </Col>
//             </Row>
//           </div>

//           {/* Main Form & Preview Layout */}
//           <Row gutter={[24, 24]}>
//             {/* Left: Form Section */}
//             <Col xs={24} lg={17} xl={16}>
//               <Card
//                 style={{
//                   borderRadius: '12px',
//                   boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
//                   border: '1px solid #e8e8e8',
//                 }}
//                 bodyStyle={{ padding: '24px' }}
//               >
//                 <Form layout="vertical" form={form} onFinish={handleSubmit}>
//                   {/* Template Basic Info */}
//                   <Divider orientation="left" style={{ marginTop: 0, marginBottom: '20px' }}>
//                     <FormOutlined style={{ marginRight: '8px' }} />
//                     Template Information
//                   </Divider>

//                   <Row gutter={[16, 16]}>
//                     <Col xs={24} sm={12}>
//                       <Form.Item
//                         label="Template Name"
//                         required
//                         rules={[{ required: true, message: 'Please enter template name' }]}
//                       >
//                         <Input
//                           placeholder="e.g., Welcome Message"
//                           value={formData.name}
//                           onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//                           maxLength={80}
//                           prefix={<FileTextOutlined />}
//                         />
//                       </Form.Item>
//                     </Col>
//                     <Col xs={24} sm={12}>
//                       <Form.Item
//                         label="Message Type"
//                         required
//                         rules={[{ required: true, message: 'Please select message type' }]}
//                       >
//                         <Select
//                           value={messageType}
//                           onChange={setMessageType}
//                           options={[
//                             { label: '📝 Plain Text', value: 'text' },
//                             { label: '🔘 Text with Actions', value: 'text-with-action' },
//                             { label: '🎴 Single Rich Card', value: 'rcs' },
//                             { label: '🎠 Carousel', value: 'carousel' },
//                           ]}
//                         />
//                       </Form.Item>
//                     </Col>
//                   </Row>

//                   {/* Type Description */}
//                   {typeDescriptions[messageType] && (
//                     <div
//                       style={{
//                         padding: '12px 16px',
//                         background: `${typeColors[messageType]}15`,
//                         borderLeft: `4px solid ${typeColors[messageType]}`,
//                         borderRadius: '6px',
//                         marginBottom: '20px',
//                         fontSize: '13px',
//                         color: '#666',
//                       }}
//                     >
//                       <strong>ℹ️ {getMessageTypeLabel ? getMessageTypeLabel(messageType) : messageType}:</strong> {typeDescriptions[messageType]}
//                     </div>
//                   )}

//                   {/* Message Text */}
//                   {(messageType === 'text' || messageType === 'text-with-action') && (
//                     <Form.Item
//                       label="Message Text"
//                       required
//                       rules={[{ required: true, message: 'Please enter message text' }]}
//                     >
//                       <Input.TextArea
//                         rows={6}
//                         placeholder="Enter your message..."
//                         value={formData.text}
//                         onChange={(e) => setFormData({ ...formData, text: e.target.value })}
//                         maxLength={2000}
//                         showCount
//                       />
//                     </Form.Item>
//                   )}

//                   {/* Text with Action Buttons */}
//                   {messageType === 'text-with-action' && (
//                     <div style={{ marginBottom: '24px' }}>
//                       <div style={{
//                         display: 'flex',
//                         justifyContent: 'space-between',
//                         alignItems: 'center',
//                         marginBottom: '16px',
//                       }}>
//                         <span style={{ fontWeight: 600, fontSize: '14px' }}>Action Buttons</span>
//                         <Button
//                           type="dashed"
//                           size="small"
//                           icon={<PlusOutlined />}
//                           onClick={() => addAction('main')}
//                         >
//                           Add Button
//                         </Button>
//                       </div>

//                       {actions.map((action, index) => (
//                         <Card
//                           key={index}
//                           style={{
//                             marginBottom: '12px',
//                             borderRadius: '8px',
//                             backgroundColor: '#fafafa',
//                           }}
//                           size="small"
//                         >
//                           <Row gutter={[12, 12]}>
//                             <Col xs={24} sm={6}>
//                               <Select
//                                 value={action.type}
//                                 onChange={(value) => {
//                                   const newActions = [...actions];
//                                   newActions[index].type = value;
//                                   setActions(newActions);
//                                 }}
//                                 options={[
//                                   { label: '💬 Reply', value: 'reply' },
//                                   { label: '🔗 URL', value: 'url' },
//                                   { label: '📞 Call', value: 'call' },
//                                 ]}
//                               />
//                             </Col>
//                             <Col xs={24} sm={9}>
//                               <Input
//                                 placeholder="Button Text"
//                                 value={action.title}
//                                 onChange={(e) => {
//                                   const newActions = [...actions];
//                                   newActions[index].title = e.target.value;
//                                   setActions(newActions);
//                                 }}
//                                 maxLength={40}
//                               />
//                             </Col>
//                             <Col xs={24} sm={9}>
//                               <Input
//                                 placeholder={action.type === 'url' ? 'https://...' : action.type === 'call' ? '+1234567890' : 'Response text'}
//                                 value={action.payload}
//                                 onChange={(e) => {
//                                   const newActions = [...actions];
//                                   newActions[index].payload = e.target.value;
//                                   setActions(newActions);
//                                 }}
//                               />
//                             </Col>
//                             <Col xs={24} style={{ textAlign: 'right' }}>
//                               <Button
//                                 type="text"
//                                 danger
//                                 size="small"
//                                 icon={<DeleteOutlined />}
//                                 onClick={() => removeAction(index, 'main')}
//                               >
//                                 Remove
//                               </Button>
//                             </Col>
//                           </Row>
//                         </Card>
//                       ))}
//                     </div>
//                   )}

//                   {/* Rich Card Section */}
//                   {messageType === 'rcs' && (
//                     <div style={{ marginBottom: '24px' }}>
//                       <Divider orientation="left" style={{ marginTop: 0, marginBottom: '20px' }}>
//                         <AppstoreOutlined style={{ marginRight: '8px' }} />
//                         Rich Card Details
//                       </Divider>

//                       <Row gutter={[16, 16]}>
//                         <Col xs={24} sm={12}>
//                           <Form.Item label="Card Title" required>
//                             <Input
//                               placeholder="Enter card title"
//                               value={richCard.title}
//                               onChange={(e) => setRichCard({ ...richCard, title: e.target.value })}
//                               maxLength={80}
//                             />
//                           </Form.Item>
//                         </Col>
//                         <Col xs={24} sm={12}>
//                           <Form.Item label="Card Subtitle">
//                             <Input
//                               placeholder="Optional subtitle"
//                               value={richCard.subtitle}
//                               onChange={(e) => setRichCard({ ...richCard, subtitle: e.target.value })}
//                               maxLength={200}
//                             />
//                           </Form.Item>
//                         </Col>
//                       </Row>

//                       {/* Rich Card Image */}
//                       <Form.Item label="Card Image (Aspect Ratio: 2:1)">
//                         <Upload
//                           accept="image/*"
//                           maxCount={1}
//                           listType="picture-card"
//                           beforeUpload={(file) => handleImageSelect(file, 'richCard')}
//                           onRemove={() => handleDeleteImage('richCard')}
//                         >
//                           {!richCard.imageUrl ? (
//                             <div style={{ textAlign: 'center' }}>
//                               <CloudUploadOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
//                               <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
//                                 Upload Image
//                               </div>
//                             </div>
//                           ) : null}
//                         </Upload>
//                         {richCard.imageUrl && (
//                           <div style={{ marginTop: '12px', position: 'relative', display: 'inline-block' }}>
//                             <img
//                               src={richCard.imageUrl}
//                               alt="Preview"
//                               style={{
//                                 maxWidth: '200px',
//                                 maxHeight: '150px',
//                                 borderRadius: '8px',
//                                 border: '1px solid #e8e8e8',
//                               }}
//                             />
//                             <CheckOutlined
//                               style={{
//                                 position: 'absolute',
//                                 top: '8px',
//                                 right: '8px',
//                                 color: '#52c41a',
//                                 fontSize: '18px',
//                                 background: 'white',
//                                 borderRadius: '50%',
//                                 padding: '2px',
//                               }}
//                             />
//                           </div>
//                         )}
//                       </Form.Item>

//                       {/* Rich Card Actions */}
//                       <div style={{ marginBottom: '16px' }}>
//                         <div style={{
//                           display: 'flex',
//                           justifyContent: 'space-between',
//                           alignItems: 'center',
//                           marginBottom: '16px',
//                         }}>
//                           <span style={{ fontWeight: 600, fontSize: '14px' }}>Card Buttons</span>
//                           <Button
//                             type="dashed"
//                             size="small"
//                             icon={<PlusOutlined />}
//                             onClick={() => addAction('richCard')}
//                           >
//                             Add Button
//                           </Button>
//                         </div>

//                         {richCard.actions?.map((action, index) => (
//                           <Card
//                             key={index}
//                             style={{
//                               marginBottom: '12px',
//                               borderRadius: '8px',
//                               backgroundColor: '#fafafa',
//                             }}
//                             size="small"
//                           >
//                             <Row gutter={[12, 12]}>
//                               <Col xs={24} sm={6}>
//                                 <Select
//                                   value={action.type}
//                                   onChange={(value) => {
//                                     const newActions = [...richCard.actions];
//                                     newActions[index].type = value;
//                                     setRichCard({ ...richCard, actions: newActions });
//                                   }}
//                                   options={[
//                                     { label: '💬 Reply', value: 'reply' },
//                                     { label: '🔗 URL', value: 'url' },
//                                     { label: '📞 Call', value: 'call' },
//                                   ]}
//                                 />
//                               </Col>
//                               <Col xs={24} sm={9}>
//                                 <Input
//                                   placeholder="Button Text"
//                                   value={action.title}
//                                   onChange={(e) => {
//                                     const newActions = [...richCard.actions];
//                                     newActions[index].title = e.target.value;
//                                     setRichCard({ ...richCard, actions: newActions });
//                                   }}
//                                   maxLength={40}
//                                 />
//                               </Col>
//                               <Col xs={24} sm={9}>
//                                 <Input
//                                   placeholder={action.type === 'url' ? 'https://...' : action.type === 'call' ? '+1234567890' : 'Response text'}
//                                   value={action.payload}
//                                   onChange={(e) => {
//                                     const newActions = [...richCard.actions];
//                                     newActions[index].payload = e.target.value;
//                                     setRichCard({ ...richCard, actions: newActions });
//                                   }}
//                                 />
//                               </Col>
//                               <Col xs={24} style={{ textAlign: 'right' }}>
//                                 <Button
//                                   type="text"
//                                   danger
//                                   size="small"
//                                   icon={<DeleteOutlined />}
//                                   onClick={() => removeAction(index, 'richCard')}
//                                 >
//                                   Remove
//                                 </Button>
//                               </Col>
//                             </Row>
//                           </Card>
//                         ))}
//                       </div>
//                     </div>
//                   )}

//                   {/* Carousel Section */}
//                   {messageType === 'carousel' && (
//                     <div style={{ marginBottom: '24px' }}>
//                       <Divider orientation="left" style={{ marginTop: 0, marginBottom: '20px' }}>
//                         <UnorderedListOutlined style={{ marginRight: '8px' }} />
//                         Carousel Items ({carouselItems.length}/10)
//                       </Divider>

//                       <div style={{
//                         display: 'flex',
//                         justifyContent: 'space-between',
//                         alignItems: 'center',
//                         marginBottom: '16px',
//                       }}>
//                         <span style={{ fontSize: '13px', color: '#666' }}>
//                           Add up to 10 cards. Each card requires an image and at least one button.
//                         </span>
//                         <Button
//                           type="dashed"
//                           size="small"
//                           icon={<PlusOutlined />}
//                           onClick={addCarouselItem}
//                           disabled={carouselItems.length >= 10}
//                         >
//                           Add Card
//                         </Button>
//                       </div>

//                       <div style={{ maxHeight: '800px', overflowY: 'auto' }} data-carousel-section>
//                         {carouselItems.map((item, index) => renderCarouselItemEditor(item, index))}
//                       </div>
//                     </div>
//                   )}

//                   {/* Error Message */}
//                   {error && (
//                     <div
//                       style={{
//                         padding: '12px 16px',
//                         background: '#ff4d4f15',
//                         color: '#ff4d4f',
//                         borderRadius: '6px',
//                         marginBottom: '16px',
//                         borderLeft: '4px solid #ff4d4f',
//                         display: 'flex',
//                         alignItems: 'center',
//                         gap: '8px',
//                       }}
//                     >
//                       <ExclamationCircleOutlined />
//                       {error}
//                     </div>
//                   )}

//                   {/* Form Actions */}
//                   <Divider style={{ margin: '20px 0' }} />
//                   <Form.Item style={{ marginBottom: 0 }}>
//                     <Space style={{ float: 'right', width: '100%', justifyContent: 'flex-end' }}>
//                       <Button onClick={resetForm} icon={<ClearOutlined />}>
//                         Clear All
//                       </Button>
//                       <Button
//                         type="primary"
//                         htmlType="submit"
//                         loading={loading}
//                         style={{ background: '#1890ff' }}
//                         icon={editingTemplate ? <EditOutlined /> : <CheckOutlined />}
//                       >
//                         {editingTemplate ? '💾 Update Template' : '✨ Create Template'}
//                       </Button>
//                     </Space>
//                   </Form.Item>
//                 </Form>
//               </Card>
//             </Col>

//             {/* Right: Mobile Preview */}
//             <Col xs={24} lg={7} xl={8}>
//               <Card
//                 title={
//                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
//                     <MobileOutlined style={{ color: '#1890ff' }} />
//                     <span>Mobile Preview</span>
//                   </div>
//                 }
//                 style={{
//                   borderRadius: '12px',
//                   boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
//                   border: '1px solid #e8e8e8',
//                   position: screens.lg ? 'sticky' : 'static',
//                   top: '20px',
//                 }}
//                 bodyStyle={{ padding: '24px', minHeight: '600px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
//               >
//                 <RCSMessagePreview data={messageType} />

//                 {!messageType && (
//                   <div style={{
//                     textAlign: 'center',
//                     color: '#999',
//                     padding: '40px 20px',
//                   }}>
//                     <MobileOutlined style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }} />
//                     <p>Select a message type to see preview</p>
//                   </div>
//                 )}
//               </Card>
//             </Col>
//           </Row>
//         </div>
//       </Layout.Content>
//     </Layout>
//   );
// }