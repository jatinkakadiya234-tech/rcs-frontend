import React from 'react';
import { Row, Col, Breadcrumb } from 'antd';
import { THEME_CONSTANTS } from '../theme';

const AdminPageHeader = ({ 
  title, 
  description, 
  icon: IconComponent, 
  breadcrumbs = [], 
  actions = null,
  emoji = null 
}) => {
  return (
    <div style={{
      marginBottom: THEME_CONSTANTS.spacing.xxxl,
      paddingBottom: THEME_CONSTANTS.spacing.xl,
      borderBottom: `2px solid ${THEME_CONSTANTS.colors.primaryLight}`,
      padding: THEME_CONSTANTS.spacing.xl
    }}>
      <Breadcrumb style={{
        marginBottom: THEME_CONSTANTS.spacing.md,
        fontSize: THEME_CONSTANTS.typography.caption.size
      }}>
        <Breadcrumb.Item>
          <span style={{ color: THEME_CONSTANTS.colors.textMuted }}>Admin</span>
        </Breadcrumb.Item>
        {breadcrumbs.map((crumb, index) => (
          <Breadcrumb.Item key={index}>
            <span style={{ 
              color: index === breadcrumbs.length - 1 
                ? THEME_CONSTANTS.colors.primary 
                : THEME_CONSTANTS.colors.textMuted,
              fontWeight: index === breadcrumbs.length - 1 
                ? THEME_CONSTANTS.typography.h6.weight 
                : 'normal'
            }}>
              {crumb}
            </span>
          </Breadcrumb.Item>
        ))}
      </Breadcrumb>

      <Row gutter={[16, 16]} align="middle" justify="space-between">
        <Col xs={24} lg={actions ? 18 : 24}>
          <Row gutter={[16, 16]} align="middle">
            {IconComponent && (
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
                  <IconComponent style={{
                    color: THEME_CONSTANTS.colors.primary,
                    fontSize: '32px'
                  }} />
                </div>
              </Col>
            )}
            <Col xs={24} sm={IconComponent ? 20 : 24} md={IconComponent ? 21 : 24} lg={IconComponent ? 21 : 24}>
              <div style={{ textAlign: { xs: 'center', sm: IconComponent ? 'left' : 'center' } }}>
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
                  {title} {emoji}
                </h1>
                <p style={{
                  color: THEME_CONSTANTS.colors.textSecondary,
                  fontSize: THEME_CONSTANTS.typography.body.size,
                  fontWeight: 500,
                  lineHeight: THEME_CONSTANTS.typography.body.lineHeight,
                  margin: 0
                }}>
                  {description}
                </p>
              </div>
            </Col>
          </Row>
        </Col>
        {actions && (
          <Col xs={24} lg={6}>
            <div style={{ textAlign: { xs: 'center', lg: 'right' } }}>
              {actions}
            </div>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default AdminPageHeader;