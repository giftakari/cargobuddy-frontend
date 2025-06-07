import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  MenuItem,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  CircularProgress,
  InputAdornment,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  LocationOn,
  DirectionsCar,
  Schedule,
  ArrowBack,
  SaveAlt,
  LocalShipping,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { useCreateTripMutation } from '../../store/api';
import type { CreateTripForm } from '../../types';
import { addDays } from 'date-fns';

const schema = yup.object({
  fromAddress: yup.string().required('Departure address is required'),
  fromSuburb: yup.string().required('Departure suburb is required'),
  fromPostcode: yup
    .string()
    .matches(/^\d{4}$/, 'Postcode must be 4 digits')
    .required('Departure postcode is required'),
  toAddress: yup.string().required('Destination address is required'),
  toSuburb: yup.string().required('Destination suburb is required'),
  toPostcode: yup
    .string()
    .matches(/^\d{4}$/, 'Postcode must be 4 digits')
    .required('Destination postcode is required'),
  departureDateTime: yup
    .date()
    .min(new Date(), 'Departure date must be in the future')
    .required('Departure date and time is required'),
  vehicleType: yup
    .string()
    .oneOf(['car', 'van', 'truck', 'motorcycle'])
    .required('Vehicle type is required'),
  availableSpace: yup
    .string()
    .oneOf(['small', 'medium', 'large'])
    .required('Available space is required'),
  maxDeliveries: yup
    .number()
    .min(1, 'Must accept at least 1 delivery')
    .max(5, 'Maximum 5 deliveries allowed')
    .required('Maximum deliveries is required'),
});

const vehicleTypes = [
  { value: 'car', label: 'Car' },
  { value: 'van', label: 'Van' },
  { value: 'truck', label: 'Truck' },
  { value: 'motorcycle', label: 'Motorcycle' },
];

const steps = ['Route Details', 'Vehicle Information', 'Capacity & Schedule', 'Review & Create'];

