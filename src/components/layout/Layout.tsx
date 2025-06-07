import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { selectSidebarOpen, setSidebarOpen } from '../../store/slices/uiSlice';

import AppBar from './AppBar';
import Sidebar from './Sidebar';
import NotificationCenter from '../notifications/NotificationCenter';

const Layout: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const sidebarOpen = useAppSelector(selectSidebarOpen);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleSidebarToggle = () => {
    dispatch(setSidebarOpen(!sidebarOpen));
  };

  const handleSidebarClose = () => {
    dispatch(setSidebarOpen(false));
  };

  const sidebarWidth = 280;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar 
        onMenuClick={handleSidebarToggle}
        sidebarWidth={sidebarWidth}
        sidebarOpen={sidebarOpen && !isMobile}
      />

      {/* Sidebar */}
      <Sidebar
        width={sidebarWidth}
        open={sidebarOpen}
        onClose={handleSidebarClose}
        variant={isMobile ? 'temporary' : 'persistent'}
      />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: {
            md: sidebarOpen ? `calc(100% - ${sidebarWidth}px)` : '100%',
          },
          marginLeft: {
            md: sidebarOpen ? `${sidebarWidth}px` : 0,
          },
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          mt: 8, // AppBar height
          backgroundColor: 'background.default',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          <Outlet />
        </Box>
      </Box>

      {/* Notification Center */}
      <NotificationCenter />
    </Box>
  );
};

export default Layout;