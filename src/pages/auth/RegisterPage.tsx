import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Divider,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  MenuItem,
  Grid,
} from '@mui/material';
import {
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  LocalShipping,
  Person,
  Phone,
  DirectionsCar,
  CreditCard,
} from '@mui/icons-material';
import { useForm, Controller} from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useRegisterMutation } from '../../store/api';
import type { RegisterRequest } from '../../types';

const schema = yup.object({
  email: yup
    .string()
    .email('Enter a valid email')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
  firstName: yup
    .string()
    .required('First name is required'),
  lastName: yup
    .string()
    .required('Last name is required'),
  phone: yup
    .string()
    .matches(/^(\+?61|0)[2-9]\d{8}$/, 'Enter a valid Australian phone number')
    .required('Phone number is required'),
  userType: yup
    .string()
    .oneOf(['sender', 'driver', 'both'])
    .required('User type is required'),
  vehicleType: yup
    .string()
    .when('userType', {
      is: (val: string) => val === 'driver' || val === 'both',
      then: (schema) => schema.required('Vehicle type is required for drivers'),
      otherwise: (schema) => schema.nullable(),
    }),
  licenseNumber: yup
    .string()
    .when('userType', {
      is: (val: string) => val === 'driver' || val === 'both',
      then: (schema) => schema.required('License number is required for drivers'),
      otherwise: (schema) => schema.nullable(),
    }),
});

const vehicleTypes = [
  { value: 'car', label: 'Car' },
  { value: 'van', label: 'Van' },
  { value: 'truck', label: 'Truck' },
  { value: 'motorcycle', label: 'Motorcycle' },
];

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [register, { isLoading, error }] = useRegisterMutation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterRequest & { confirmPassword: string }>({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      phone: '',
      userType: 'sender',
      vehicleType: undefined,
      licenseNumber: undefined,
    },
  });

  const userType = watch('userType');
  const showDriverFields = userType === 'driver' || userType === 'both';

  const onSubmit = async (data: RegisterRequest & { confirmPassword: string }) => {
    try {
      const { confirmPassword, ...registerData } = data;

      if (registerData.userType === 'sender') {
        delete registerData.vehicleType;
        delete registerData.licenseNumber;
      }
      
      await register(registerData).unwrap();
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: 2,
      }}
    >
      <Paper
        elevation={8}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 600,
          borderRadius: 2,
          my: 2,
        }}
      >
        {/* Logo & Header */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <LocalShipping 
            sx={{ 
              fontSize: 48, 
              color: 'primary.main', 
              mb: 1 
            }} 
          />
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Create Account
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Join the DeliveryMatch network
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {(error as any)?.data?.error || 'Registration failed. Please try again.'}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2}>
            {/* Name Fields */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="firstName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="First Name"
                    error={Boolean(errors.firstName)}
                    helperText={errors.firstName?.message}
                    disabled={isLoading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person color="action" />
                        </InputAdornment>
                      ),
                    }}
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
                    error={Boolean(errors.lastName)}
                    helperText={errors.lastName?.message}
                    disabled={isLoading}
                  />
                )}
              />
            </Grid>

            {/* Email */}
            <Grid item xs={12}>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Email Address"
                    type="email"
                    error={Boolean(errors.email)}
                    helperText={errors.email?.message}
                    disabled={isLoading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </Grid>

            {/* Phone */}
            <Grid item xs={12}>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Phone Number"
                    type="tel"
                    placeholder="04XX XXX XXX"
                    error={Boolean(errors.phone)}
                    helperText={errors.phone?.message || 'Australian mobile number required'}
                    disabled={isLoading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Phone color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </Grid>

            {/* Password Fields */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    error={Boolean(errors.password)}
                    helperText={errors.password?.message}
                    disabled={isLoading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={togglePasswordVisibility}
                            edge="end"
                            disabled={isLoading}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="confirmPassword"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Confirm Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    error={Boolean(errors.confirmPassword)}
                    helperText={errors.confirmPassword?.message}
                    disabled={isLoading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={toggleConfirmPasswordVisibility}
                            edge="end"
                            disabled={isLoading}
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </Grid>

            {/* User Type */}
            <Grid item xs={12}>
              <Controller
                name="userType"
                control={control}
                render={({ field }) => (
                  <FormControl component="fieldset">
                    <FormLabel component="legend">I want to:</FormLabel>
                    <RadioGroup
                      {...field}
                      row
                      sx={{ mt: 1 }}
                    >
                      <FormControlLabel 
                        value="sender" 
                        control={<Radio />} 
                        label="Send packages" 
                        disabled={isLoading}
                      />
                      <FormControlLabel 
                        value="driver" 
                        control={<Radio />} 
                        label="Deliver packages" 
                        disabled={isLoading}
                      />
                      <FormControlLabel 
                        value="both" 
                        control={<Radio />} 
                        label="Both" 
                        disabled={isLoading}
                      />
                    </RadioGroup>
                  </FormControl>
                )}
              />
            </Grid>

            {/* Driver-specific fields */}
            {showDriverFields && (
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
                        error={Boolean(errors.vehicleType)}
                        helperText={errors.vehicleType?.message}
                        disabled={isLoading}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <DirectionsCar color="action" />
                            </InputAdornment>
                          ),
                        }}
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
                        error={Boolean(errors.licenseNumber)}
                        helperText={errors.licenseNumber?.message}
                        disabled={isLoading}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <CreditCard color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>
              </>
            )}
          </Grid>

          {/* Submit Button */}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={isLoading}
            sx={{ mt: 3, mb: 2, py: 1.5 }}
          >
            {isLoading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>

          {/* Login Link */}
          <Box textAlign="center">
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
              <Link 
                component={RouterLink} 
                to="/login"
                underline="hover"
                fontWeight="medium"
              >
                Sign in here
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default RegisterPage;