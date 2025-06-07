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
  AttachMoney,
  LocalShipping,
  Schedule,
  ArrowBack,
  SaveAlt,
  Preview,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { useCreateDeliveryMutation } from '../../store/api';
import type { CreateDeliveryForm } from '../../types';
import { addDays } from 'date-fns';

const schema = yup.object({
  pickupAddress: yup.string().required('Pickup address is required'),
  pickupSuburb: yup.string().required('Pickup suburb is required'),
  pickupPostcode: yup
    .string()
    .matches(/^\d{4}$/, 'Postcode must be 4 digits')
    .required('Pickup postcode is required'),
  dropoffAddress: yup.string().required('Dropoff address is required'),
  dropoffSuburb: yup.string().required('Dropoff suburb is required'),
  dropoffPostcode: yup
    .string()
    .matches(/^\d{4}$/, 'Postcode must be 4 digits')
    .required('Dropoff postcode is required'),
  itemSize: yup
    .string()
    .oneOf(['small', 'medium', 'large'])
    .required('Item size is required'),
  description: yup
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters')
    .required('Description is required'),
  budget: yup
    .number()
    .min(10, 'Minimum budget is $10')
    .max(10000, 'Maximum budget is $10,000')
    .required('Budget is required'),
  preferredDeliveryDate: yup.date().nullable(),
});

const steps = ['Pickup Details', 'Dropoff Details', 'Item Information', 'Review & Submit'];

const CreateDelivery: React.FC = () => {
  const navigate = useNavigate();
  const [createDelivery, { isLoading, error }] = useCreateDeliveryMutation();
  const [activeStep, setActiveStep] = useState(0);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    trigger,
  } = useForm<CreateDeliveryForm>({
    resolver: yupResolver(schema),
    defaultValues: {
      pickupAddress: '',
      pickupSuburb: '',
      pickupPostcode: '',
      dropoffAddress: '',
      dropoffSuburb: '',
      dropoffPostcode: '',
      itemSize: 'medium',
      description: '',
      budget: 0,
      preferredDeliveryDate: undefined,
    },
  });

  const formData = watch();

  const onSubmit = async (data: CreateDeliveryForm) => {
    try {
      const result = await createDelivery(data).unwrap();
      navigate(`/deliveries/${result.delivery.id}`, {
        state: { message: 'Delivery created successfully!' }
      });
    } catch (err) {
      console.error('Failed to create delivery:', err);
    }
  };

  const handleNext = async () => {
    let fieldsToValidate: (keyof CreateDeliveryForm)[] = [];
    
    switch (activeStep) {
      case 0:
        fieldsToValidate = ['pickupAddress', 'pickupSuburb', 'pickupPostcode'];
        break;
      case 1:
        fieldsToValidate = ['dropoffAddress', 'dropoffSuburb', 'dropoffPostcode'];
        break;
      case 2:
        fieldsToValidate = ['itemSize', 'description', 'budget'];
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

  const getItemSizeDescription = (size: string) => {
    switch (size) {
      case 'small':
        return 'Documents, small packages, envelopes (up to 2kg)';
      case 'medium':
        return 'Boxes, gifts, electronics (2-20kg)';
      case 'large':
        return 'Furniture, appliances, large items (20kg+)';
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
                Pickup Location
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="pickupAddress"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Pickup Address"
                    placeholder="e.g., 123 Collins Street"
                    error={Boolean(errors.pickupAddress)}
                    helperText={errors.pickupAddress?.message}
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
                name="pickupSuburb"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Suburb"
                    placeholder="e.g., Melbourne"
                    error={Boolean(errors.pickupSuburb)}
                    helperText={errors.pickupSuburb?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name="pickupPostcode"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Postcode"
                    placeholder="3000"
                    error={Boolean(errors.pickupPostcode)}
                    helperText={errors.pickupPostcode?.message}
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
                Dropoff Location
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="dropoffAddress"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Dropoff Address"
                    placeholder="e.g., 456 George Street"
                    error={Boolean(errors.dropoffAddress)}
                    helperText={errors.dropoffAddress?.message}
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
                name="dropoffSuburb"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Suburb"
                    placeholder="e.g., Sydney"
                    error={Boolean(errors.dropoffSuburb)}
                    helperText={errors.dropoffSuburb?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name="dropoffPostcode"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Postcode"
                    placeholder="2000"
                    error={Boolean(errors.dropoffPostcode)}
                    helperText={errors.dropoffPostcode?.message}
                  />
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
                Item Details
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="itemSize"
                control={control}
                render={({ field }) => (
                  <FormControl component="fieldset">
                    <FormLabel component="legend">Item Size</FormLabel>
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
                {getItemSizeDescription(formData.itemSize)}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Description"
                    multiline
                    rows={4}
                    placeholder="Describe your item, any special handling instructions, etc."
                    error={Boolean(errors.description)}
                    helperText={errors.description?.message || `${field.value?.length || 0}/500 characters`}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="budget"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Budget"
                    type="number"
                    error={Boolean(errors.budget)}
                    helperText={errors.budget?.message}
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
            <Grid item xs={12} sm={6}>
              <Controller
                name="preferredDeliveryDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    {...field}
                    label="Preferred Delivery Date (Optional)"
                    minDate={new Date()}
                    maxDate={addDays(new Date(), 30)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
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
                Review Your Delivery
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Pickup Location
                      </Typography>
                      <Typography variant="body1">
                        {formData.pickupAddress}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formData.pickupSuburb}, {formData.pickupPostcode}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Dropoff Location
                      </Typography>
                      <Typography variant="body1">
                        {formData.dropoffAddress}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formData.dropoffSuburb}, {formData.dropoffPostcode}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Item Details
                      </Typography>
                      <Typography variant="body1">
                        Size: {formData.itemSize}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formData.description}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Budget & Date
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        ${formData.budget}
                      </Typography>
                      {formData.preferredDeliveryDate && (
                        <Typography variant="body2" color="text.secondary">
                          Preferred: {formData.preferredDeliveryDate.toLocaleDateString()}
                        </Typography>
                      )}
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
          onClick={() => navigate('/deliveries')}
          sx={{ mb: 2 }}
        >
          Back to Deliveries
        </Button>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Create New Delivery
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Fill in the details for your delivery request
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
            {(error as any)?.data?.error || 'Failed to create delivery. Please try again.'}
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
                  {isLoading ? 'Creating...' : 'Create Delivery'}
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

export default CreateDelivery;