import React, { useState, useEffect } from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  IconButton,
  Box,
  Typography,
  Slide,
  Fade,
} from '@mui/material';
import {
  Close,
  NotificationsActive,
  LocalShipping,
  DirectionsCar,
  AttachMoney,
  Chat,
} from '@mui/icons-material';
import type { TransitionProps } from '@mui/material/transitions';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { 
  selectNotifications, 
  markNotificationRead,
  removeNotification 
} from '../../store/slices/socketSlice';
import type { Notification } from '../../types';

function SlideTransition(props: TransitionProps & {
  children: React.ReactElement<any, any>;
}) {
  return <Slide {...props} direction="left" />;
}

const NotificationCenter: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const notifications = useAppSelector(selectNotifications);
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);
  const [queue, setQueue] = useState<Notification[]>([]);

  // Process notification queue
  useEffect(() => {
    const unreadNotifications = notifications.filter(n => !n.read);
    
    if (unreadNotifications.length > 0 && !currentNotification) {
      const nextNotification = unreadNotifications[0];
      setCurrentNotification(nextNotification);
      setQueue(unreadNotifications.slice(1));
    }
  }, [notifications, currentNotification]);

  const handleClose = (notificationId?: string) => {
    if (currentNotification) {
      // Mark as read
      dispatch(markNotificationRead(currentNotification.id));
      
      // Show next notification in queue
      if (queue.length > 0) {
        const nextNotification = queue[0];
        setCurrentNotification(nextNotification);
        setQueue(queue.slice(1));
      } else {
        setCurrentNotification(null);
      }
    }
  };

  const handleNotificationClick = () => {
    if (currentNotification) {
      // Mark as read and navigate
      dispatch(markNotificationRead(currentNotification.id));
      
      // Navigate based on notification type and data
      const { data, type } = currentNotification;
      
      if (data?.deliveryId) {
        navigate(`/deliveries/${data.deliveryId}`);
      } else if (data?.tripId) {
        navigate(`/trips/${data.tripId}`);
      } else if (currentNotification.actionUrl) {
        navigate(currentNotification.actionUrl);
      }
      
      // Clear current notification
      setCurrentNotification(null);
      
      // Show next notification
      if (queue.length > 0) {
        const nextNotification = queue[0];
        setCurrentNotification(nextNotification);
        setQueue(queue.slice(1));
      }
    }
  };

  const handleDismiss = () => {
    if (currentNotification) {
      dispatch(removeNotification(currentNotification.id));
      setCurrentNotification(null);
      
      // Show next notification
      if (queue.length > 0) {
        const nextNotification = queue[0];
        setCurrentNotification(nextNotification);
        setQueue(queue.slice(1));
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'bid':
        return <AttachMoney />;
      case 'delivery_update':
        return <LocalShipping />;
      case 'trip_update':
        return <DirectionsCar />;
      case 'message':
        return <Chat />;
      case 'match':
        return <NotificationsActive />;
      default:
        return <NotificationsActive />;
    }
  };

  const getSeverity = (type: string): 'success' | 'info' | 'warning' | 'error' => {
    switch (type) {
      case 'bid':
        return 'info';
      case 'delivery_update':
        return 'success';
      case 'trip_update':
        return 'success';
      case 'message':
        return 'info';
      case 'match':
        return 'warning';
      default:
        return 'info';
    }
  };

  if (!currentNotification) {
    return null;
  }

  return (
    <Snackbar
      open={Boolean(currentNotification)}
      autoHideDuration={6000}
      onClose={() => handleClose()}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      TransitionComponent={SlideTransition}
      sx={{ 
        mt: 8, // Below AppBar
        mr: 2,
        maxWidth: 400,
      }}
    >
      <Alert
        severity={getSeverity(currentNotification.type)}
        variant="filled"
        icon={getNotificationIcon(currentNotification.type)}
        onClick={handleNotificationClick}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={handleDismiss}
          >
            <Close fontSize="small" />
          </IconButton>
        }
        sx={{
          width: '100%',
          cursor: 'pointer',
          '&:hover': {
            opacity: 0.9,
          },
          '& .MuiAlert-message': {
            width: '100%',
          },
        }}
      >
        <AlertTitle sx={{ fontWeight: 'bold', mb: 0.5 }}>
          {currentNotification.title}
        </AlertTitle>
        <Typography variant="body2">
          {currentNotification.message}
        </Typography>
        
        {/* Show queue indicator */}
        {queue.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              +{queue.length} more notification{queue.length > 1 ? 's' : ''}
            </Typography>
          </Box>
        )}
      </Alert>
    </Snackbar>
  );
};

export default NotificationCenter;