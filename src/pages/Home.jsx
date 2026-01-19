import React from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import Sidebar from '../components/Sidebar/Sidebar';
import ChatBox from '../components/Chat/ChatBox';
import { useChat } from '../context/ChatContext';

const Home = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { selectedChat } = useChat();

  return (
    <Box sx={{ 
      display: 'flex', 
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      bgcolor: 'background.default',
      m: 0,
      p: 0
    }}>
      {/* Sidebar */}
      <Box 
        sx={{ 
          width: isMobile ? '100%' : 360,
          minWidth: isMobile ? '100%' : 360,
          maxWidth: isMobile ? '100%' : 360,
          borderRight: isMobile ? 0 : 1, 
          borderColor: 'divider', 
          bgcolor: 'background.paper',
          display: isMobile && selectedChat ? 'none' : 'flex',
          flexDirection: 'column',
          height: '100%'
        }}
      >
        <Sidebar />
      </Box>
      
      {/* ChatBox */}
      <Box 
        sx={{ 
          flex: 1,
          width: isMobile ? '100%' : 'calc(100% - 360px)',
          bgcolor: 'background.default',
          display: isMobile && !selectedChat ? 'none' : 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden'
        }}
      >
        <ChatBox />
      </Box>
    </Box>
  );
};

export default Home;
