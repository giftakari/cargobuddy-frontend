import React, { useState } from 'react';
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
  Paper,
  Divider,
  Alert,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack,
  LocationOn,
  Schedule,
  DirectionsCar,
  LocalShipping,
  Person,
  Edit,
  Cancel,
  CheckCircle,
  Visibility,
  Add,
  Search,
  Gavel,
  AttachMoney,
} from '@mui/icons-material';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  useGetTripQuery, 
  useGetTripMatchingQuery,
  useUpdateTripMutation,
  useCreateBidMutation,
  useGetBidsQuery,
} from '../../store/api';
import { useAppSelector } from '../../hooks/redux';
import { selectUser } from '../../store/slices/authSlice';
import { format } from 'date-fns';
import LoadingScreen from '../../components/common/LoadingScreen';

const TripDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppSelector(selectUser);
  const tripId = parseInt(id!);

  const { data: trip, isLoading, error } = useGetTripQuery(tripId);
  const { data: matchingData } = useGetTripMatchingQuery(tripId);
  const { data: myBids } = useGetBidsQuery({ bidder: user?.id });
  const [updateTrip] = useUpdateTripMutation();
  const [createBid] = useCreateBidMutation();

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const [showBidDialog, setShowBidDialog] = useState(false);
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [bidMessage, setBidMessage] = useState<string>('');
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);

  // Show success message if redirected from creation
  const successMessage = location.state?.message;


  // Helper function to get delivery bid status for the current user
