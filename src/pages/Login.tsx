import React, { useState } from 'react';
import { Card, TextField, CircularProgress, Alert, Tooltip } from '@mui/material';
import { Button } from '@mui/material'; // Use MUI Button if custom Button is unavailable
import { motion } from 'framer-motion';
import './Login.css'; // Optional CSS for custom styles

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
  const response = await fetch('http://localhost:5000/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (data.status === 'error') {
        setError(data.message);
      } else {
        // Handle successful login (e.g., store token, redirect)
        console.log(data.message, data.user);
      }
    } catch (err) {
      setError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e3f2fd, #f5f5f5)' }}
    >
      <Card
        sx={{
          maxWidth: 400,
          padding: 3,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          transition: 'transform 0.2s',
          '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 6px 16px rgba(0,0,0,0.15)' },
        }}
      >
        <form onSubmit={handleSubmit}>
          <Tooltip title="Enter your registered email">
            <TextField
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              margin="normal"
              variant="outlined"
              sx={{ '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#1976d2' } }}
            />
          </Tooltip>
          <Tooltip title="Enter your password">
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              margin="normal"
              variant="outlined"
              sx={{ '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#1976d2' } }}
            />
          </Tooltip>
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
              <Alert severity="error">{error}</Alert>
            </motion.div>
          )}
          <Button
            type="submit"
            disabled={loading}
            variant="contained"
            style={{
              background: 'linear-gradient(90deg, #1976d2, #42a5f5)',
              color: '#fff',
              marginTop: '16px',
              transition: 'transform 0.2s',
            }}
            className="hover:scale-105"
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
          </Button>
        </form>
      </Card>
    </motion.div>
  );
};

export default Login;