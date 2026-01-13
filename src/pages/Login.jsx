import React, { useState } from 'react';
import { Box, Paper, TextField, Button, Typography, Stack } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';

const Login = () => {
  const navigate = useNavigate();
  const { setUser } = useChat();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const url = isRegister ? '/api/auth/register' : '/api/auth/login';
      const payload = isRegister ? { name, email, password } : { email, password };
      const { data } = await axios.post(url, payload);
      localStorage.setItem('userInfo', JSON.stringify(data));
      setUser(data);
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      px: 2 
    }}>
      <Paper sx={{ 
        p: { xs: 3, sm: 4 }, 
        width: { xs: '100%', sm: 400 },
        maxWidth: '100%'
      }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6">{isRegister ? 'Create account' : 'Sign in'}</Typography>
          <Button variant="text" onClick={() => setIsRegister(!isRegister)} size="small">
            {isRegister ? 'Use existing account' : 'Create account'}
          </Button>
        </Stack>
        <form onSubmit={handleSubmit}>
          {isRegister && (
            <TextField
              label="Name"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              sx={{ mb: 2 }}
              required
            />
          )}
          <TextField
            label="Email"
            type="email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 2 }}
            required
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 2 }}
            required
          />
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}
          <Button type="submit" variant="contained" color="primary" fullWidth disabled={loading}>
            {loading ? 'Submitting…' : (isRegister ? 'Create account' : 'Sign in')}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default Login;
