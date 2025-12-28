import React, { useRef, useState } from 'react';
import { Modal, Slider, Button, Space, Row, Col } from 'antd';
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  BorderOutlined,
} from '@ant-design/icons';
import { THEME_CONSTANTS } from '../theme';

/**
 * ImageCropper Component
 * Provides advanced image cropping functionality with:
 * - Drag-to-move crop area
 * - Zoom control (0.5x to 3x)
 * - Rotation control (-180° to 180°)
 * - Corner handles for resizing
 * - Live preview
 * - Crop information display
 */
export default function ImageCropper({
  open,
  onCancel,
  onCropComplete,
  imageUrl,
  loading = false,
}) {
  const imageRef = useRef(null);
  const canvasRef = useRef(null);

  // Crop state
  const [crop, setCrop] = useState({ x: 50, y: 50, width: 200, height: 150 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Image dimensions
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });

  // Handle image load
  const handleImageLoad = (e) => {
    const img = e.target;
    setImageDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight,
    });
    if (crop.width === 0) {
      setCrop({
        x: 0,
        y: 0,
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    }
  };

  // Mouse down - start dragging
  const handleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!imageRef.current) return;

    setIsDragging(true);
    const rect = imageRef.current.getBoundingClientRect();
    setDragStart({
      x: e.clientX - rect.left - crop.x,
      y: e.clientY - rect.top - crop.y,
    });
  };

  // Mouse move - drag crop area
  const handleMouseMove = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isDragging || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const newX = Math.max(
      0,
      Math.min(rect.width - crop.width, e.clientX - rect.left - dragStart.x)
    );
    const newY = Math.max(
      0,
      Math.min(rect.height - crop.height, e.clientY - rect.top - dragStart.y)
    );

    setCrop((prev) => ({
      ...prev,
      x: newX,
      y: newY,
    }));
  };

  // Mouse up - stop dragging
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Reset to default crop
  const handleResetCrop = () => {
    setCrop({
      x: 50,
      y: 50,
      width: Math.min(200, imageDimensions.width),
      height: Math.min(150, imageDimensions.height),
    });
  };

  // Reset zoom
  const handleResetZoom = () => {
    setZoom(1);
  };

  // Reset rotation
  const handleResetRotation = () => {
    setRotation(0);
  };

  // Center crop
  const handleCenterCrop = () => {
    setCrop((prev) => ({
      ...prev,
      x: (imageDimensions.width - prev.width) / 2,
      y: (imageDimensions.height - prev.height) / 2,
    }));
  };

  // Rotate left
  const handleRotateLeft = () => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  };

  // Rotate right
  const handleRotateRight = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Calculate crop information
  const cropWidth = Math.round(crop.width);
  const cropHeight = Math.round(crop.height);
  const aspectRatio = (crop.width / crop.height).toFixed(2);
  const coverage = Math.round(
    (crop.width * crop.height) / (imageDimensions.width * imageDimensions.height) *
      100
  );

  return (
    <Modal
      title={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <BorderOutlined style={{ color: THEME_CONSTANTS.colors.primary }} />
          <span style={{ fontWeight: 600, fontSize: '18px' }}>Crop Your Image</span>
        </div>
      }
      open={open}
      onCancel={onCancel}
      width={1000}
      footer={
        <Space>
          <Button onClick={onCancel} size="large">
            Cancel
          </Button>
          <Button
            type="primary"
            size="large"
            loading={loading}
            onClick={() => {
              // Create canvas for actual cropping
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              const img = new Image();
              
              img.onload = () => {
                // Calculate crop dimensions relative to displayed image
                const displayedImg = document.querySelector('#crop-image');
                const scaleX = img.naturalWidth / displayedImg.width;
                const scaleY = img.naturalHeight / displayedImg.height;
                
                // Calculate actual crop coordinates
                const cropX = crop.x * scaleX;
                const cropY = crop.y * scaleY;
                const cropWidth = crop.width * scaleX;
                const cropHeight = crop.height * scaleY;
                
                // Set canvas to crop size
                canvas.width = cropWidth;
                canvas.height = cropHeight;
                
                // Draw only the cropped portion
                ctx.drawImage(
                  img,
                  cropX, cropY, cropWidth, cropHeight,
                  0, 0, cropWidth, cropHeight
                );
                
                // Convert to blob and trigger callback
                canvas.toBlob((blob) => {
                  if (blob) {
                    const croppedFile = new File([blob], 'cropped-image.jpg', {
                      type: 'image/jpeg',
                      lastModified: Date.now(),
                    });
                    onCropComplete(croppedFile, { crop, zoom, rotation });
                  }
                }, 'image/jpeg', 0.9);
              };
              
              img.src = imageUrl;
            }}
            style={{ background: THEME_CONSTANTS.colors.primary }}
          >
            {loading ? 'Processing...' : 'Crop & Use Image'}
          </Button>
        </Space>
      }
      bodyStyle={{ padding: '24px' }}
      destroyOnClose
      maskClosable={false}
    >
      <div style={{ display: 'flex', gap: '24px' }}>
        {/* Left side - Image with crop area */}
        <div style={{ flex: 1 }}>
          {/* Instructions */}
          <div style={{ marginBottom: '16px' }}>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#495057',
                marginBottom: '8px',
              }}
            >
              Drag the blue box to select crop area
            </div>
            <div style={{ fontSize: '13px', color: '#6c757d' }}>
              Resize with corner handles. Use controls below to zoom & rotate.
            </div>
          </div>

          {/* Image container */}
          <div
            ref={imageRef}
            style={{
              position: 'relative',
              width: '100%',
              height: '500px',
              background: '#000',
              borderRadius: '12px',
              overflow: 'hidden',
              cursor: isDragging ? 'grabbing' : 'grab',
              marginBottom: '16px',
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Image */}
            <img
              id="crop-image"
              src={imageUrl}
              alt="Crop source"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transition: isDragging ? 'none' : 'transform 0.3s ease',
                draggable: false,
              }}
              onLoad={handleImageLoad}
            />

            {/* Semi-transparent overlay */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.5)',
              }}
            />

            {/* Crop area */}
            <div
              style={{
                position: 'absolute',
                left: crop.x,
                top: crop.y,
                width: crop.width,
                height: crop.height,
                border: '3px solid #1890ff',
                background: 'transparent',
                cursor: 'move',
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
              }}
              onMouseDown={handleMouseDown}
            >
              {/* Corner handles */}
              {['nw', 'ne', 'sw', 'se'].map((corner) => (
                <div
                  key={corner}
                  style={{
                    position: 'absolute',
                    width: '12px',
                    height: '12px',
                    background: '#1890ff',
                    border: '2px solid white',
                    borderRadius: '50%',
                    cursor: corner.includes('n')
                      ? corner.includes('w')
                        ? 'nw-resize'
                        : 'ne-resize'
                      : corner.includes('w')
                      ? 'sw-resize'
                      : 'se-resize',
                    ...(corner.includes('n') ? { top: '-6px' } : { bottom: '-6px' }),
                    ...(corner.includes('w') ? { left: '-6px' } : { right: '-6px' }),
                  }}
                />
              ))}

              {/* Center indicator */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '20px',
                  height: '20px',
                  background: 'rgba(24, 144, 255, 0.8)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px',
                  pointerEvents: 'none',
                }}
              />
            </div>
          </div>
        </div>

        {/* Right side - Controls */}
        <div style={{ width: '280px' }}>
          {/* Preview */}
          <div style={{ marginBottom: '20px' }}>
            <div
              style={{
                background: '#f8f9fa',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '12px',
              }}
            >
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '12px',
                  color: '#495057',
                }}
              >
                Crop Preview
              </div>
              <div
                style={{
                  width: '120px',
                  height: '90px',
                  background: '#fff',
                  border: '2px solid #dee2e6',
                  borderRadius: '8px',
                  margin: '0 auto',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt="Preview"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ marginBottom: '20px' }}>
            <div
              style={{
                background: '#f8f9fa',
                borderRadius: '12px',
                padding: '16px',
              }}
            >
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '12px',
                  color: '#495057',
                }}
              >
                Quick Actions
              </div>
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                <Button
                  block
                  onClick={handleCenterCrop}
                  icon={<BorderOutlined />}
                >
                  Center Crop
                </Button>
                <Button
                  block
                  onClick={handleResetZoom}
                  icon={<ZoomOutOutlined />}
                >
                  Reset Zoom
                </Button>
                <Button
                  block
                  onClick={handleResetRotation}
                  icon={<RotateLeftOutlined />}
                >
                  Reset Rotation
                </Button>
              </Space>
            </div>
          </div>

          {/* Zoom Control */}
          <div style={{ marginBottom: '16px' }}>
            <div
              style={{
                background: '#f8f9fa',
                borderRadius: '12px',
                padding: '16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                }}
              >
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#495057',
                  }}
                >
                  Zoom
                </span>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: THEME_CONSTANTS.colors.primary,
                    background: '#e3f2fd',
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}
                >
                  {Math.round(zoom * 100)}%
                </span>
              </div>
              <Slider
                min={0.5}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(value) => setZoom(value)}
                trackStyle={{ background: THEME_CONSTANTS.colors.primary }}
                handleStyle={{ borderColor: THEME_CONSTANTS.colors.primary }}
              />
            </div>
          </div>

          {/* Rotation Control */}
          <div style={{ marginBottom: '16px' }}>
            <div
              style={{
                background: '#f8f9fa',
                borderRadius: '12px',
                padding: '16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                }}
              >
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#495057',
                  }}
                >
                  Rotate
                </span>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: THEME_CONSTANTS.colors.primary,
                    background: '#e3f2fd',
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}
                >
                  {rotation}°
                </span>
              </div>
              <Slider
                min={-180}
                max={180}
                step={15}
                value={rotation}
                onChange={(value) => setRotation(value)}
                trackStyle={{ background: THEME_CONSTANTS.colors.primary }}
                handleStyle={{ borderColor: THEME_CONSTANTS.colors.primary }}
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <Button
                  size="small"
                  onClick={handleRotateLeft}
                  style={{ flex: 1 }}
                >
                  ↺ -90°
                </Button>
                <Button
                  size="small"
                  onClick={handleRotateRight}
                  style={{ flex: 1 }}
                >
                  ↻ +90°
                </Button>
              </div>
            </div>
          </div>

          {/* Crop Information */}
          <div
            style={{
              background: '#eff6ff',
              border: `1px solid #bfdbfe`,
              borderRadius: '12px',
              padding: '16px',
            }}
          >
            <h4
              style={{
                fontWeight: 'semibold',
                color: '#1e3a8a',
                marginBottom: '12px',
              }}
            >
              Image Information
            </h4>
            <Row gutter={[8, 8]}>
              <Col span={12}>
                <div style={{ fontSize: '12px', color: '#1e40af' }}>
                  Original Size
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#1e3a8a',
                  }}
                >
                  {imageDimensions.width}x{imageDimensions.height}px
                </div>
              </Col>
              <Col span={12}>
                <div style={{ fontSize: '12px', color: '#1e40af' }}>
                  Crop Size
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#1e3a8a',
                  }}
                >
                  {cropWidth}x{cropHeight}px
                </div>
              </Col>
              <Col span={12}>
                <div style={{ fontSize: '12px', color: '#1e40af' }}>
                  Aspect Ratio
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#1e3a8a',
                  }}
                >
                  {aspectRatio}
                </div>
              </Col>
              <Col span={12}>
                <div style={{ fontSize: '12px', color: '#1e40af' }}>
                  Coverage
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#1e3a8a',
                  }}
                >
                  {coverage}%
                </div>
              </Col>
            </Row>
          </div>
        </div>
      </div>
    </Modal>
  );
}
