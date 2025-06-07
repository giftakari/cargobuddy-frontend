import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  InputAdornment,
  IconButton,
  Chip,
  Card,
  CardContent,
  Divider,
  Grid,
} from '@mui/material';
import {
  ArrowBack,
  Send,
  Person,
  LocalShipping,
  AttachMoney,
  Schedule,
  LocationOn,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  useGetDeliveryQuery,
  useGetChatMessagesQuery,
  useSendMessageMutation,
} from '../../store/api';
import { useAppSelector } from '../../hooks/redux';
import { selectUser } from '../../store/slices/authSlice';
import { format, isToday, isYesterday } from 'date-fns';
import LoadingScreen from '../../components/common/LoadingScreen';
import type { ChatMessage } from '../../types';

const Chat: React.FC = () => {
  const { deliveryId } = useParams<{ deliveryId: string }>();
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [message, setMessage] = useState('');
  
  const { data: delivery, isLoading: deliveryLoading } = useGetDeliveryQuery(
    parseInt(deliveryId!)
  );
  const { data: messages, isLoading: messagesLoading } = useGetChatMessagesQuery(
    parseInt(deliveryId!)
  );
  const [sendMessage, { isLoading: sendingMessage }] = useSendMessageMutation();

  // Determine chat partner
  const chatPartner = delivery?.assignedDriver?.id === user?.id 
    ? delivery?.sender 
    : delivery?.assignedDriver;

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !chatPartner || !delivery) {
        console.warn('Missing message, chatPartner, or delivery');
        return;
      }

    try {
      await sendMessage({
        delivery: delivery.id,
        receiver: chatPartner.id,
        message: message.trim(),
      }).unwrap();
      
      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (createdAt: string) => {
    const messageDate = new Date(createdAt);
    
    if (isToday(messageDate)) {
      return format(messageDate, 'HH:mm');
    } else if (isYesterday(messageDate)) {
      return `Yesterday ${format(messageDate, 'HH:mm')}`;
    } else {
      return format(messageDate, 'MMM dd, HH:mm');
    }
  };

  const groupMessagesByDate = (messages: ChatMessage[]) => {
    const groups: { [key: string]: ChatMessage[] } = {};
    
    messages?.length>0? messages.forEach((msg) => {
        const date = format(new Date(msg.createdAt), 'yyyy-MM-dd');
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(msg);
      }): messages
    
    return groups;
  };

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    
    if (isToday(date)) {
      return 'Today';
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'EEEE, MMMM dd, yyyy');
    }
  };

  if (deliveryLoading || messagesLoading) {
    return <LoadingScreen message="Loading chat..." />;
  }

  if (!delivery || !chatPartner) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="error" gutterBottom>
          Chat not available
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          This delivery may not have an assigned driver yet or you don't have permission to access this chat.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/deliveries')}>
          Back to Deliveries
        </Button>
      </Box>
    );
  }

  const messageGroups = groupMessagesByDate(messages || []);

  return (
    <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate(`/deliveries/${delivery.id}`)}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          
          <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
            <Person />
          </Avatar>
          
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" fontWeight="bold">
              {chatPartner.firstName} {chatPartner.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {delivery.assignedDriver?.id === user?.id ? 'Sender' : 'Driver'}
            </Typography>
          </Box>

          <Chip
            label={delivery.status.replace('_', ' ')}
            color={delivery.status === 'delivered' ? 'success' : 'primary'}
            variant="outlined"
          />
        </Box>

        {/* Delivery Summary */}
        <Card variant="outlined">
          <CardContent sx={{ py: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocalShipping sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" fontWeight="medium">
                    {delivery.description}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {delivery.pickupSuburb} → {delivery.dropoffSuburb}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AttachMoney sx={{ mr: 1, color: 'success.main' }} />
                  <Typography variant="body2" fontWeight="bold" color="success.main">
                    ${delivery.finalPrice || delivery.budget}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Paper>

      {/* Messages */}
      <Paper sx={{ flexGrow: 1, p: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ flexGrow: 1, overflow: 'auto', mb: 2 }}>
          {Object.keys(messageGroups).length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                No messages yet. Start the conversation!
              </Typography>
            </Box>
          ) : (
            Object.entries(messageGroups).map(([dateString, dayMessages]) => (
              <Box key={dateString}>
                {/* Date Header */}
                <Box sx={{ textAlign: 'center', my: 2 }}>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      bgcolor: 'grey.100', 
                      px: 2, 
                      py: 0.5, 
                      borderRadius: 1,
                      color: 'text.secondary'
                    }}
                  >
                    {formatDateHeader(dateString)}
                  </Typography>
                </Box>

                {/* Messages for this date */}
                {dayMessages.map((msg) => {
                  const isMyMessage = msg.sender.id === user?.id;
                  
                  return (
                    <Box
                      key={msg.id}
                      sx={{
                        display: 'flex',
                        justifyContent: isMyMessage ? 'flex-end' : 'flex-start',
                        mb: 1,
                      }}
                    >
                      <Box
                        sx={{
                          maxWidth: '70%',
                          bgcolor: isMyMessage ? 'primary.main' : 'grey.100',
                          color: isMyMessage ? 'primary.contrastText' : 'text.primary',
                          px: 2,
                          py: 1,
                          borderRadius: 2,
                          borderBottomRightRadius: isMyMessage ? 0.5 : 2,
                          borderBottomLeftRadius: isMyMessage ? 2 : 0.5,
                        }}
                      >
                        <Typography variant="body2">
                          {msg.message}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            opacity: 0.7,
                            display: 'block',
                            textAlign: 'right',
                            mt: 0.5
                          }}
                        >
                          {formatMessageTime(msg.createdAt)}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            ))
          )}
          <div ref={messagesEndRef} />
        </Box>

        {/* Message Input */}
        {delivery.status !== 'delivered' && delivery.status !== 'cancelled' && (
          <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                multiline
                maxRows={3}
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={sendingMessage}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleSendMessage}
                        disabled={!message.trim() || sendingMessage}
                        color="primary"
                      >
                        <Send />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Press Enter to send, Shift+Enter for new line
            </Typography>
          </Box>
        )}

        {/* Chat Disabled Message */}
        {(delivery.status === 'delivered' || delivery.status === 'cancelled') && (
          <Box sx={{ textAlign: 'center', py: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {delivery.status === 'delivered' 
                ? 'This delivery has been completed. Chat is now read-only.'
                : 'This delivery has been cancelled. Chat is now read-only.'
              }
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default Chat;