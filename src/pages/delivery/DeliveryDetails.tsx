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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  TextField,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack,
  LocationOn,
  AttachMoney,
  Schedule,
  LocalShipping,
  Person,
  Star,
  Chat,
  CheckCircle,
  Cancel,
  Visibility,
  Edit,
  Delete,
  DirectionsCar,
  Send,
  AccessTime,
} from '@mui/icons-material';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  useGetDeliveryQuery, 
  useGetBidsQuery, 
  useAcceptBidMutation,
  useMarkDeliveredMutation,
  useRateUserMutation,
  useGetDeliveryMatchingQuery,
  useInviteDriverToBidMutation,
  useGetDeliveryInvitationsQuery,
} from '../../store/api';
import { format } from 'date-fns';
import LoadingScreen from '../../components/common/LoadingScreen';
import type { Bid } from '../../types';

const DeliveryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const deliveryId = parseInt(id!);

  const { data: delivery, isLoading, error } = useGetDeliveryQuery(deliveryId);
  const { data: bids } = useGetBidsQuery({ delivery: deliveryId });
  const { data: matchingData } = useGetDeliveryMatchingQuery(deliveryId);
  const { data: invitations } = useGetDeliveryInvitationsQuery(deliveryId);
  const [acceptBid] = useAcceptBidMutation();
  const [markDelivered] = useMarkDeliveredMutation();
  const [rateUser] = useRateUserMutation();
  const [inviteDriverToBid, { isLoading: isInviting }] = useInviteDriverToBidMutation();

  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [rating, setRating] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);


  console.log('Delivery data:', {
    createdAt: delivery?.createdAt,
    preferredDeliveryDate: delivery?.preferredDeliveryDate,
    completedAt: delivery?.completedAt
  });

  // Show success message if redirected from creation
  const successMessage = location.state?.message;

  if (isLoading) {
    return <LoadingScreen message="Loading delivery details..." />;
  }

  if (error || !delivery) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="error" gutterBottom>
          Failed to load delivery details
        </Typography>
        <Button variant="contained" onClick={() => navigate('/deliveries')}>
          Back to Deliveries
        </Button>
      </Box>
    );
  }

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

  const canAcceptBids = delivery.status === 'pending' && bids && bids.length > 0;
  const canMarkDelivered = delivery.status === 'in_transit';
  const canRate = delivery.status === 'delivered' && delivery.assignedDriver;
  const canChat = delivery.assignedDriver && ['assigned', 'in_transit'].includes(delivery.status);
  const matchingTrips = matchingData?.matchingTrips || [];

  const handleAcceptBid = async () => {
    if (!selectedBid) return;
    
    try {
      setIsSubmitting(true);
      await acceptBid({ 
        deliveryId: delivery.id, 
        bidId: selectedBid.id 
      }).unwrap();
      setShowAcceptDialog(false);
      setSelectedBid(null);
    } catch (error) {
      console.error('Failed to accept bid:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkDelivered = async () => {
    try {
      await markDelivered(delivery.id).unwrap();
      setShowRatingDialog(true);
    } catch (error) {
      console.error('Failed to mark as delivered:', error);
    }
  };

  const handleSubmitRating = async () => {
    if (!delivery.assignedDriver) return;

    try {
      setIsSubmitting(true);
      await rateUser({
        rating,
        comment: ratingComment,
        userId: delivery.assignedDriver.id,
        deliveryId: delivery.id,
      }).unwrap();
      setShowRatingDialog(false);
      navigate('/deliveries');
    } catch (error) {
      console.error('Failed to submit rating:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInviteDriver = async (trip: any) => {
    try {
      await inviteDriverToBid({
        deliveryId: delivery.id,
        driverId: trip.driver.id,
      }).unwrap();
      
      // Success - the component will re-render with updated status
    } catch (error: any) {
      console.error('Failed to invite driver:', error);
      alert('Failed to send invitation. Please try again.');
    }
  };

  // Helper function to get driver invitation/bid status
  const getDriverStatus = (driverId: number) => {
    // Check if there's an invitation for this driver
    const invitation = invitations?.find(inv => inv.driver.id === driverId);
    
    // Check if there's a bid from this driver
    const bid = bids?.find(b => b.bidder.id === driverId);
    
    if (bid) {
      return {
        type: 'bid',
        status: bid.status,
        data: bid
      };
    }
    
    if (invitation) {
      return {
        type: 'invitation',
        status: invitation.status,
        data: invitation
      };
    }
    
    return {
      type: 'none',
      status: 'none',
      data: null
    };
  };

  // Helper function to get button state for a driver
  const getDriverButtonState = (trip: any) => {
    const driverStatus = getDriverStatus(trip.driver.id);
    
    if (trip.currentDeliveries >= trip.maxDeliveries) {
      return {
        text: 'Full',
        disabled: true,
        color: 'default' as const,
        variant: 'outlined' as const
      };
    }
    
    switch (driverStatus.type) {
      case 'bid':
        switch (driverStatus.status) {
          case 'pending':
            return {
              text: 'Bid Received',
              disabled: true,
              color: 'success' as const,
              variant: 'contained' as const
            };
          case 'accepted':
            return {
              text: 'Assigned',
              disabled: true,
              color: 'primary' as const,
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
              text: 'Notify Driver',
              disabled: false,
              color: 'primary' as const,
              variant: 'contained' as const
            };
        }
        
      case 'invitation':
        switch (driverStatus.status) {
          case 'sent':
            return {
              text: 'Invitation Sent',
              disabled: true,
              color: 'info' as const,
              variant: 'outlined' as const
            };
          case 'viewed':
            return {
              text: 'Invitation Viewed',
              disabled: true,
              color: 'warning' as const,
              variant: 'outlined' as const
            };
          case 'bid_placed':
            return {
              text: 'Bid Received',
              disabled: true,
              color: 'success' as const,
              variant: 'contained' as const
            };
          default:
            return {
              text: 'Notify Driver',
              disabled: false,
              color: 'primary' as const,
              variant: 'contained' as const
            };
        }
        
      default:
        return {
          text: 'Notify Driver',
          disabled: isInviting,
          color: 'primary' as const,
          variant: 'contained' as const
        };
    }
  };

  const getBidStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'accepted': return 'success';
      case 'rejected': return 'error';
      case 'withdrawn': return 'default';
      default: return 'default';
    }
  };


  const safeFormatDate = (dateValue, formatString, fallback = 'Not set') => {
    if (!dateValue) return fallback;
    
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) {
        return fallback;
      }
      return format(date, formatString);
    } catch (error) {
      console.error('Date formatting error:', error, 'for value:', dateValue);
      return fallback;
    }
  };
  
  // Then use it:


  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/deliveries')}
          sx={{ mb: 2 }}
        >
          Back to Deliveries
        </Button>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {delivery.description}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Chip
                label={delivery.status.replace('_', ' ')}
                color={getStatusColor(delivery.status) as any}
              />
              <Chip
                label={delivery.itemSize}
                variant="outlined"
              />
              <Chip
                label={`$${delivery.budget}`}
                icon={<AttachMoney />}
                color="primary"
              />
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            {canChat && (
              <Button
                variant="outlined"
                startIcon={<Chat />}
                onClick={() => navigate(`/chat/${delivery.id}`)}
              >
                Chat
              </Button>
            )}
            {canMarkDelivered && (
              <Button
                variant="contained"
                startIcon={<CheckCircle />}
                onClick={handleMarkDelivered}
                color="success"
              >
                Mark as Delivered
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
                Route Information
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2, mt: 0.5 }}>
                      <LocationOn />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Pickup Location
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {delivery.pickupAddress}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {delivery.pickupSuburb}, {delivery.pickupPostcode}
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
                        Dropoff Location
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {delivery.dropoffAddress}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {delivery.dropoffSuburb}, {delivery.dropoffPostcode}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Item Details */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Item Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Size
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {delivery.itemSize}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Budget
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" sx={{ mb: 2 }}>
                    ${delivery.budget}
                    {delivery.finalPrice && delivery.finalPrice !== delivery.budget && (
                      <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                        (Final: ${delivery.finalPrice})
                      </Typography>
                    )}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1">
                    {delivery.description}
                  </Typography>
                </Grid>
                {delivery.preferredDeliveryDate && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Preferred Delivery Date
                    </Typography>
                    <Typography variant="body1">
                      {safeFormatDate(new Date(delivery.preferredDeliveryDate), 'EEEE, MMMM dd, yyyy')}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Assigned Driver */}
          {delivery.assignedDriver && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Assigned Driver
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
                    <Person />
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6">
                      {delivery.assignedDriver.firstName} {delivery.assignedDriver.lastName}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Rating value={delivery.assignedDriver.driverRating} readOnly size="small" />
                      <Typography variant="body2" color="text.secondary">
                        ({delivery.assignedDriver.totalDriverRatings || 0} reviews)
                      </Typography>
                    </Box>
                    {delivery.assignedDriver.vehicleType && (
                      <Typography variant="body2" color="text.secondary">
                        Vehicle: {delivery.assignedDriver.vehicleType}
                      </Typography>
                    )}
                  </Box>
                  {canChat && (
                    <Button
                      variant="outlined"
                      startIcon={<Chat />}
                      onClick={() => navigate(`/chat/${delivery.id}`)}
                    >
                      Message
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Matching Trips for Senders */}
          {delivery.status === 'pending' && matchingTrips.length > 0 && !delivery.assignedDriver && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Matching Drivers ({matchingTrips.length})
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  These drivers are traveling your route. They'll be notified about your delivery through our matching system.
                </Typography>
                
                <List>
                  {matchingTrips.slice(0, 5).map((trip, index) => (
                    <React.Fragment key={trip.id}>
                      <ListItem
                        alignItems="flex-start"
                        sx={{
                          borderRadius: 1,
                          mb: 1,
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'info.main' }}>
                            <DirectionsCar />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="subtitle1" fontWeight="medium">
                                {trip.driver.firstName} {trip.driver.lastName}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip
                                  label={`${trip.matchScore}% match`}
                                  size="small"
                                  color="primary"
                                />
                                <Chip
                                  label={trip.vehicleType}
                                  size="small"
                                  variant="outlined"
                                />
                              </Box>
                            </Box>
                          }
                          secondary={
                            <Box component="div">
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Star sx={{ fontSize: 16, color: 'warning.main' }} />
                                <Typography variant="body2" color="text.secondary" component="span">
                                  {trip.driver.driverRating.toFixed(1)} ({trip.driver.totalDriverRatings || 0} reviews)
                                </Typography>
                              </Box>
                              <Typography variant="body2" color="text.secondary" component="div">
                                Route: {trip.fromSuburb} → {trip.toSuburb}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" component="div">
                                Departure: {safeFormatDate(new Date(trip.departureDateTime), 'MMM dd, HH:mm')} • 
                                Detour: ~{trip.estimatedDetour} km
                              </Typography>
                              <Typography variant="body2" color="text.secondary" component="div">
                                Space: {trip.availableSpace} • 
                                Capacity: {trip.currentDeliveries}/{trip.maxDeliveries}
                              </Typography>
                            </Box>
                          }
                        />
                        <Button
                          size="small"
                          variant={getDriverButtonState(trip).variant}
                          color={getDriverButtonState(trip).color}
                          startIcon={<Send />}
                          onClick={() => handleInviteDriver(trip)}
                          disabled={getDriverButtonState(trip).disabled}
                        >
                          {getDriverButtonState(trip).text}
                        </Button>
                      </ListItem>
                      {index < matchingTrips.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>

                {matchingTrips.length > 5 && (
                  <Box sx={{ textAlign: 'center', mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      +{matchingTrips.length - 5} more matching drivers available
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

          {/* No matching trips */}
          {delivery.status === 'pending' && matchingTrips.length === 0 && !delivery.assignedDriver && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Matching Drivers
                </Typography>
                <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
                  <DirectionsCar sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    No drivers are currently traveling your route. We'll notify you when matching drivers become available.
                  </Typography>
                </Paper>
              </CardContent>
            </Card>
          )}

          {/* Bids */}
          {canAcceptBids && bids && bids.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Bids ({bids.length})
                </Typography>
                <List>
                  {bids.map((bid, index) => (
                    <React.Fragment key={bid.id}>
                      <ListItem
                        alignItems="flex-start"
                        sx={{
                          backgroundColor: bid.status === 'accepted' ? 'success.50' : 'transparent',
                          borderRadius: 1,
                          mb: 1,
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <Person />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="subtitle1" fontWeight="medium">
                                {bid.bidder.firstName} {bid.bidder.lastName}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="h6" fontWeight="bold" color="primary.main">
                                  ${bid.amount}
                                </Typography>
                                <Chip
                                  label={bid.status}
                                  size="small"
                                  color={getBidStatusColor(bid.status) as any}
                                />
                              </Box>
                            </Box>
                          }
                          secondary={
                            <Box component="div">
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Rating value={bid.bidder.driverRating} readOnly size="small" />
                                <Typography variant="body2" color="text.secondary" component="span">
                                  ({bid.bidder.totalDriverRatings || 0} reviews)
                                </Typography>
                              </Box>
                              {bid.message && (
                                <Typography variant="body2" sx={{ mb: 1 }} component="div">
                                  {bid.message}
                                </Typography>
                              )}
                              <Typography variant="caption" color="text.secondary" component="div">
                                Bid placed {safeFormatDate(new Date(bid.createdAt), 'MMM dd, yyyy HH:mm')}
                              </Typography>
                              {bid.status === 'pending' && (
                                <Box sx={{ mt: 1 }}>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    onClick={() => {
                                      setSelectedBid(bid);
                                      setShowAcceptDialog(true);
                                    }}
                                  >
                                    Accept Bid
                                  </Button>
                                </Box>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < bids.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}

          {/* No bids message */}
          {delivery.status === 'pending' && (!bids || bids.length === 0) && (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <LocalShipping sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No bids yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Drivers will start bidding on your delivery soon. You'll get notified when new bids arrive.
              </Typography>
            </Paper>
          )}
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} lg={4}>
          {/* Timeline / Status */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Delivery Timeline
              </Typography>
              <Box sx={{ pl: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Schedule sx={{ mr: 2, color: 'success.main' }} />
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      Created
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                    {safeFormatDate(new Date(delivery.createdAt), 'MMM dd, yyyy HH:mm')}
                    </Typography>
                  </Box>
                </Box>

                {delivery.assignedDriver && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Person sx={{ mr: 2, color: 'info.main' }} />
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        Driver Assigned
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {delivery.assignedDriver.firstName} {delivery.assignedDriver.lastName}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {delivery.status === 'in_transit' && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <LocalShipping sx={{ mr: 2, color: 'primary.main' }} />
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        In Transit
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Delivery in progress
                      </Typography>
                    </Box>
                  </Box>
                )}

                {delivery.status === 'delivered' && delivery.completedAt && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CheckCircle sx={{ mr: 2, color: 'success.main' }} />
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        Delivered
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {safeFormatDate(new Date(delivery.completedAt), 'MMM dd, yyyy HH:mm')}
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
                {canChat && (
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Chat />}
                    onClick={() => navigate(`/chat/${delivery.id}`)}
                  >
                    Message Driver
                  </Button>
                )}
                {canMarkDelivered && (
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<CheckCircle />}
                    onClick={handleMarkDelivered}
                    color="success"
                  >
                    Mark as Delivered
                  </Button>
                )}
                {canRate && (
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Star />}
                    onClick={() => setShowRatingDialog(true)}
                  >
                    Rate Driver
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Accept Bid Dialog */}
      <Dialog open={showAcceptDialog} onClose={() => setShowAcceptDialog(false)}>
        <DialogTitle>Accept Bid</DialogTitle>
        <DialogContent>
          {selectedBid && (
            <Box>
              <Typography gutterBottom>
                Are you sure you want to accept the bid from{' '}
                <strong>{selectedBid.bidder.firstName} {selectedBid.bidder.lastName}</strong>{' '}
                for <strong>${selectedBid.amount}</strong>?
              </Typography>
              <Alert severity="info" sx={{ mt: 2 }}>
                Payment will be processed and the delivery will be assigned to this driver.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAcceptDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleAcceptBid} 
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting ? <CircularProgress size={20} /> : 'Accept Bid'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rating Dialog */}
      <Dialog open={showRatingDialog} onClose={() => setShowRatingDialog(false)}>
        <DialogTitle>Rate Your Driver</DialogTitle>
        <DialogContent>
          {delivery.assignedDriver && (
            <Box sx={{ pt: 1 }}>
              <Typography gutterBottom>
                How was your experience with {delivery.assignedDriver.firstName}?
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Typography sx={{ mr: 2 }}>Rating:</Typography>
                <Rating
                  value={rating}
                  onChange={(_, newValue) => setRating(newValue || 5)}
                  size="large"
                />
              </Box>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Comment (Optional)"
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="Share your experience..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRatingDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitRating} 
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting ? <CircularProgress size={20} /> : 'Submit Rating'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DeliveryDetail;