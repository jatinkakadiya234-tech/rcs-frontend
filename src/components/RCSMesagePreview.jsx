import React from 'react';
import { Card, Button, Tag, Empty } from 'antd';
import {
  MessageOutlined,
  PhoneOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { THEME_CONSTANTS } from '../theme';

/**
 * RCSMessagePreview Component
 * Displays a preview of message templates in a realistic mobile UI
 * Supports: Text, Image, Rich Card, and Carousel message types
 */
export default function RCSMessagePreview({ data }) {
  if (!data) {
    return (
      <Empty
        description="No template data"
        style={{ color: THEME_CONSTANTS.colors.textSecondary }}
      />
    );
  }

  const messageType = data?.messageType || 'text';
  const phoneStyle = {
    width: 'min(280px, 90vw)',
    height: 'clamp(350px, 60vh, 500px)',
    background: '#000',
    borderRadius: '20px',
    padding: '6px',
    margin: '0 auto',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box'
  };

  const screenStyle = {
    width: '100%',
    height: '100%',
    background: '#fff',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  const headerStyle = {
    background: '#fff',
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderBottom: `1px solid ${THEME_CONSTANTS.colors.borderLight}`,
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
    minWidth: 'min(160px, 50vw)',
    maxWidth: '90%',
    alignSelf: 'flex-end',
    background: '#e3f2fd',
    borderRadius: '18px 18px 4px 18px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    boxSizing: 'border-box'
  };

  // Render text message
  const renderTextMessage = () => {
    const text = data?.text || '';
    if (!text) return null;

    return (
      <div style={messageBubbleStyle}>
        <div style={{ padding: '12px 16px' }}>
          <p
            style={{
              color: '#000',
              fontSize: '14px',
              margin: 0,
              lineHeight: '1.4',
              whiteSpace: 'pre-wrap',
            }}
          >
            {text}
          </p>
        </div>
      </div>
    );
  };

  // Render rich card
  const renderRichCard = () => {
    const card = data?.richCard;
    if (!card || !card.title) return null;

    return (
      <div style={messageBubbleStyle}>
        {card.imageUrl && (
          <img
            src={card.imageUrl}
            alt="RCS Card"
            style={{
              width: '100%',
              height: '160px',
              objectFit: 'cover',
            }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        )}
        <div style={{ padding: '12px' }}>
          <h4
            style={{
              color: '#000',
              fontSize: '14px',
              fontWeight: '600',
              margin: '0 0 4px 0',
            }}
          >
            {card.title}
          </h4>
          {card.subtitle && (
            <p
              style={{
                color: '#333',
                fontSize: '12px',
                margin: '0 0 12px 0',
                lineHeight: '1.4',
              }}
            >
              {card.subtitle}
            </p>
          )}
          {card.actions && card.actions.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {card.actions
                .filter((a) => a.title && a.title.trim())
                .slice(0, 2)
                .map((action, idx) => (
                  <button
                    key={idx}
                    style={{
                      background: '#fff',
                      border: '1px solid #dadce0',
                      borderRadius: '20px',
                      color: '#1a73e8',
                      padding: '8px 16px',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      justifyContent: 'center',
                    }}
                  >
                    {action.type === 'call' && <PhoneOutlined />}
                    {action.type === 'url' && <LinkOutlined />}
                    {action.type === 'reply' && <MessageOutlined />}
                    <span>{action.title}</span>
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render carousel
  const renderCarousel = () => {
    const items = data?.carouselItems;
    if (!items || items.length === 0) return null;

    return (
      <div
        style={{
          ...messageBubbleStyle,
          background: 'transparent',
          boxShadow: 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            padding: '0 4px',
          }}
        >
          {items.slice(0, 3).map((item, idx) => (
            <div
              key={idx}
              style={{
                minWidth: 'min(120px, 35vw)',
                background: '#e3f2fd',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                boxSizing: 'border-box'
              }}
            >
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  style={{
                    width: '100%',
                    height: '100px',
                    objectFit: 'cover',
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              )}
              <div style={{ padding: '10px' }}>
                <h5
                  style={{
                    color: '#000',
                    fontSize: '12px',
                    fontWeight: '600',
                    margin: '0 0 4px 0',
                  }}
                >
                  {item.title}
                </h5>
                {item.subtitle && (
                  <p
                    style={{
                      color: '#333',
                      fontSize: '10px',
                      margin: '0 0 8px 0',
                    }}
                  >
                    {item.subtitle}
                  </p>
                )}
                {item.actions && item.actions.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {item.actions
                      .filter((a) => a.title && a.title.trim())
                      .slice(0, 2)
                      .map((action, actionIdx) => (
                        <button
                          key={actionIdx}
                          style={{
                            background: '#fff',
                            border: '1px solid #dadce0',
                            borderRadius: '20px',
                            color: '#1a73e8',
                            padding: '6px 12px',
                            fontSize: '10px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            justifyContent: 'center',
                          }}
                        >
                          {action.type === 'call' && <PhoneOutlined />}
                          {action.type === 'url' && <LinkOutlined />}
                          {action.type === 'reply' && <MessageOutlined />}
                          <span>{action.title}</span>
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

  // Render quick reply buttons
  const renderQuickReplies = () => {
    const actions = data?.actions;
    if (!actions || actions.length === 0) return null;

    return (
      <div
        style={{
          alignSelf: 'flex-end',
          maxWidth: '95%',
          marginTop: '8px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
          }}
        >
          {actions
            .filter((a) => a.title && a.title.trim())
            .slice(0, 3)
            .map((action, idx) => (
              <button
                key={idx}
                style={{
                  background: '#fff',
                  border: '1px solid #dadce0',
                  color: '#1a73e8',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {action.type === 'call' && <PhoneOutlined />}
                {action.type === 'url' && <LinkOutlined />}
                {action.type === 'reply' && <MessageOutlined />}
                <span>{action.title}</span>
              </button>
            ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ 
      padding: 'clamp(8px, 2vw, 20px)', 
      background: '#f5f7fa', 
      borderRadius: '12px',
      width: '100%',
      maxWidth: '100%',
      overflow: 'hidden',
      boxSizing: 'border-box'
    }}>
      <div style={phoneStyle}>
        <div style={screenStyle}>
          {/* Phone Header */}
          <div style={headerStyle}>
            <div
              style={{
                width: 'clamp(28px, 6vw, 32px)',
                height: 'clamp(28px, 6vw, 32px)',
                borderRadius: '50%',
                background: '#4caf50',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ color: '#fff', fontSize: 'clamp(10px, 2.5vw, 12px)', fontWeight: '600' }}>
                B
              </span>
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontSize: 'clamp(12px, 3vw, 14px)', fontWeight: '600' }}>
                Business
              </h4>
              <p style={{ margin: 0, fontSize: 'clamp(9px, 2vw, 11px)', color: '#666' }}>
                RCS Online
              </p>
            </div>
            <div
              style={{
                width: 'clamp(16px, 4vw, 20px)',
                height: 'clamp(16px, 4vw, 20px)',
                borderRadius: '50%',
                background: '#e0e0e0',
              }}
            />
          </div>

          {/* Chat Area */}
          <div style={chatAreaStyle}>
            {/* Render based on message type */}
            {messageType === 'text' && renderTextMessage()}
            {messageType === 'text-with-action' && (
              <div style={messageBubbleStyle}>
                <div style={{ padding: '12px 16px' }}>
                  <p
                    style={{
                      color: '#000',
                      fontSize: '14px',
                      margin: 0,
                      lineHeight: '1.4',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {data?.text || ''}
                  </p>
                </div>
                {data?.actions && data.actions.length > 0 && (
                  <div style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {data.actions
                        .filter((a) => a.title && a.title.trim())
                        .slice(0, 3)
                        .map((action, idx) => (
                          <button
                            key={idx}
                            style={{
                              background: '#fff',
                              border: '1px solid #dadce0',
                              borderRadius: '20px',
                              color: '#1a73e8',
                              padding: '8px 16px',
                              fontSize: '12px',
                              fontWeight: '500',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              justifyContent: 'center',
                            }}
                          >
                            {action.type === 'call' && <PhoneOutlined />}
                            {action.type === 'url' && <LinkOutlined />}
                            {action.type === 'reply' && <MessageOutlined />}
                            <span>{action.title}</span>
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {messageType === 'rcs' && renderRichCard()}
            {messageType === 'carousel' && renderCarousel()}

            {/* Quick replies for text only */}
            {messageType === 'text' && renderQuickReplies()}

            {/* Delivery status */}
            <div style={{ alignSelf: 'flex-end', marginTop: '8px' }}>
              <span style={{ fontSize: '10px', color: '#666' }}>
                ✓✓ Delivered
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}