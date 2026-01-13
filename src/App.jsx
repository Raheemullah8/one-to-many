import React, { useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ChatProvider, useChat } from './context/ChatContext';
import Login from './pages/Login';
import Home from './pages/Home';

function AppRoutes() {
  const { user } = useChat();

  return (
    <Router>
      <Routes>
        <Route path="/" element={user ? <Home /> : <Navigate to="/login" />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

function ThemedApp() {
  const { themeMode } = useChat();

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: themeMode,
          primary: {
            main: '#128C7E',
          },
          secondary: {
            main: '#25D366',
          },
          ...(themeMode === 'dark' && {
            background: {
              default: '#0d1418',
              paper: '#1c2c33',
            },
          }),
        },
      }),
    [themeMode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppRoutes />
    </ThemeProvider>
  );
}

function App() {
  return (
    <ChatProvider>
      <ThemedApp />
    </ChatProvider>
  );
}

export default App;