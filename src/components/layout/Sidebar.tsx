import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import {
  Dashboard,
  LocalShipping,
  DirectionsCar,
  Search,
  Add,
  Person,
  Chat,
  Star,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';
import { selectUser, selectPermissions } from '../../store/slices/authSlice';

interface SidebarProps {
  width: number;
  open: boolean;
  onClose: () => void;
  variant: 'permanent' | 'persistent' | 'temporary';
}

interface NavItem {
  text: string;
  icon: React.ReactElement;
  path: string;
  permission?: keyof import('../../types').Permissions;
  badge?: string | number;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  width, 
  open, 
  onClose, 
  variant 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);
  const permissions = useAppSelector(selectPermissions);

  const handleNavigation = (path: string) => {
    navigate(path);
    if (variant === 'temporary') {
      onClose();
    }
  };

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // Generate navigation items based on user permissions
  const getNavItems = (): NavItem[] => {
    const items: NavItem[] = [
      {
        text: 'Dashboard',
        icon: <Dashboard />,
        path: '/dashboard',
      },
    ];

    // Sender-specific items
    if (permissions?.canCreateDeliveries) {
      items.push(
        {
          text: 'My Deliveries',
          icon: <LocalShipping />,
          path: '/deliveries',
        },
        {
          text: 'Create Delivery',
          icon: <Add />,
          path: '/deliveries/create',
        }
      );
    }

    // Driver-specific items
    if (permissions?.canCreateTrips) {
      items.push(
        {
          text: 'My Trips',
          icon: <DirectionsCar />,
          path: '/trips',
        },
        {
          text: 'Create Trip',
          icon: <Add />,
          path: '/trips/create',
        }
      );
    }

    if (permissions?.canBid) {
      items.push({
        text: 'Browse Jobs',
        icon: <Search />,
        path: '/browse-jobs',
      });
    }

    // Common items
    items.push(
      {
        text: 'Profile',
        icon: <Person />,
        path: '/profile',
      }
    );

    return items;
  };

  const navItems = getNavItems();

  const drawerContent = (
    <Box>
      {/* Logo/Header */}
      <Box 
        sx={{ 
          p: 2, 
          display: 'flex', 
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6" fontWeight="bold" color="primary">
          DeliveryMatch
        </Typography>
      </Box>

      {/* User Info */}
      {user && (
        <Box sx={{ p: 2, backgroundColor: 'grey.50' }}>
          <Typography variant="subtitle2" fontWeight="medium">
            {user.firstName} {user.lastName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user.email}
          </Typography>
          <Box sx={{ mt: 1 }}>
            <Chip 
              label={
                user.userType === 'both' 
                  ? 'Sender & Driver' 
                  : user.userType.charAt(0).toUpperCase() + user.userType.slice(1)
              }
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>
          
          {/* Ratings */}
          <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {(user.userType === 'sender' || user.userType === 'both') && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Star sx={{ fontSize: 14, color: 'warning.main' }} />
                <Typography variant="caption">
                  {user.senderRating.toFixed(1)} ({user.totalSenderRatings || 0})
                </Typography>
              </Box>
            )}
            {(user.userType === 'driver' || user.userType === 'both') && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <DirectionsCar sx={{ fontSize: 14, color: 'info.main' }} />
                <Star sx={{ fontSize: 14, color: 'warning.main' }} />
                <Typography variant="caption">
                  {user.driverRating.toFixed(1)} ({user.totalDriverRatings || 0})
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      )}

      <Divider />

      {/* Navigation Items */}
      <List sx={{ py: 1 }}>
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              selected={isActive(item.path)}
              sx={{
                mx: 1,
                borderRadius: 1,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'primary.contrastText',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 36,
                  color: isActive(item.path) ? 'inherit' : 'text.secondary',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: isActive(item.path) ? 500 : 400,
                }}
              />
              {item.badge && (
                <Chip
                  label={item.badge}
                  size="small"
                  color="secondary"
                  sx={{ ml: 1 }}
                />
              )}
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width: width,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: width,
          boxSizing: 'border-box',
          borderRight: '1px solid',
          borderColor: 'divider',
        },
      }}
      ModalProps={{
        keepMounted: true, // Better mobile performance
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;