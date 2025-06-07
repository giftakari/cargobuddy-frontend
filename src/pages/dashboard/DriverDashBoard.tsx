import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  LinearProgress,
  Paper,
  IconButton,
} from '@mui/material';
import {
  Add,
  DirectionsCar,
  AttachMoney,
  Star,
  TrendingUp,
  Visibility,
  AccessTime,
  CheckCircle,
  Schedule,
  Search,
  LocalShipping,
  Gavel,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useGetDriverDashboardQuery } from '../../store/api';
import { format } from 'date-fns';
import LoadingScreen from '../../components/common/LoadingScreen';

const DriverDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data: dashboard, isLoading, error } = useGetDriverDashboardQuery();

  if (isLoading) {
    return <LoadingScreen message="Loading dashboard..." />;
  }

  if (error || !dashboard) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="error">
          Failed to load dashboard
        </Typography>
        <Button variant="contained" onClick={() => window.location.reload()} sx={{ mt: 2 }}>
          Retry
        </Button>
      </Box>
    );
  }

  const { stats, recentTrips } = dashboard;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'completed': return 'primary';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <DirectionsCar />;
      case 'completed': return <CheckCircle />;
      case 'cancelled': return <Schedule />;
      default: return <Schedule />;
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Driver Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your trips and earn money
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Search />}
            onClick={() => navigate('/browse-jobs')}
          >
            Browse Jobs
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/trips/create')}
            size="large"
          >
            Create Trip
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Stats Cards Row 1 */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <DirectionsCar sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h4" fontWeight="bold">
                    {stats.totalTrips}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Trips
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Schedule sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                  <Typography variant="h4" fontWeight="bold">
                    {stats.activeTrips}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Trips
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <LocalShipping sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                  <Typography variant="h4" fontWeight="bold">
                    {stats.totalDeliveries}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Deliveries
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <AttachMoney sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                  <Typography variant="h4" fontWeight="bold">
                    ${stats.totalEarned.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Earned
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Rating Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <Star />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    Driver Rating
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Your reputation
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h3" fontWeight="bold" sx={{ mr: 1 }}>
                  {stats.averageRating.toFixed(1)}
                </Typography>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        sx={{
                          fontSize: 20,
                          color: star <= stats.averageRating ? 'warning.main' : 'grey.300',
                        }}
                      />
                    ))}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {stats.totalRatings} reviews
                  </Typography>
                </Box>
              </Box>

              <LinearProgress
                variant="determinate"
                value={(stats.averageRating / 5) * 100}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Bidding Stats */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Bidding Performance
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight="bold" color="primary.main">
                      {stats.totalBids}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Bids
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight="bold" color="success.main">
                      {stats.acceptedBids}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Accepted
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight="bold" color="info.main">
                      {stats.bidSuccessRate}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Success Rate
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Success Rate</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {stats.bidSuccessRate}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={stats.bidSuccessRate}
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Quick Actions
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => navigate('/trips/create')}
                    sx={{ mb: 1 }}
                  >
                    Create New Trip
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Search />}
                    onClick={() => navigate('/browse-jobs')}
                    sx={{ mb: 1 }}
                  >
                    Browse Available Jobs
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<DirectionsCar />}
                    onClick={() => navigate('/trips')}
                  >
                    View My Trips
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Trips */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  Recent Trips
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/trips')}
                  startIcon={<Visibility />}
                >
                  View All
                </Button>
              </Box>

              {recentTrips.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
                  <DirectionsCar sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No trips yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Create your first trip to start earning
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => navigate('/trips/create')}
                  >
                    Create Trip
                  </Button>
                </Paper>
              ) : (
                <List>
                  {recentTrips.slice(0, 5).map((trip, index) => (
                    <ListItem
                      key={trip.id}
                      divider={index < recentTrips.length - 1}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'grey.50' },
                      }}
                      onClick={() => navigate(`/trips/${trip.id}`)}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: getStatusColor(trip.status) + '.main' }}>
                          {getStatusIcon(trip.status)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1" fontWeight="medium">
                              {trip.fromSuburb} → {trip.toSuburb}
                            </Typography>
                            <Chip
                              label={trip.status}
                              size="small"
                              color={getStatusColor(trip.status) as any}
                              variant="outlined"
                            />
                            <Chip
                              label={trip.vehicleType}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Departure: {format(new Date(trip.departureDateTime), 'MMM dd, yyyy HH:mm')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Space: {trip.availableSpace} • 
                              Deliveries: {trip.currentDeliveries}/{trip.maxDeliveries}
                            </Typography>
                          </Box>
                        }
                      />
                      <IconButton size="small">
                        <Visibility />
                      </IconButton>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Insights */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Performance Insights
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Trip Completion</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {stats.totalTrips > 0 
                          ? Math.round(((stats.totalTrips - stats.activeTrips) / stats.totalTrips) * 100)
                          : 0}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={stats.totalTrips > 0 
                        ? ((stats.totalTrips - stats.activeTrips) / stats.totalTrips) * 100
                        : 0}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Bid Success Rate</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {stats.bidSuccessRate}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={stats.bidSuccessRate}
                      color="secondary"
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Driver Rating</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {stats.averageRating.toFixed(1)}/5.0
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(stats.averageRating / 5) * 100}
                      color="warning"
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>
                </Grid>
              </Grid>

              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingUp sx={{ fontSize: 16, mr: 0.5 }} />
                  Complete more deliveries and maintain high ratings to increase your earnings
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DriverDashboard;