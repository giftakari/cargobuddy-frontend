import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Avatar,
  Chip,
  Rating,
  Paper,
  Alert,
  CircularProgress,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  Person,
  Edit,
  Save,
  Cancel,
  Phone,
  Email,
  DirectionsCar,
  Star,
  LocalShipping,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAppSelector } from '../../hooks/redux';
import { selectUser } from '../../store/slices/authSlice';
import { useUpdateProfileMutation } from '../../store/api';
import type { User } from '../../types';

const schema = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  phone: yup
    .string()
    .matches(/^(\+?61|0)[2-9]\d{8}$/, 'Enter a valid Australian phone number')
    .required('Phone number is required'),
  vehicleType: yup.string().nullable(),
  licenseNumber: yup.string().nullable(),
});

const vehicleTypes = [
  { value: 'car', label: 'Car' },
  { value: 'van', label: 'Van' },
  { value: 'truck', label: 'Truck' },
  { value: 'motorcycle', label: 'Motorcycle' },
];

const Profile: React.FC = () => {
  const user = useAppSelector(selectUser);
  const [updateProfile, { isLoading, error }] = useUpdateProfileMutation();
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<Partial<User>>({
    resolver: yupResolver(schema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      vehicleType: user?.vehicleType || '',
      licenseNumber: user?.licenseNumber || '',
    },
  });

  const onSubmit = async (data: Partial<User>) => {
    try {
      await updateProfile(data).unwrap();
      setIsEditing(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    reset({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      vehicleType: user?.vehicleType || '',
      licenseNumber: user?.licenseNumber || '',
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    reset();
  };

  if (!user) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6">Loading profile...</Typography>
      </Box>
    );
  }

  const isDriver = user.userType === 'driver' || user.userType === 'both';
  const isSender = user.userType === 'sender' || user.userType === 'both';

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          My Profile
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your account information and preferences
        </Typography>
      </Box>

      {/* Success Alert */}
      {showSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Profile updated successfully!
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {(error as any)?.data?.error || 'Failed to update profile. Please try again.'}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Column - Profile Info */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'flex-start', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      bgcolor: 'primary.main',
                      fontSize: '2rem',
                      mr: 3,
                    }}
                  >
                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      {user.firstName} {user.lastName}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                      {user.email}
                    </Typography>
                    <Chip
                      label={
                        user.userType === 'both'
                          ? 'Sender & Driver'
                          : user.userType.charAt(0).toUpperCase() + user.userType.slice(1)
                      }
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                </Box>
                
                {!isEditing && (
                  <Button
                    variant="outlined"
                    startIcon={<Edit />}
                    onClick={handleEdit}
                  >
                    Edit Profile
                  </Button>
                )}
              </Box>

              <Divider sx={{ mb: 3 }} />

              {/* Profile Form */}
              <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="firstName"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="First Name"
                          disabled={!isEditing}
                          error={Boolean(errors.firstName)}
                          helperText={errors.firstName?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="lastName"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Last Name"
                          disabled={!isEditing}
                          error={Boolean(errors.lastName)}
                          helperText={errors.lastName?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      value={user.email}
                      disabled
                      helperText="Email cannot be changed"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="phone"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Phone Number"
                          disabled={!isEditing}
                          error={Boolean(errors.phone)}
                          helperText={errors.phone?.message}
                        />
                      )}
                    />
                  </Grid>

                  {/* Driver-specific fields */}
                  {isDriver && (
                    <>
                      <Grid item xs={12} sm={6}>
                        <Controller
                          name="vehicleType"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              select
                              fullWidth
                              label="Vehicle Type"
                              disabled={!isEditing}
                              error={Boolean(errors.vehicleType)}
                              helperText={errors.vehicleType?.message}
                            >
                              {vehicleTypes.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                  {option.label}
                                </MenuItem>
                              ))}
                            </TextField>
                          )}
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Controller
                          name="licenseNumber"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Driver License Number"
                              disabled={!isEditing}
                              error={Boolean(errors.licenseNumber)}
                              helperText={errors.licenseNumber?.message}
                            />
                          )}
                        />
                      </Grid>
                    </>
                  )}

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      Account Status
                    </Typography>
                    <Chip
                      label={user.isActive ? 'Active' : 'Inactive'}
                      color={user.isActive ? 'success' : 'error'}
                      icon={user.isActive ? <Person /> : <Cancel />}
                    />
                  </Grid>
                </Grid>

                {/* Form Actions */}
                {isEditing && (
                  <Box sx={{ display: 'flex', gap: 2, mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={isLoading}
                      startIcon={isLoading ? <CircularProgress size={20} /> : <Save />}
                    >
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={handleCancel}
                      disabled={isLoading}
                      startIcon={<Cancel />}
                    >
                      Cancel
                    </Button>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Stats & Ratings */}
        <Grid item xs={12} lg={4}>
          {/* Ratings Cards */}
          {isSender && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                    <Star />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      Sender Rating
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      How senders rate you
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h3" fontWeight="bold" sx={{ mr: 2 }}>
                    {user.senderRating.toFixed(1)}
                  </Typography>
                  <Box>
                    <Rating value={user.senderRating} readOnly precision={0.1} />
                    <Typography variant="body2" color="text.secondary">
                      {user.totalSenderRatings} reviews
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}

          {isDriver && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                    <DirectionsCar />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      Driver Rating
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      How drivers rate you
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h3" fontWeight="bold" sx={{ mr: 2 }}>
                    {user.driverRating.toFixed(1)}
                  </Typography>
                  <Box>
                    <Rating value={user.driverRating} readOnly precision={0.1} />
                    <Typography variant="body2" color="text.secondary">
                      {user.totalDriverRatings} reviews
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Account Information */}
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Account Information
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Member Since
                </Typography>
                <Typography variant="body1">
                  {new Date(user.createdAt).toLocaleDateString('en-AU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Last Updated
                </Typography>
                <Typography variant="body1">
                  {new Date(user.updatedAt).toLocaleDateString('en-AU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  User Type
                </Typography>
                <Typography variant="body1">
                  {user.userType === 'both' 
                    ? 'Sender & Driver' 
                    : user.userType.charAt(0).toUpperCase() + user.userType.slice(1)
                  }
                </Typography>
              </Box>

              {isDriver && user.vehicleType && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Vehicle
                  </Typography>
                  <Typography variant="body1">
                    {user.vehicleType.charAt(0).toUpperCase() + user.vehicleType.slice(1)}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile;