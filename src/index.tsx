import React from 'react';
import ReactDOM from 'react-dom/client';
import Login from './pages/Login'; // <-- Make sure this is Login, not Register
import './Login.css';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <Login /> {/* <-- Render Login, not Register */}
  </React.StrictMode>
);