const CreateTrip: React.FC = () => {
  const navigate = useNavigate();
  const [createTrip, { isLoading, error }] = useCreateTripMutation();
  const [activeStep, setActiveStep] = useState(0);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    trigger,
  } = useForm<CreateTripForm>({
    resolver: yupResolver(schema),
    defaultValues: {
      fromAddress: '',
      fromSuburb: '',
      fromPostcode: '',
      toAddress: '',
      toSuburb: '',
      toPostcode: '',
      departureDateTime: new Date(),
      vehicleType: 'car',
      availableSpace: 'medium',
      maxDeliveries: 2,
    },
  });

  const formData = watch();

  const onSubmit = async (data: CreateTripForm) => {
    try {
      const result = await createTrip(data).unwrap();
      navigate(`/trips/${result.trip.id}`, {
        state: { message: 'Trip created successfully!' }
      });
    } catch (err) {
      console.error('Failed to create trip:', err);
    }
  };

  const handleNext = async () => {
    let fieldsToValidate: (keyof CreateTripForm)[] = [];
    
    switch (activeStep) {
      case 0:
        fieldsToValidate = ['fromAddress', 'fromSuburb', 'fromPostcode', 'toAddress', 'toSuburb', 'toPostcode'];
        break;
      case 1:
        fieldsToValidate = ['vehicleType'];
        break;
      case 2:
        fieldsToValidate = ['availableSpace', 'maxDeliveries', 'departureDateTime'];
        break;
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const getSpaceDescription = (space: string) => {
    switch (space) {
      case 'small':
        return 'Documents, small packages (up to 2kg each)';
      case 'medium':
        return 'Boxes, gifts, electronics (2-20kg each)';
      case 'large':
        return 'Furniture, appliances, large items (20kg+ each)';
      default:
        return '';
    }
  };

  const getVehicleCapacity = (vehicleType: string) => {
    switch (vehicleType) {
      case 'motorcycle':
        return 'Best for: Small items, documents, urgent deliveries';
      case 'car':
        return 'Best for: Small to medium packages, personal items';
      case 'van':
        return 'Best for: Multiple packages, medium to large items';
      case 'truck':
        return 'Best for: Large items, furniture, commercial deliveries';
      default:
        return '';
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Trip Route
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Enter your departure and destination details
              </Typography>
            </Grid>
            
            {/* Departure */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                Departure Location
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="fromAddress"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Departure Address"
                    placeholder="e.g., 123 Collins Street"
                    error={Boolean(errors.fromAddress)}
                    helperText={errors.fromAddress?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationOn />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={8}>
              <Controller
                name="fromSuburb"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Suburb"
                    placeholder="e.g., Melbourne"
                    error={Boolean(errors.fromSuburb)}
                    helperText={errors.fromSuburb?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name="fromPostcode"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Postcode"
                    placeholder="3000"
                    error={Boolean(errors.fromPostcode)}
                    helperText={errors.fromPostcode?.message}
                  />
                )}
              />
            </Grid>

            {/* Destination */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                Destination
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="toAddress"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Destination Address"
                    placeholder="e.g., 456 George Street"
                    error={Boolean(errors.toAddress)}
                    helperText={errors.toAddress?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationOn />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={8}>
              <Controller
                name="toSuburb"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Suburb"
                    placeholder="e.g., Sydney"
                    error={Boolean(errors.toSuburb)}
                    helperText={errors.toSuburb?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name="toPostcode"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Postcode"
                    placeholder="2000"
                    error={Boolean(errors.toPostcode)}
                    helperText={errors.toPostcode?.message}
                  />
                )}
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Vehicle Information
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Select your vehicle type for this trip
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="vehicleType"
                control={control}
                render={({ field }) => (
                  <FormControl component="fieldset">
                    <FormLabel component="legend">Vehicle Type</FormLabel>
                    <RadioGroup {...field} sx={{ mt: 1 }}>
                      {vehicleTypes.map((vehicle) => (
                        <FormControlLabel
                          key={vehicle.value}
                          value={vehicle.value}
                          control={<Radio />}
                          label={
                            <Box>
                              <Typography variant="body1" fontWeight="medium">
                                {vehicle.label}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {getVehicleCapacity(vehicle.value)}
                              </Typography>
                            </Box>
                          }
                          sx={{ mb: 1, alignItems: 'flex-start' }}
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>
                )}
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Capacity & Schedule
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Set your delivery capacity and departure time
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Controller
                name="availableSpace"
                control={control}
                render={({ field }) => (
                  <FormControl component="fieldset">
                    <FormLabel component="legend">Available Space for Deliveries</FormLabel>
                    <RadioGroup {...field} row sx={{ mt: 1 }}>
                      <FormControlLabel 
                        value="small" 
                        control={<Radio />} 
                        label="Small" 
                      />
                      <FormControlLabel 
                        value="medium" 
                        control={<Radio />} 
                        label="Medium" 
                      />
                      <FormControlLabel 
                        value="large" 
                        control={<Radio />} 
                        label="Large" 
                      />
                    </RadioGroup>
                  </FormControl>
                )}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {getSpaceDescription(formData.availableSpace)}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="maxDeliveries"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Maximum Deliveries"
                    type="number"
                    inputProps={{ min: 1, max: 5 }}
                    error={Boolean(errors.maxDeliveries)}
                    helperText={errors.maxDeliveries?.message || 'How many deliveries can you take on this trip?'}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocalShipping />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="departureDateTime"
                control={control}
                render={({ field }) => (
                  <DateTimePicker
                    {...field}
                    label="Departure Date & Time"
                    minDateTime={new Date()}
                    maxDateTime={addDays(new Date(), 30)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: Boolean(errors.departureDateTime),
                        helperText: errors.departureDateTime?.message,
                        InputProps: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <Schedule />
                            </InputAdornment>
                          ),
                        },
                      },
                    }}
                  />
                )}
              />
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Review Your Trip
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Please review your trip details before creating
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Route
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {formData.fromSuburb} → {formData.toSuburb}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formData.fromAddress} to {formData.toAddress}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Departure
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {formData.departureDateTime?.toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formData.departureDateTime?.toLocaleTimeString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Vehicle & Space
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {formData.vehicleType} - {formData.availableSpace} space
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {getSpaceDescription(formData.availableSpace)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Delivery Capacity
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        Up to {formData.maxDeliveries} deliveries
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        You can accept bids for deliveries along your route
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

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
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Create New Trip
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Plan your trip and start accepting deliveries along your route
        </Typography>
      </Box>

      {/* Stepper */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Form */}
      <Paper sx={{ p: 3 }}>
        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {(error as any)?.data?.error || 'Failed to create trip. Please try again.'}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          {renderStepContent(activeStep)}

          {/* Navigation Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button
              onClick={handleBack}
              disabled={activeStep === 0}
              startIcon={<ArrowBack />}
            >
              Back
            </Button>

            <Box sx={{ display: 'flex', gap: 2 }}>
              {activeStep === steps.length - 1 ? (
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isLoading}
                  startIcon={isLoading ? <CircularProgress size={20} /> : <SaveAlt />}
                  size="large"
                >
                  {isLoading ? 'Creating...' : 'Create Trip'}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  variant="contained"
                  size="large"
                >
                  Next
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default CreateTrip;