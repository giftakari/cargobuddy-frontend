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
  LinearProgress,
} from '@mui/material';
import {
  Add,
  Search,
  FilterList,
  Visibility,
  DirectionsCar,
  Schedule,
  CheckCircle,
  Cancel,
  LocationOn,
  AccessTime,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useGetTripsQuery } from '../../store/api';
import { format } from 'date-fns';
import type { Trip } from '../../types';

const TripList: React.FC = () => {
  const navigate = useNavigate();
  const { data: trips, isLoading, error } = useGetTripsQuery();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>('all');

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const vehicleTypeOptions = [
    { value: 'all', label: 'All Vehicles' },
    { value: 'car', label: 'Car' },
    { value: 'van', label: 'Van' },
    { value: 'truck', label: 'Truck' },
    { value: 'motorcycle', label: 'Motorcycle' },
  ];

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
      case 'cancelled': return <Cancel />;
      default: return <Schedule />;
    }
  };

  const getVehicleTypeColor = (vehicleType: string) => {
    switch (vehicleType) {
      case 'car': return 'primary';
      case 'van': return 'secondary';
      case 'truck': return 'warning';
      case 'motorcycle': return 'info';
      default: return 'default';
    }
  };

  const getAvailableSpaceColor = (space: string) => {
    switch (space) {
      case 'small': return 'success';
      case 'medium': return 'warning';
      case 'large': return 'error';
      default: return 'default';
    }
  };

  // Filter trips
  const filteredTrips = trips?.filter((trip) => {
    const matchesSearch = trip.fromSuburb.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trip.toSuburb.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || trip.status === statusFilter;
    const matchesVehicle = vehicleTypeFilter === 'all' || trip.vehicleType === vehicleTypeFilter;
    
    return matchesSearch && matchesStatus && matchesVehicle;
  }) || [];

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="error" gutterBottom>
          Failed to load trips
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
            My Trips
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your scheduled trips and deliveries
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

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search trips..."
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
              label="Vehicle Type"
              value={vehicleTypeFilter}
              onChange={(e) => setVehicleTypeFilter(e.target.value)}
            >
              {vehicleTypeOptions.map((option) => (
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
                {filteredTrips.length} results
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
      {!isLoading && filteredTrips.length === 0 && (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <DirectionsCar sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {trips?.length === 0 ? 'No trips yet' : 'No trips match your filters'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {trips?.length === 0 
              ? 'Create your first trip to start earning'
              : 'Try adjusting your search criteria'
            }
          </Typography>
          {trips?.length === 0 && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/trips/create')}
            >
              Create Your First Trip
            </Button>
          )}
        </Paper>
      )}

      {/* Trip Cards */}
      {!isLoading && filteredTrips.length > 0 && (
        <Grid container spacing={3}>
          {filteredTrips.map((trip) => (
            <Grid item xs={12} md={6} lg={4} key={trip.id}>
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
                onClick={() => navigate(`/trips/${trip.id}`)}
              >
                <CardContent>
                  {/* Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flexGrow: 1, mr: 1 }}>
                      <Typography variant="h6" fontWeight="bold">
                        {trip.fromSuburb} → {trip.toSuburb}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {format(new Date(trip.departureDateTime), 'MMM dd, yyyy HH:mm')}
                      </Typography>
                    </Box>
                    <IconButton size="small" onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/trips/${trip.id}`);
                    }}>
                      <Visibility />
                    </IconButton>
                  </Box>

                  {/* Route */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main', mr: 1 }}>
                      <LocationOn sx={{ fontSize: 14 }} />
                    </Avatar>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {trip.fromAddress} → {trip.toAddress}
                    </Typography>
                  </Box>

                  {/* Status and Vehicle Info */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    <Chip
                      icon={getStatusIcon(trip.status)}
                      label={trip.status}
                      color={getStatusColor(trip.status) as any}
                      size="small"
                    />
                    <Chip
                      label={trip.vehicleType}
                      color={getVehicleTypeColor(trip.vehicleType) as any}
                      variant="outlined"
                      size="small"
                    />
                    <Chip
                      label={`${trip.availableSpace} space`}
                      color={getAvailableSpaceColor(trip.availableSpace) as any}
                      variant="outlined"
                      size="small"
                    />
                  </Box>

                  {/* Delivery Capacity */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Delivery Capacity
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {trip.currentDeliveries}/{trip.maxDeliveries}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(trip.currentDeliveries / trip.maxDeliveries) * 100}
                      sx={{ height: 6, borderRadius: 3 }}
                      color={trip.currentDeliveries === trip.maxDeliveries ? 'error' : 'primary'}
                    />
                  </Box>

                  {/* Departure Info */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AccessTime sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
                      <Typography variant="caption" color="text.secondary">
                        Departs {format(new Date(trip.departureDateTime), 'HH:mm')}
                      </Typography>
                    </Box>
                    {trip.status === 'active' && (
                      <Chip
                        label={trip.currentDeliveries === 0 ? 'Available' : 'In Progress'}
                        color={trip.currentDeliveries === 0 ? 'success' : 'warning'}
                        size="small"
                      />
                    )}
                  </Box>

                  {/* Space Availability Indicator */}
                  {trip.status === 'active' && trip.currentDeliveries < trip.maxDeliveries && (
                    <Box sx={{ mt: 1, p: 1, bgcolor: 'success.50', borderRadius: 1 }}>
                      <Typography variant="caption" color="success.dark">
                        Space available for {trip.maxDeliveries - trip.currentDeliveries} more delivery{trip.maxDeliveries - trip.currentDeliveries > 1 ? 'ies' : 'y'}
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
        aria-label="create trip"
        onClick={() => navigate('/trips/create')}
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

export default TripList;