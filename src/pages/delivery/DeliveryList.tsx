import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  InputAdornment,
  Paper,
  Avatar,
  Skeleton,
  Fab,
} from '@mui/material';
import {
  Add,
  Search,
  FilterList,
  Visibility,
  LocationOn,
  Schedule,
  AttachMoney,
  LocalShipping,
  CheckCircle,
  AccessTime,
  Cancel,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useGetDeliveriesQuery } from '../../store/api';
import { format } from 'date-fns';
import type { Delivery } from '../../types';

const DeliveryList: React.FC = () => {
  const navigate = useNavigate();
  const { data: deliveries, isLoading, error } = useGetDeliveriesQuery();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [itemSizeFilter, setItemSizeFilter] = useState<string>('all');

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'in_transit', label: 'In Transit' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const itemSizeOptions = [
    { value: 'all', label: 'All Sizes' },
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
  ];

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
      case 'cancelled': return <Cancel />;
      default: return <Schedule />;
    }
  };

  const getItemSizeColor = (size: string) => {
    switch (size) {
      case 'small': return 'success';
      case 'medium': return 'warning';
      case 'large': return 'error';
      default: return 'default';
    }
  };

  // Filter deliveries
  const filteredDeliveries = deliveries?.filter((delivery) => {
    const matchesSearch = delivery.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         delivery.pickupSuburb.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         delivery.dropoffSuburb.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || delivery.status === statusFilter;
    const matchesSize = itemSizeFilter === 'all' || delivery.itemSize === itemSizeFilter;
    
    return matchesSearch && matchesStatus && matchesSize;
  }) || [];

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="error" gutterBottom>
          Failed to load deliveries
        </Typography>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            My Deliveries
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage and track your delivery requests
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

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search deliveries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {statusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              label="Item Size"
              value={itemSizeFilter}
              onChange={(e) => setItemSizeFilter(e.target.value)}
            >
              {itemSizeOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterList />
              <Typography variant="body2">
                {filteredDeliveries.length} results
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Loading State */}
      {isLoading && (
        <Grid container spacing={3}>
          {[...Array(6)].map((_, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" width="60%" height={24} />
                  <Skeleton variant="text" width="100%" height={20} sx={{ mt: 1 }} />
                  <Skeleton variant="text" width="80%" height={20} />
                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Skeleton variant="rounded" width={60} height={24} />
                    <Skeleton variant="rounded" width={80} height={24} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Empty State */}
      {!isLoading && filteredDeliveries.length === 0 && (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <LocalShipping sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {deliveries?.length === 0 ? 'No deliveries yet' : 'No deliveries match your filters'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {deliveries?.length === 0 
              ? 'Create your first delivery to get started'
              : 'Try adjusting your search criteria'
            }
          </Typography>
          {deliveries?.length === 0 && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/deliveries/create')}
            >
              Create Your First Delivery
            </Button>
          )}
        </Paper>
      )}

      {/* Delivery Cards */}
      {!isLoading && filteredDeliveries.length > 0 && (
        <Grid container spacing={3}>
          {filteredDeliveries.map((delivery) => (
            <Grid item xs={12} md={6} lg={4} key={delivery.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 4,
                  },
                }}
                onClick={() => navigate(`/deliveries/${delivery.id}`)}
              >
                <CardContent>
                  {/* Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flexGrow: 1, mr: 1 }}>
                      <Typography variant="h6" fontWeight="bold" noWrap>
                        {delivery.description}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Created {format(new Date(delivery.createdAt), 'MMM dd, yyyy')}
                      </Typography>
                    </Box>
                    <IconButton size="small" onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/deliveries/${delivery.id}`);
                    }}>
                      <Visibility />
                    </IconButton>
                  </Box>

                  {/* Route */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main', mr: 1 }}>
                      <LocationOn sx={{ fontSize: 14 }} />
                    </Avatar>
                    <Typography variant="body2" color="text.secondary">
                      {delivery.pickupSuburb} → {delivery.dropoffSuburb}
                    </Typography>
                  </Box>

                  {/* Status and Details */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    <Chip
                      icon={getStatusIcon(delivery.status)}
                      label={delivery.status.replace('_', ' ')}
                      color={getStatusColor(delivery.status) as any}
                      size="small"
                    />
                    <Chip
                      label={delivery.itemSize}
                      color={getItemSizeColor(delivery.itemSize) as any}
                      variant="outlined"
                      size="small"
                    />
                    {delivery.assignedDriver && (
                      <Chip
                        label={`Driver: ${delivery.assignedDriver.firstName}`}
                        variant="outlined"
                        size="small"
                      />
                    )}
                  </Box>

                  {/* Budget and Payment */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AttachMoney sx={{ fontSize: 20, color: 'success.main', mr: 0.5 }} />
                      <Typography variant="body1" fontWeight="bold">
                        ${delivery.budget}
                      </Typography>
                      {delivery.finalPrice && delivery.finalPrice !== delivery.budget && (
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                          (Final: ${delivery.finalPrice})
                        </Typography>
                      )}
                    </Box>
                    <Chip
                      label={delivery.paymentStatus}
                      color={delivery.paymentStatus === 'paid' ? 'success' : 'default'}
                      variant="outlined"
                      size="small"
                    />
                  </Box>

                  {/* Preferred Date */}
                  {delivery.preferredDeliveryDate && (
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                      <Schedule sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
                      <Typography variant="caption" color="text.secondary">
                        Preferred: {format(new Date(delivery.preferredDeliveryDate), 'MMM dd, yyyy')}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Floating Action Button for Mobile */}
      <Fab
        color="primary"
        aria-label="create delivery"
        onClick={() => navigate('/deliveries/create')}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', md: 'none' },
        }}
      >
        <Add />
      </Fab>
    </Box>
  );
};

export default DeliveryList;