const getDeliveryBidStatus = (deliveryId: number) => {
    const bid = myBids?.find(b => b.delivery === deliveryId);
    return bid || null;
  };

  // Helper function to get button state for a delivery
  const getDeliveryButtonState = (delivery: any) => {
    const bid = getDeliveryBidStatus(delivery.id);
    
    if (bid) {
      switch (bid.status) {
        case 'pending':
          return {
            text: 'Bid Pending',
            disabled: true,
            color: 'warning' as const,
            variant: 'outlined' as const
          };
        case 'accepted':
          return {
            text: 'Bid Accepted',
            disabled: true,
            color: 'success' as const,
            variant: 'contained' as const
          };
        case 'rejected':
          return {
            text: 'Bid Rejected',
            disabled: true,
            color: 'error' as const,
            variant: 'outlined' as const
          };
        default:
          return {
            text: 'Bid Now',
            disabled: false,
            color: 'primary' as const,
            variant: 'contained' as const
          };
      }
    }
    
    return {
      text: 'Bid Now',
      disabled: isSubmittingBid,
      color: 'primary' as const,
      variant: 'contained' as const
    };
  };

  if (isLoading) {
    return <LoadingScreen message="Loading trip details..." />;
  }

  if (error || !trip) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="error" gutterBottom>
          Failed to load trip details
        </Typography>
        <Button variant="contained" onClick={() => navigate('/trips')}>
          Back to Trips
        </Button>
      </Box>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'completed': return 'primary';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getVehicleTypeIcon = (vehicleType: string) => {
    return <DirectionsCar />;
  };

  const canEdit = trip.status === 'active' && trip.currentDeliveries === 0;
  const canCancel = trip.status === 'active';
  const matchingDeliveries = matchingData?.matchingDeliveries || [];

  const handleCancelTrip = async () => {
    try {
      await updateTrip({ 
        id: trip.id, 
        data: { status: 'cancelled' } 
      }).unwrap();
      setShowCancelDialog(false);
      navigate('/trips');
    } catch (error) {
      console.error('Failed to cancel trip:', error);
    }
  };

  const handleBidOnDelivery = (delivery: any) => {
    setSelectedDelivery(delivery);
    setBidAmount(Math.round(delivery.budget * 0.8)); // Start with 80% of budget
    setBidMessage('');
    setShowBidDialog(true);
  };

  const handleSubmitBid = async () => {
    if (!selectedDelivery || !bidAmount) return;

    try {
      setIsSubmittingBid(true);
      await createBid({
        deliveryId: selectedDelivery.id,
        amount: bidAmount,
        message: bidMessage,
        tripId: trip.id,
      }).unwrap();
      
      setShowBidDialog(false);
      setSelectedDelivery(null);
      setBidAmount(0);
      setBidMessage('');
    } catch (error) {
      console.error('Failed to submit bid:', error);
    } finally {
      setIsSubmittingBid(false);
    }
  };

  const progressPercentage = (trip.currentDeliveries / trip.maxDeliveries) * 100;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/trips')}
          sx={{ mb: 2 }}
        >
          Back to Trips
        </Button>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {trip.fromSuburb} → {trip.toSuburb}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Chip
                label={trip.status}
                color={getStatusColor(trip.status) as any}
              />
              <Chip
                label={trip.vehicleType}
                icon={getVehicleTypeIcon(trip.vehicleType)}
                variant="outlined"
              />
              <Chip
                label={`${trip.availableSpace} space`}
                variant="outlined"
              />
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            {canEdit && (
              <Button
                variant="outlined"
                startIcon={<Edit />}
                onClick={() => navigate(`/trips/${trip.id}/edit`)}
              >
                Edit
              </Button>
            )}
            {canCancel && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<Cancel />}
                onClick={() => setShowCancelDialog(true)}
              >
                Cancel Trip
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      {/* Success Message */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} lg={8}>
          {/* Route Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Trip Route
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2, mt: 0.5 }}>
                      <LocationOn />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Departure
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {trip.fromAddress}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {trip.fromSuburb}, {trip.fromPostcode}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'secondary.main', mr: 2, mt: 0.5 }}>
                      <LocationOn />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Destination
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {trip.toAddress}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {trip.toSuburb}, {trip.toPostcode}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Trip Details */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Trip Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Departure Date & Time
                  </Typography>
                  <Typography variant="body1" fontWeight="medium" sx={{ mb: 2 }}>
                    {format(new Date(trip.departureDateTime), 'EEEE, MMMM dd, yyyy')}
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {format(new Date(trip.departureDateTime), 'HH:mm')}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Vehicle Information
                  </Typography>
                  <Typography variant="body1" fontWeight="medium" sx={{ mb: 1 }}>
                    {trip.vehicleType}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Available space: {trip.availableSpace}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Delivery Capacity */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Delivery Capacity
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body1">
                    Current Deliveries
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {trip.currentDeliveries} / {trip.maxDeliveries}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={progressPercentage}
                  sx={{ height: 8, borderRadius: 4 }}
                  color={progressPercentage === 100 ? 'error' : 'primary'}
                />
              </Box>
              
              {trip.currentDeliveries < trip.maxDeliveries ? (
                <Alert severity="success">
                  You can accept {trip.maxDeliveries - trip.currentDeliveries} more delivery{trip.maxDeliveries - trip.currentDeliveries > 1 ? 'ies' : 'y'} for this trip
                </Alert>
              ) : (
                <Alert severity="info">
                  This trip is at full capacity
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Matching Deliveries */}
          {trip.status === 'active' && matchingDeliveries.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Matching Deliveries ({matchingDeliveries.length})
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  These deliveries are along your route and you can bid on them
                </Typography>
                
                <List>
                  {matchingDeliveries.slice(0, 5).map((delivery, index) => (
                    <React.Fragment key={delivery.id}>
                      <ListItem
                        alignItems="flex-start"
                        sx={{
                          cursor: 'pointer',
                          borderRadius: 1,
                          '&:hover': { bgcolor: 'grey.50' },
                        }}
                        onClick={() => navigate(`/deliveries/${delivery.id}`)}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <LocalShipping />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="subtitle1" fontWeight="medium">
                                {delivery.description}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="h6" fontWeight="bold" color="success.main">
                                  ${delivery.budget}
                                </Typography>
                                <Chip
                                  label={`${delivery.matchScore}% match`}
                                  size="small"
                                  color="primary"
                                />
                              </Box>
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {delivery.pickupSuburb} → {delivery.dropoffSuburb}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Size: {delivery.itemSize} • 
                                Detour: ~{delivery.estimatedDetour} km
                              </Typography>
                            </Box>
                          }
                        />
                        <Button
                          size="small"
                          variant={getDeliveryButtonState(delivery).variant}
                          color={getDeliveryButtonState(delivery).color}
                          startIcon={<Gavel />}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!getDeliveryBidStatus(delivery.id)) {
                              handleBidOnDelivery(delivery);
                            }
                          }}
                          disabled={getDeliveryButtonState(delivery).disabled}
                        >
                          {getDeliveryButtonState(delivery).text}
                        </Button>
                      </ListItem>
                      {index < matchingDeliveries.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>

                {matchingDeliveries.length > 5 && (
                  <Box sx={{ textAlign: 'center', mt: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/browse-jobs')}
                    >
                      View All {matchingDeliveries.length} Matching Deliveries
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

          {/* No matching deliveries */}
          {trip.status === 'active' && matchingDeliveries.length === 0 && (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <LocalShipping sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No matching deliveries yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                We'll notify you when deliveries along your route become available
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Search />}
                onClick={() => navigate('/browse-jobs')}
              >
                Browse All Jobs
              </Button>
            </Paper>
          )}
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} lg={4}>
          {/* Trip Status Timeline */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Trip Status
              </Typography>
              <Box sx={{ pl: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CheckCircle sx={{ mr: 2, color: 'success.main' }} />
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      Trip Created
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {format(new Date(trip.createdAt), 'MMM dd, yyyy HH:mm')}
                    </Typography>
                  </Box>
                </Box>

                {trip.status === 'active' && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <DirectionsCar sx={{ mr: 2, color: 'primary.main' }} />
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        Active Trip
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Accepting deliveries
                      </Typography>
                    </Box>
                  </Box>
                )}

                {trip.status === 'completed' && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CheckCircle sx={{ mr: 2, color: 'success.main' }} />
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        Trip Completed
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        All deliveries finished
                      </Typography>
                    </Box>
                  </Box>
                )}

                {trip.status === 'cancelled' && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Cancel sx={{ mr: 2, color: 'error.main' }} />
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        Trip Cancelled
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        No longer accepting deliveries
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {trip.status === 'active' && (
                  <>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => navigate('/browse-jobs')}
                    >
                      Browse Jobs
                    </Button>
                    {canEdit && (
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Edit />}
                        onClick={() => navigate(`/trips/${trip.id}/edit`)}
                      >
                        Edit Trip
                      </Button>
                    )}
                  </>
                )}
                
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Visibility />}
                  onClick={() => navigate('/trips')}
                >
                  View All Trips
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Cancel Trip Dialog */}
      <Dialog open={showCancelDialog} onClose={() => setShowCancelDialog(false)}>
        <DialogTitle>Cancel Trip</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to cancel this trip? This action cannot be undone.
          </Typography>
          {trip.currentDeliveries > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              You have {trip.currentDeliveries} active delivery{trip.currentDeliveries > 1 ? 'ies' : 'y'}. 
              Please complete them before cancelling your trip.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCancelDialog(false)}>
            Keep Trip
          </Button>
          <Button 
            onClick={handleCancelTrip} 
            color="error"
            disabled={trip.currentDeliveries > 0}
          >
            Cancel Trip
          </Button>
        </DialogActions>
      </Dialog>

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

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Your Bid Amount"
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(Number(e.target.value))}
                    InputProps={{
                      startAdornment: <AttachMoney />,
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Message to Sender (Optional)"
                    multiline
                    rows={3}
                    value={bidMessage}
                    onChange={(e) => setBidMessage(e.target.value)}
                    placeholder="Explain why you're the best choice for this delivery..."
                  />
                </Grid>
              </Grid>

              <Alert severity="info" sx={{ mt: 2 }}>
                This delivery is a perfect match for your trip route with {selectedDelivery.matchScore}% compatibility.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBidDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitBid}
            variant="contained"
            disabled={isSubmittingBid || !bidAmount}
            startIcon={isSubmittingBid ? <CircularProgress size={20} /> : <Gavel />}
          >
            {isSubmittingBid ? 'Submitting...' : 'Submit Bid'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TripDetail;