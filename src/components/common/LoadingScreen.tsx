import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

const LoadingContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  backgroundColor: theme.palette.background.default,
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  textAlign: 'center',
}));

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Loading...' 
}) => {
  return (
    <LoadingContainer>
      <LogoContainer>
        <Typography variant="h4" component="h1" color="primary" fontWeight="bold">
          DeliveryMatch
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Australian Delivery Network
        </Typography>
      </LogoContainer>
      
      <CircularProgress size={40} thickness={4} />
      
      <Typography 
        variant="body1" 
        color="text.secondary" 
        sx={{ mt: 2 }}
      >
        {message}
      </Typography>
    </LoadingContainer>
  );
};

export default LoadingScreen;