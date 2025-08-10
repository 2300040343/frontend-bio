

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import Login from './pages/Login';
import Register from './pages/Register';
const MarkAttendance = lazy(() => import('./pages/MarkAttendance'));
import './Login.css';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <nav style={{ display: 'flex', gap: '1rem', justifyContent: 'center', margin: '2rem 0' }}>
        <Link to="/login">Login</Link>
        <Link to="/register">Register</Link>
        <Link to="/attendance">Mark Attendance</Link>
      </nav>
      <Suspense fallback={<div style={{textAlign:'center',marginTop:'2rem'}}><CircularProgress /></div>}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/attendance" element={<MarkAttendance />} />
          <Route path="*" element={<Login />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </React.StrictMode>
);