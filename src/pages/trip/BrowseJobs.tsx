import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  TextField,
  MenuItem,
  InputAdornment,
  Paper,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import {
  Search,
  FilterList,
  LocalShipping,
  LocationOn,
  AttachMoney,
  Schedule,
  Person,
  Gavel,
  Star,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useGetDeliveriesQuery, useCreateBidMutation } from '../../store/api';
import { format } from 'date-fns';
import type { BidForm, Delivery } from '../../types';

const bidSchema = yup.object({
  amount: yup
    .number()
    .min(1, 'Bid amount must be at least $1')
    .required('Bid amount is required'),
  message: yup
    .string()
    .max(200, 'Message must be less than 200 characters'),
  estimatedPickupTime: yup.string(),
  estimatedDeliveryTime: yup.string(),
});

const BrowseJobs: React.FC = () => {
  const { data: deliveries, isLoading, error } = useGetDeliveriesQuery();
  const [createBid, { isLoading: isBidding }] = useCreateBidMutation();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [suburbFilter, setSuburbFilter] = useState('');
  const [itemSizeFilter, setItemSizeFilter] = useState<string>('all');
  const [minBudget, setMinBudget] = useState<number | ''>('');
  const [maxBudget, setMaxBudget] = useState<number | ''>('');
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [showBidDialog, setShowBidDialog] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BidForm>({
    resolver: yupResolver(bidSchema),
    defaultValues: {
      amount: 0,
      message: '',
      estimatedPickupTime: '',
      estimatedDeliveryTime: '',
    },
  });

  const itemSizeOptions = [
    { value: 'all', label: 'All Sizes' },
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
  ];

  // Filter deliveries (only show pending ones)
  const availableDeliveries = deliveries?.filter((delivery) => {
    if (delivery.status !== 'pending') return false;
    
    const matchesSearch = delivery.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         delivery.pickupSuburb.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         delivery.dropoffSuburb.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSuburb = !suburbFilter || 
                         delivery.pickupSuburb.toLowerCase().includes(suburbFilter.toLowerCase()) ||
                         delivery.dropoffSuburb.toLowerCase().includes(suburbFilter.toLowerCase());
    
    const matchesSize = itemSizeFilter === 'all' || delivery.itemSize === itemSizeFilter;
    
    const matchesBudget = (!minBudget || delivery.budget >= minBudget) &&
                         (!maxBudget || delivery.budget <= maxBudget);
    
    return matchesSearch && matchesSuburb && matchesSize && matchesBudget;
  }) || [];

  const handleBidSubmit = async (bidData: BidForm) => {
    if (!selectedDelivery) return;

    try {
      await createBid({
        ...bidData,
        deliveryId: selectedDelivery.id,
      }).unwrap();
      
      setShowBidDialog(false);
      setSelectedDelivery(null);
      reset();
    } catch (error) {
      console.error('Failed to submit bid:', error);
    }
  };

  const openBidDialog = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    reset({
      amount: Math.round(delivery.budget * 0.8), // Start with 80% of budget
      message: '',
      estimatedPickupTime: '',
      estimatedDeliveryTime: '',
    });
    setShowBidDialog(true);
  };

  const getItemSizeColor = (size: string) => {
    switch (size) {
      case 'small': return 'success';
      case 'medium': return 'warning';
      case 'large': return 'error';
      default: return 'default';
    }
  };

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="error" gutterBottom>
          Failed to load available jobs
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
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Browse Available Jobs
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Find deliveries to bid on and earn money
        </Typography>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              placeholder="Search jobs..."
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
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              placeholder="Suburb..."
              value={suburbFilter}
              onChange={(e) => setSuburbFilter(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationOn />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
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
          <Grid item xs={6} md={2}>
            <TextField
              fullWidth
              label="Min Budget"
              type="number"
              value={minBudget}
              onChange={(e) => setMinBudget(e.target.value ? Number(e.target.value) : '')}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              fullWidth
              label="Max Budget"
              type="number"
              value={maxBudget}
              onChange={(e) => setMaxBudget(e.target.value ? Number(e.target.value) : '')}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
          </Grid>
          <Grid item xs={12} md={1}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterList />
              <Typography variant="body2">
                {availableDeliveries.length}
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
      {!isLoading && availableDeliveries.length === 0 && (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <LocalShipping sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No available jobs
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {deliveries?.length === 0 
              ? 'No delivery requests are currently available'
              : 'No jobs match your current filters'
            }
          </Typography>
        </Paper>
      )}

      {/* Job Cards */}
      {!isLoading && availableDeliveries.length > 0 && (
        <Grid container spacing={3}>
          {availableDeliveries.map((delivery) => (
            <Grid item xs={12} md={6} lg={4} key={delivery.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 4,
                  },
                }}
              >
                <CardContent>
                  {/* Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flexGrow: 1, mr: 1 }}>
                      <Typography variant="h6" fontWeight="bold" noWrap>
                        {delivery.description}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Posted {format(new Date(delivery.createdAt), 'MMM dd, yyyy')}
                      </Typography>
                    </Box>
                    <Typography variant="h6" fontWeight="bold" color="success.main">
                      ${delivery.budget}
                    </Typography>
                  </Box>

                  {/* Sender Info */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', mr: 1 }}>
                      <Person sx={{ fontSize: 16 }} />
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" fontWeight="medium">
                        {delivery.sender.firstName} {delivery.sender.lastName}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Star sx={{ fontSize: 14, color: 'warning.main', mr: 0.5 }} />
                        <Typography variant="caption" color="text.secondary">
                          {delivery.sender.senderRating.toFixed(1)} ({delivery.sender.totalSenderRatings})
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Route */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <LocationOn sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
                    <Typography variant="body2" color="text.secondary">
                      {delivery.pickupSuburb} → {delivery.dropoffSuburb}
                    </Typography>
                  </Box>

                  {/* Details */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    <Chip
                      label={delivery.itemSize}
                      color={getItemSizeColor(delivery.itemSize) as any}
                      size="small"
                    />
                    {delivery.preferredDeliveryDate && (
                      <Chip
                        icon={<Schedule />}
                        label={format(new Date(delivery.preferredDeliveryDate), 'MMM dd')}
                        variant="outlined"
                        size="small"
                      />
                    )}
                  </Box>

                  {/* Description */}
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      mb: 2,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {delivery.description}
                  </Typography>

                  {/* Bid Button */}
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Gavel />}
                    onClick={() => openBidDialog(delivery)}
                  >
                    Place Bid
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Bid Dialog */}
      <Dialog open={showBidDialog} onClose={() => setShowBidDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Place Your Bid
          {selectedDelivery && (
            <Typography variant="body2" color="text.secondary">
              {selectedDelivery.description}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {selectedDelivery && (
            <Box sx={{ pt: 1 }}>
              {/* Delivery Summary */}
              <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Route
                    </Typography>
                    <Typography variant="body1">
                      {selectedDelivery.pickupSuburb} → {selectedDelivery.dropoffSuburb}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Budget
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      ${selectedDelivery.budget}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Item Size
                    </Typography>
                    <Typography variant="body1">
                      {selectedDelivery.itemSize}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              <Box component="form" onSubmit={handleSubmit(handleBidSubmit)}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Controller
                      name="amount"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Your Bid Amount"
                          type="number"
                          error={Boolean(errors.amount)}
                          helperText={errors.amount?.message}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <AttachMoney />
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Controller
                      name="message"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Message to Sender (Optional)"
                          multiline
                          rows={3}
                          placeholder="Explain why you're the best choice for this delivery..."
                          error={Boolean(errors.message)}
                          helperText={errors.message?.message || `${field.value?.length || 0}/200 characters`}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="estimatedPickupTime"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Estimated Pickup Time (Optional)"
                          placeholder="e.g., 2:00 PM"
                          helperText="When can you pick up the item?"
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="estimatedDeliveryTime"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Estimated Delivery Time (Optional)"
                          placeholder="e.g., 4:00 PM"
                          helperText="When will you deliver it?"
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Bidding Tips */}
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2" fontWeight="medium" gutterBottom>
                  Bidding Tips:
                </Typography>
                <Typography variant="body2" component="ul" sx={{ m: 0, pl: 2 }}>
                  <li>Competitive bids have a higher chance of being accepted</li>
                  <li>Include a personal message explaining your experience</li>
                  <li>Provide realistic pickup and delivery times</li>
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBidDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit(handleBidSubmit)}
            variant="contained"
            disabled={isBidding}
            startIcon={isBidding ? <CircularProgress size={20} /> : <Gavel />}
          >
            {isBidding ? 'Submitting...' : 'Submit Bid'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BrowseJobs;