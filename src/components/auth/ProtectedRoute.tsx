import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';
import { selectIsAuthenticated, selectPermissions, selectAuthLoading } from '../../store/slices/authSlice';
import LoadingScreen from '../common/LoadingScreen';
import { Box, Typography, Paper, Button } from '@mui/material';
import { LockOutlined } from '@mui/icons-material';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: keyof import('../../types').Permissions | (keyof import('../../types').Permissions)[];
  requireAll?: boolean; // true = need ALL permissions, false = need ANY permission (default)
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredPermission,
  requireAll = false 
}) => {
  const location = useLocation();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const permissions = useAppSelector(selectPermissions);
  const loading = useAppSelector(selectAuthLoading);

  // Show loading while auth check is in progress
  if (loading) {
    return <LoadingScreen message="Checking authentication..." />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check specific permission if required
  if (requiredPermission && permissions) {
    let hasPermission = false;

    if (Array.isArray(requiredPermission)) {
      // Handle array of permissions
      if (requireAll) {
        // User needs ALL permissions
        hasPermission = requiredPermission.every(perm => permissions[perm]);
      } else {
        // User needs ANY permission (default behavior)
        hasPermission = requiredPermission.some(perm => permissions[perm]);
      }
    } else {
      // Handle single permission (existing behavior)
      hasPermission = permissions[requiredPermission];
    }
    
    if (!hasPermission) {
      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            p: 3,
            backgroundColor: 'background.default',
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              textAlign: 'center',
              maxWidth: 500,
              width: '100%',
            }}
          >
            <LockOutlined 
              sx={{ 
                fontSize: 64, 
                color: 'warning.main', 
                mb: 2 
              }} 
            />
            
            <Typography variant="h5" gutterBottom>
              Access Restricted
            </Typography>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              You don't have permission to access this page. 
              {Array.isArray(requiredPermission) 
                ? ' You need the appropriate permissions to view this content.'
                : (
                  <>
                    {requiredPermission === 'canCreateDeliveries' && 
                      ' This section is only available for senders.'}
                    {requiredPermission === 'canCreateTrips' && 
                      ' This section is only available for drivers.'}
                    {requiredPermission === 'canBid' && 
                      ' This section is only available for drivers.'}
                  </>
                )
              }
            </Typography>

            <Button
              variant="contained"
              onClick={() => window.history.back()}
              sx={{ minWidth: 120 }}
            >
              Go Back
            </Button>
          </Paper>
        </Box>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;