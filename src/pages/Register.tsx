import React, { useState, useRef, useEffect } from 'react';
// Type imports for WebAuthn
type AttestationConveyancePreference = "none" | "indirect" | "direct" | "enterprise";
type AuthenticatorAttachment = "platform" | "cross-platform";
type UserVerificationRequirement = "required" | "preferred" | "discouraged";
import {
  Card,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Tooltip,
  CircularProgress,
  Alert,
  Fade,
  Slide,
  Button as MUIButton
} from '@mui/material';
import { motion } from 'framer-motion';
import { ShadcnButton } from '../components/ui/button';
import Wave from 'react-wavify';

const DEPARTMENTS = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL','AIDS'];

const Register: React.FC = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    department: '',
    rollNumber: '',
    faceData: '',
    fingerprintData: '',
    ssid: '',
    macAddress: '',
    latitude: '',
    longitude: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [emailInvalid, setEmailInvalid] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [canTakePhoto, setCanTakePhoto] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);


  // Geolocation
  useEffect(() => {
    setGeoLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setForm((f) => ({
            ...f,
            latitude: pos.coords.latitude.toString(),
            longitude: pos.coords.longitude.toString()
          }));
          setGeoLoading(false);
        },
        () => setGeoLoading(false)
      );
    } else {
      setGeoLoading(false);
    }
  }, []);

  // Cordova/Capacitor plugin integration for SSID & MAC (mobile only)
  useEffect(() => {
    const setNetworkInfo = async () => {
      // @ts-ignore
      if (window.Capacitor) {
        try {
          // Example: Use capacitor-network plugin
          // import { Network } from '@capacitor/network';
          // const status = await Network.getStatus();
          // setForm((f) => ({ ...f, ssid: status.ssid || 'CollegeWiFi', macAddress: status.macAddress || '00:1A:2B:3C:4D:5E' }));
          // For Cordova, use cordova-plugin-wifiinfo
          // window.WifiInfo.getSSID((ssid) => setForm((f) => ({ ...f, ssid })), () => {});
          // window.WifiInfo.getMacAddress((mac) => setForm((f) => ({ ...f, macAddress: mac })), () => {});
          // Fallback if plugin not available
          setForm((f) => ({ ...f, ssid: 'CollegeWiFi', macAddress: '00:1A:2B:3C:4D:5E' }));
        } catch {
          setForm((f) => ({ ...f, ssid: 'CollegeWiFi', macAddress: '00:1A:2B:3C:4D:5E' }));
        }
      } else {
        setForm((f) => ({ ...f, ssid: 'CollegeWiFi', macAddress: '00:1A:2B:3C:4D:5E' }));
      }
    };
    setNetworkInfo();
  }, []);

  // Email validation
  const validateEmail = (email: string) => {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  };

  // Animations
  const shakeAnim = emailInvalid ? {
    animate: { x: [0, -10, 10, -10, 10, 0] },
    transition: { duration: 0.4 }
  } : {};

  // Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name!]: value }));
    if (name === 'email') {
      setEmailInvalid(!validateEmail(value as string));
    }
  };

  const handleFaceCapture = async () => {
    setError('');
    setShowCamera(true);
    setCanTakePhoto(false);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        // Request highest available resolution for best quality
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1920, max: 1920 },
            height: { ideal: 1080, max: 1080 },
            facingMode: 'user'
          }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        // Wait longer for camera to stabilize (e.g., 2 seconds)
        setTimeout(() => setCanTakePhoto(true), 2000);
      } catch (err) {
        setError('Unable to access camera.');
        setShowCamera(false);
      }
    } else {
      setError('Camera not supported on this device.');
      setShowCamera(false);
    }
  };

  const handleTakePhoto = () => {
    if (videoRef.current && canvasRef.current && canTakePhoto) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        setForm((f) => ({ ...f, faceData: dataUrl.split(',')[1] }));
        // Instead of disabling the button, keep it enabled for retakes
        setError('Photo captured! You can retake or close the camera.');
      }
    }
  };

  const handleCloseCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const handleFingerprintCapture = async () => {
    if (window.PublicKeyCredential) {
      try {
        // Create a random challenge
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        // Create credential options
        const publicKey = {
          challenge: challenge,
          rp: { name: "BioApp" },
          user: {
            id: new Uint8Array(16),
            name: form.email || "user",
            displayName: form.name || "User"
          },
          pubKeyCredParams: [{ type: 'public-key' as const, alg: -7 }],
          authenticatorSelection: { authenticatorAttachment: "platform" as AuthenticatorAttachment, userVerification: "required" as UserVerificationRequirement },
          timeout: 60000,
          attestation: "none" as AttestationConveyancePreference
        };

        // Prompt for fingerprint/biometric
        const credential = await navigator.credentials.create({ publicKey });
        if (credential) {
          setForm((f) => ({ ...f, fingerprintData: btoa("fingerprint_verified") }));
          setError("");
        } else {
          setError("Fingerprint not verified.");
        }
      } catch (err) {
        setError("Fingerprint authentication failed or was cancelled.");
      }
    } else {
      setError("Fingerprint/WebAuthn not supported in this browser.");
    }
  };

  const validateForm = () => {
    // Check all required fields
    for (const key of ['name', 'email', 'password', 'department', 'rollNumber', 'faceData', 'fingerprintData', 'ssid', 'macAddress']) {
      if (!form[key as keyof typeof form] || String(form[key as keyof typeof form]).trim() === '') {
        setError(`Please fill the ${key} field.`);
        return false;
      }
    }
    // Email format
    if (!validateEmail(form.email)) {
      setError('Please enter a valid email address.');
      return false;
    }
    // SSID check
    if (form.ssid !== 'CollegeWiFi') {
      setError('You must be connected to the allowed campus WiFi.');
      return false;
    }
    // MAC address format
    const macRegex = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/;
    if (!macRegex.test(form.macAddress)) {
      setError('MAC address format is invalid.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!validateForm()) return;
    setLoading(true);
    try {
      // Use hardcoded API base URL if .env is not set
      const apiBase = process.env.REACT_APP_BASE_URL || 'https://jmgbqbmh-5000.inc1.devtunnels.ms/users';
      const res = await fetch(`${apiBase}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          department: form.department,
          rollNumber: form.rollNumber,
          faceData: form.faceData,
          fingerprintData: form.fingerprintData,
          ssid: form.ssid,
          macAddress: form.macAddress,
          latitude: form.latitude,
          longitude: form.longitude
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setSuccess('Registration successful!');
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch {
      setError('Network error');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Wave Animation */}
      <Wave
        fill="#c3cfe2"
        paused={false}
        options={{ height: 20, amplitude: 20, speed: 0.2, points: 3 }}
        style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', zIndex: 0 }}
      />
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 80 }}
        whileHover={{ y: -3, boxShadow: '0 8px 32px rgba(44,62,80,0.18)' }}
        style={{ zIndex: 1 }}
      >
        <Card
          sx={{
            minWidth: { xs: '90vw', sm: 400 },
            maxWidth: 420,
            mx: 'auto',
            boxShadow: 3,
            borderRadius: 3,
            p: 3,
            transition: 'box-shadow 0.3s, transform 0.3s',
            '&:hover': {
              boxShadow: 6,
              transform: 'translateY(-3px)'
            }
          }}
        >
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Name */}
            <Tooltip title="Enter your full name" arrow>
              <TextField
                label="Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                variant="outlined"
                fullWidth
                sx={{
                  transition: 'border-color 0.3s',
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'blue' },
                  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'blue' }
                }}
              />
            </Tooltip>
            {/* Email */}
            <Tooltip title="Enter your college email" arrow>
              <motion.div {...shakeAnim}>
                <TextField
                  label="Email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  variant="outlined"
                  fullWidth
                  error={emailInvalid}
                  helperText={emailInvalid ? 'Invalid email address' : ''}
                />
              </motion.div>
            </Tooltip>
            {/* Password */}
            <Tooltip title="Choose a strong password" arrow>
              <TextField
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                required
                variant="outlined"
                fullWidth
                InputProps={{
                  endAdornment: (
                    <MUIButton
                      onClick={() => setShowPassword((v) => !v)}
                      size="small"
                      sx={{ transition: 'color 0.3s', color: showPassword ? 'teal' : 'gray' }}
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </MUIButton>
                  )
                }}
                sx={{
                  transition: 'border-color 0.3s',
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'teal' },
                  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'teal' }
                }}
              />
            </Tooltip>
            {/* Department */}
            <Tooltip title="Select your department" arrow>
              <FormControl fullWidth required>
                <InputLabel>Department</InputLabel>
                <Select
                  name="department"
                  value={form.department}
                  onChange={(e) => handleChange({ target: { name: 'department', value: e.target.value } } as React.ChangeEvent<{ name?: string; value: unknown }>)}
                  label="Department"
                  MenuProps={{
                    TransitionComponent: Fade
                  }}
                  sx={{
                    '& .MuiMenuItem-root:hover': { background: '#e0f7fa' }
                  }}
                >
                  {DEPARTMENTS.map((dept) => (
                    <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Tooltip>
            {/* Roll Number */}
            <Tooltip title="Enter your roll number" arrow>
              <TextField
                label="Roll Number"
                name="rollNumber"
                value={form.rollNumber}
                onChange={handleChange}
                required
                variant="outlined"
                fullWidth
                sx={{
                  transition: 'border-width 0.3s',
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderWidth: 2 }
                }}
              />
            </Tooltip>
            {/* Face Data */}
            <Tooltip title="Capture Face" arrow>
              <ShadcnButton
                type="button"
                onClick={handleFaceCapture}
                style={{
                  transform: 'scale(1)',
                  transition: 'transform 0.2s',
                  marginBottom: 4
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.transform = 'scale(1.07)')}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {form.faceData ? 'Face Captured' : 'Capture Face'}
              </ShadcnButton>
            </Tooltip>
            {/* Fingerprint Data */}
            <Tooltip title="Capture Fingerprint" arrow>
              <ShadcnButton
                type="button"
                onClick={handleFingerprintCapture}
                style={{
                  transform: 'scale(1)',
                  transition: 'transform 0.2s',
                  marginBottom: 4
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.transform = 'scale(1.07)')}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {form.fingerprintData ? 'Fingerprint Captured' : 'Capture Fingerprint'}
              </ShadcnButton>
            </Tooltip>
            {/* SSID */}
            <Tooltip title="Auto-detected SSID" arrow>
              <TextField
                label="SSID"
                name="ssid"
                value={form.ssid}
                disabled
                variant="outlined"
                fullWidth
              />
            </Tooltip>
            {/* MAC Address */}
            <Tooltip title="Auto-detected MAC Address" arrow>
              <TextField
                label="MAC Address"
                name="macAddress"
                value={form.macAddress}
                disabled
                variant="outlined"
                fullWidth
              />
            </Tooltip>
            {/* Location (hidden) */}
            {geoLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CircularProgress size={20} />
                <span>Detecting location...</span>
              </div>
            ) : null}
            {/* Submit Button */}
            <ShadcnButton
              type="submit"
              style={{
                background: 'linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)',
                color: '#fff',
                fontWeight: 600,
                fontSize: 16,
                padding: '10px 0',
                marginTop: 8,
                boxShadow: '0 2px 8px rgba(44,62,80,0.08)',
                borderRadius: 8,
                transition: 'transform 0.2s',
                transform: 'scale(1)'
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.transform = 'scale(1)')}
              disabled={loading || geoLoading}
            >
              {loading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Register'}
            </ShadcnButton>
            {/* Error/Success Message */}
            <Slide direction="up" in={!!error || !!success} mountOnEnter unmountOnExit>
              <Alert severity={error ? 'error' : 'success'} sx={{ mt: 2 }}>
                {error || success}
              </Alert>
            </Slide>
          </form>
          {/* Video Camera for Face Capture */}
          {showCamera && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(0,0,0,0.7)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column'
            }}>
              <video ref={videoRef} style={{ width: 320, height: 240, borderRadius: 8 }} autoPlay playsInline />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              <div style={{ marginTop: 16 }}>
                <ShadcnButton onClick={handleTakePhoto} style={{ marginRight: 8 }} disabled={!canTakePhoto}>
                  {canTakePhoto ? (form.faceData ? 'Retake Photo' : 'Take Photo') : 'Stabilizing...'}
                </ShadcnButton>
                <ShadcnButton onClick={handleCloseCamera} color="error">Close</ShadcnButton>
                {form.faceData && (
                  <div style={{ color: '#fff', marginTop: 8 }}>Photo captured! You can retake or close the camera.</div>
                )}
              </div>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default Register;

export {};