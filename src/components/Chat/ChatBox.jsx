import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Avatar,
  TextField,
  IconButton,
  Paper,
  Tooltip,
  CircularProgress,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import { useChat } from '../../context/ChatContext';
import axios from 'axios';
import EmojiPicker from 'emoji-picker-react';
import moment from 'moment';

const ChatBox = () => {
  const {
    selectedChat,
    setSelectedChat,
    messages,
    setMessages,
    user,
    socket,
    sendMessage,
  } = useChat();
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const handleBackToChats = () => {
    setSelectedChat(null);
  };

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChat) return;
      
      setLoading(true);
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };
        
        const { data } = await axios.get(
          `/api/chat/message/${selectedChat._id}`,
          config
        );
        
        setMessages(data);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMessages();
  }, [selectedChat, setMessages, user?.token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    await sendMessage(newMessage, selectedChat._id);
    setNewMessage('');
    setShowEmojiPicker(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
    
    // Typing indicator
    if (!typing) {
      setTyping(true);
      socket.emit('typing', {
        chatId: selectedChat._id,
        userId: user._id,
        receiverId: selectedChat.users.find(u => u._id !== user._id)?._id
      });
    }
    
    const lastTypingTime = new Date().getTime();
    const timerLength = 3000;
    
    setTimeout(() => {
      const timeNow = new Date().getTime();
      const timeDiff = timeNow - lastTypingTime;
      
      if (timeDiff >= timerLength && typing) {
        setTyping(false);
      }
    }, timerLength);
  };

  const handleEmojiClick = (emojiObject) => {
    setNewMessage(prev => prev + emojiObject.emoji);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'chat_app');

    try {
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
        formData
      );

      const fileUrl = response.data.secure_url;
      const messageType = file.type.startsWith('image/') ? 'image' : 
                         file.type.startsWith('video/') ? 'video' : 'document';
      
      await sendMessage('', selectedChat._id, messageType, fileUrl);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  if (!selectedChat) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Typography variant="h6" color="textSecondary">
          Select a chat to start messaging
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Chat Header */}
      <Paper sx={{ p: 2, borderRadius: 0, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {isMobile && (
            <IconButton onClick={handleBackToChats} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
          )}
          <Avatar
            src={selectedChat.isGroupChat ? selectedChat.groupImage : selectedChat.users.find(u => u._id !== user._id)?.profilePicture}
            sx={{ mr: 2 }}
          >
            {selectedChat.chatName.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="h6">
              {selectedChat.isGroupChat 
                ? selectedChat.chatName
                : selectedChat.users.find(u => u._id !== user._id)?.name
              }
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {isTyping ? 'typing...' : 'online'}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Messages Area */}
      <Box sx={{ 
        flexGrow: 1, 
        overflow: 'auto', 
        p: 2, 
        bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0d1418' : '#f0f0f0'
      }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          messages.map((message) => (
            <Box
              key={message._id}
              sx={{
                display: 'flex',
                justifyContent: message.sender._id === user._id ? 'flex-end' : 'flex-start',
                mb: 2,
              }}
            >
              {message.sender._id !== user._id && (
                <Avatar
                  src={message.sender.profilePicture}
                  sx={{ mr: 1, alignSelf: 'flex-end' }}
                  size="small"
                />
              )}
              <Box>
                <Paper
                  sx={{
                    p: 1.5,
                    maxWidth: isMobile ? '85%' : '70%',
                    bgcolor: message.sender._id === user._id ? '#DCF8C6' : 'white',
                    borderRadius: message.sender._id === user._id 
                      ? '18px 18px 0 18px'
                      : '18px 18px 18px 0',
                    boxShadow: 1,
                  }}
                >
                  {message.messageType === 'image' ? (
                    <img
                      src={message.fileUrl}
                      alt="message"
                      style={{ maxWidth: isMobile ? '200px' : '300px', width: '100%', borderRadius: '10px' }}
                    />
                  ) : message.messageType === 'video' ? (
                    <video controls style={{ maxWidth: isMobile ? '200px' : '300px', width: '100%' }}>
                      <source src={message.fileUrl} type="video/mp4" />
                    </video>
                  ) : (
                    <Typography variant="body1" sx={{ color: '#000', wordBreak: 'break-word' }}>
                      {message.content}
                    </Typography>
                  )}
                </Paper>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    textAlign: message.sender._id === user._id ? 'right' : 'left',
                    mt: 0.5,
                    color: 'text.secondary',
                  }}
                >
                  {moment(message.createdAt).format('hh:mm A')}
                </Typography>
              </Box>
            </Box>
          ))
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <Box sx={{ position: 'absolute', bottom: 60, right: 20, zIndex: 1000 }}>
          <Box sx={{ position: 'relative' }}>
            <IconButton
              onClick={() => setShowEmojiPicker(false)}
              sx={{
                position: 'absolute',
                top: -10,
                right: -10,
                bgcolor: 'background.paper',
                boxShadow: 2,
                zIndex: 1001,
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
              size="small"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </Box>
        </Box>
      )}

      {/* Message Input */}
      <Paper sx={{ p: 2, borderRadius: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="Add Emoji">
            <IconButton onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
              <EmojiEmotionsIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Attach File">
            <IconButton component="label">
              <AttachFileIcon />
              <input
                type="file"
                hidden
                onChange={handleFileUpload}
                accept="image/*,video/*,.pdf,.doc,.docx"
              />
            </IconButton>
          </Tooltip>

          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Type a message"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            variant="outlined"
            size="small"
            sx={{ mx: 1 }}
          />

          <IconButton 
            color="primary" 
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Paper>
    </Box>
  );
};

export default ChatBox;
