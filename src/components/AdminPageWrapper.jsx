import React from 'react';
import { THEME_CONSTANTS } from '../theme';

const AdminPageWrapper = ({ children }) => {
  return (
    <div style={{ 
      background: THEME_CONSTANTS.colors.background, 
      minHeight: '100vh' 
    }}>
      <div style={{ 
        maxWidth: THEME_CONSTANTS.layout.maxContentWidth, 
        margin: '0 auto',
        padding: `${THEME_CONSTANTS.spacing.sm} ${THEME_CONSTANTS.spacing.xl}`,
        '@media (max-width: 768px)': {
          padding: `${THEME_CONSTANTS.spacing.xs} ${THEME_CONSTANTS.spacing.lg}`,
        }
      }}>
        {children}
      </div>
    </div>
  );
};

export default AdminPageWrapper;