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
  LocalShipping,
  AttachMoney,
  Star,
  TrendingUp,
  Visibility,
  AccessTime,
  CheckCircle,
  Schedule,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useGetSenderDashboardQuery } from '../../store/api';
import { format } from 'date-fns';
import LoadingScreen from '../../components/common/LoadingScreen';

const SenderDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data: dashboard, isLoading, error } = useGetSenderDashboardQuery();

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

  const { stats, recentDeliveries } = dashboard;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'assigned': return 'info';
      case 'in_transit': return 'primary';
      case 'delivered': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Schedule />;
      case 'assigned': return <AccessTime />;
      case 'in_transit': return <LocalShipping />;
      case 'delivered': return <CheckCircle />;
      default: return <Schedule />;
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Sender Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your deliveries and track shipments
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/deliveries/create')}
          size="large"
        >
          Create Delivery
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <LocalShipping sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h4" fontWeight="bold">
                    {stats.totalDeliveries}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Deliveries
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Schedule sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                  <Typography variant="h4" fontWeight="bold">
                    {stats.pendingDeliveries}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <CheckCircle sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                  <Typography variant="h4" fontWeight="bold">
                    {stats.completedDeliveries}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <AttachMoney sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                  <Typography variant="h4" fontWeight="bold">
                    ${stats.totalSpent.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Spent
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
                    Your Rating
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Sender reputation
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

        {/* Recent Deliveries */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  Recent Deliveries
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/deliveries')}
                  startIcon={<Visibility />}
                >
                  View All
                </Button>
              </Box>

              {recentDeliveries.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
                  <LocalShipping sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No deliveries yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Create your first delivery to get started
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => navigate('/deliveries/create')}
                  >
                    Create Delivery
                  </Button>
                </Paper>
              ) : (
                <List>
                  {recentDeliveries.slice(0, 5).map((delivery, index) => (
                    <ListItem
                      key={delivery.id}
                      divider={index < recentDeliveries.length - 1}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'grey.50' },
                      }}
                      onClick={() => navigate(`/deliveries/${delivery.id}`)}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: getStatusColor(delivery.status) + '.main' }}>
                          {getStatusIcon(delivery.status)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1" fontWeight="medium">
                              {delivery.description}
                            </Typography>
                            <Chip
                              label={delivery.status.replace('_', ' ')}
                              size="small"
                              color={getStatusColor(delivery.status) as any}
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {delivery.pickupSuburb} → {delivery.dropoffSuburb}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Created {delivery.createdAt? format(new Date(delivery.createdAt), 'MMM dd, yyyy')
  : 'N/A'}
 • 
                              Budget: ${delivery.budget}
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
                    onClick={() => navigate('/deliveries/create')}
                    sx={{ mb: 1 }}
                  >
                    Create New Delivery
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<LocalShipping />}
                    onClick={() => navigate('/deliveries')}
                    sx={{ mb: 1 }}
                  >
                    View All Deliveries
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Insights */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Performance Insights
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Completion Rate</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {stats.totalDeliveries > 0 
                      ? Math.round((stats.completedDeliveries / stats.totalDeliveries) * 100)
                      : 0}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={stats.totalDeliveries > 0 
                    ? (stats.completedDeliveries / stats.totalDeliveries) * 100
                    : 0}
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Average Rating</Typography>
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

              <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUp sx={{ fontSize: 16, mr: 0.5 }} />
                Keep creating deliveries to improve your stats
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SenderDashboard;