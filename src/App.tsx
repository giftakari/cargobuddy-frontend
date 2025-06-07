import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Provider } from 'react-redux';
import { store } from './store';
import { useAppSelector, useAppDispatch } from './hooks/redux';
import { useCheckAuthQuery } from './store/api';
import { selectIsAuthenticated, selectUser, selectAuthLoading } from './store/slices/authSlice';
import { selectTheme } from './store/slices/uiSlice';
import { socketService } from './services/socketServices';

// Layout Components
import Layout from './components/layout/Layout';
import LoadingScreen from './components/common/LoadingScreen';
import ErrorBoundary from './components/common/ErrorBoundary';

// Auth Components
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Dashboard Components
import SenderDashboard from './pages/dashboard/SenderDashboard';
import DriverDashboard from './pages/dashboard/DriverDashBoard';

// Delivery Components
import DeliveryList from './pages/delivery/DeliveryList';
import CreateDelivery from './pages/delivery/CreateDelivery';
import DeliveryDetail from './pages/delivery/DeliveryDetails';

// Trip Components
import TripList from './pages/trip/TripList';
import CreateTrip from './pages/trip/CreateTrip';
import TripDetail from './pages/trip/TripDetails';
import BrowseJobs from './pages/trip/BrowseJobs';

// Profile Components
import Profile from './pages/profile/Profile';

// Chat Components
import Chat from './pages/chat/Chat';

const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);
  const authLoading = useAppSelector(selectAuthLoading);
  const theme = useAppSelector(selectTheme);

  // Check authentication status on app load
  const { isLoading: authCheckLoading } = useCheckAuthQuery();

  // Create MUI theme
  const muiTheme = createTheme({
    palette: {
      mode: theme,
      primary: {
        main: '#2196f3',
        light: '#64b5f6',
        dark: '#1976d2',
      },
      secondary: {
        main: '#ff9800',
        light: '#ffb74d',
        dark: '#f57c00',
      },
      background: {
        default: theme === 'light' ? '#f5f5f5' : '#121212',
        paper: theme === 'light' ? '#ffffff' : '#1e1e1e',
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h4: {
        fontWeight: 600,
      },
      h5: {
        fontWeight: 600,
      },
      h6: {
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          },
        },
      },
    },
  });

  // Initialize socket connection when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      socketService.connect();
      
      // Request notification permission
     // socketService.requestNotificationPermission();
    } else {
      socketService.disconnect();
    }

    return () => {
      socketService.disconnect();
    };
  }, [isAuthenticated, user]);

  // Show loading screen while checking authentication
  if (authCheckLoading || authLoading) {
    return <LoadingScreen />;
  }

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Router>
          <ErrorBoundary>
            <Routes>
              {/* Public Routes */}
              <Route
                path="/login"
                element={
                  isAuthenticated ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <LoginPage />
                  )
                }
              />
              <Route
                path="/register"
                element={
                  isAuthenticated ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <RegisterPage />
                  )
                }
              />

              {/* Protected Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                {/* Dashboard Routes */}
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route
                  path="dashboard"
                  element={
                    user?.userType === 'driver' ? (
                      <DriverDashboard />
                    ) : user?.userType === 'both' ? (
                      // TODO: Create combined dashboard for 'both' users
                      <SenderDashboard />
                    ) : (
                      <SenderDashboard />
                    )
                  }
                />

                {/* Delivery Routes (for senders) */}
                <Route
                  path="deliveries"
                  element={
                    <ProtectedRoute requiredPermission="canCreateDeliveries">
                      <DeliveryList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="deliveries/create"
                  element={
                    <ProtectedRoute requiredPermission="canCreateDeliveries">
                      <CreateDelivery />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="deliveries/:id"
                  element={
                    <ProtectedRoute requiredPermission={["canCreateDeliveries", "canBid"]}>
                      <DeliveryDetail />
                    </ProtectedRoute>
                  }
                />

                {/* Trip Routes (for drivers) */}
                <Route
                  path="trips"
                  element={
                    <ProtectedRoute requiredPermission="canCreateTrips">
                      <TripList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="trips/create"
                  element={
                    <ProtectedRoute requiredPermission="canCreateTrips">
                      <CreateTrip />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="trips/:id"
                  element={
                    <ProtectedRoute requiredPermission="canCreateTrips">
                      <TripDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="browse-jobs"
                  element={
                    <ProtectedRoute requiredPermission="canBid">
                      <BrowseJobs />
                    </ProtectedRoute>
                  }
                />

                {/* Chat Routes */}
                <Route
                  path="chat/:deliveryId"
                  element={
                    <ProtectedRoute>
                      <Chat />
                    </ProtectedRoute>
                  }
                />

                {/* Profile Routes */}
                <Route
                  path="profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />

                {/* Catch all - redirect to dashboard */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>

              {/* Fallback for unauthenticated users */}
              <Route
                path="*"
                element={<Navigate to="/login" replace />}
              />
            </Routes>
          </ErrorBoundary>
        </Router>
      </LocalizationProvider>
    </ThemeProvider>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
};

export default App;