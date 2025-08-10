import React, { useState, useRef, useEffect } from 'react';
import { Card, TextField, Tooltip, CircularProgress, Alert, Slide } from '@mui/material';
import { motion } from 'framer-motion';
import { ShadcnButton } from '../components/ui/button';

const COLLEGE_COORDS = { lat: 17.123456, lng: 78.123456, radius: 0.5 }; // ~500m radius
const COLLEGE_HOURS = { start: 9, end: 17 };

const MarkAttendance = () => {
  const [form, setForm] = useState({
    rollNumber: '',
    faceData: '',
    fingerprintData: '',
    ssid: '',
    mac: '',
    latitude: '',
    longitude: ''
  });
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [canTakePhoto, setCanTakePhoto] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
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

  // SSID & MAC (simulate)
  useEffect(() => {
    setForm((f) => ({ ...f, ssid: 'CollegeWiFi', mac: '00:1A:2B:3C:4D:5E' }));
  }, []);

  // Camera
  const handleFaceCapture = async () => {
    setError('');
    setShowCamera(true);
    setCanTakePhoto(false);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current && videoRef.current.play();
          };
        }
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
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        setForm((f) => ({ ...f, faceData: dataUrl.split(',')[1] }));
        setError('Photo captured! You can retake or close the camera.');
      }
    }
  };

  const handleCloseCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach((track: MediaStreamTrack) => track.stop());
    }
    setShowCamera(false);
  };

  // Fingerprint (simulate)
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
            name: form.rollNumber || "user",
            displayName: form.rollNumber || "User"
          },
          pubKeyCredParams: [{ type: 'public-key' as const, alg: -7 }],
          authenticatorSelection: { authenticatorAttachment: "platform" as const, userVerification: "required" as const },
          timeout: 60000,
          attestation: "none" as const
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

  // Validation
  const isWithinCollegeHours = () => {
    const now = new Date();
    const hour = now.getHours();
    return hour >= COLLEGE_HOURS.start && hour < COLLEGE_HOURS.end;
  };
  const isOnCampus = () => {
    const lat = parseFloat(form.latitude);
    const lng = parseFloat(form.longitude);
    const dist = Math.sqrt(
      Math.pow(lat - COLLEGE_COORDS.lat, 2) + Math.pow(lng - COLLEGE_COORDS.lng, 2)
    );
    return dist < COLLEGE_COORDS.radius;
  };

  const validateForm = () => {
    if (!form.rollNumber) return 'Please enter your roll number.';
    if (!form.faceData) return 'Please capture your face.';
    if (!form.fingerprintData) return 'Please capture your fingerprint.';
    if (!form.ssid) return 'SSID not detected.';
    if (!form.mac) return 'MAC address not detected.';
    // if (!isWithinCollegeHours()) return 'Attendance can only be marked during college hours (9 AM - 5 PM).';
    // if (!isOnCampus()) return 'You must be on campus to mark attendance.';
    return '';
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/attendance/mark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'faculty'
        },
        body: JSON.stringify({
          rollNumber: form.rollNumber,
          faceData: form.faceData,
          fingerprintData: form.fingerprintData,
          ssid: form.ssid,
          mac: form.mac,
          latitude: parseFloat(form.latitude),
          longitude: parseFloat(form.longitude)
        })
      });
      const data = await res.json();
      if (data.message) {
        setSuccess(data.message);
      } else {
        setError(data.message || 'Failed to mark attendance');
      }
    } catch {
      setError('Network error');
    }
    setLoading(false);
  };

  // Animated background (rotating shape)
  useEffect(() => {
    const shape = document.getElementById('rotating-shape');
    let angle = 0;
    let frameId: number;
    const animate = () => {
      if (shape) {
        angle += 0.5;
        shape.style.transform = `rotate(${angle}deg)`;
      }
      frameId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e0f7fa 0%, #fff 100%)',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Rotating geometric shape */}
      <div id="rotating-shape" style={{
        position: 'absolute',
        top: '10%',
        right: '10%',
        width: 80,
        height: 80,
        borderRadius: '20%',
        background: 'rgba(44, 62, 80, 0.08)',
        boxShadow: '0 4px 24px rgba(44,62,80,0.12)',
        zIndex: 0
      }} />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 80 }}
        whileHover={{ y: -4, boxShadow: '0 8px 32px rgba(44,62,80,0.18)' }}
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
              transform: 'translateY(-4px)'
            }
          }}
        >
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Tooltip title="Enter your roll number" arrow TransitionComponent={Slide}>
              <TextField
                label="Roll Number"
                name="rollNumber"
                value={form.rollNumber}
                onChange={e => setForm(f => ({ ...f, rollNumber: e.target.value }))}
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
            <Tooltip title="Capture Face" arrow>
              <span>
                <ShadcnButton
                  type="button"
                  onClick={handleFaceCapture}
                  style={{
                    transform: 'scale(1)',
                    transition: 'transform 0.2s',
                    marginBottom: 4
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  {form.faceData ? 'Face Captured' : 'Capture Face'}
                </ShadcnButton>
              </span>
            </Tooltip>
            <Tooltip title="Capture Fingerprint" arrow>
              <span>
                <ShadcnButton
                  type="button"
                  onClick={handleFingerprintCapture}
                  style={{
                    transform: 'scale(1)',
                    transition: 'transform 0.2s',
                    marginBottom: 4
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  {form.fingerprintData ? 'Fingerprint Captured' : 'Capture Fingerprint'}
                </ShadcnButton>
              </span>
            </Tooltip>
            <Tooltip title="Auto-detected WiFi SSID" arrow>
              <TextField
                label="SSID"
                name="ssid"
                value={form.ssid}
                disabled
                variant="outlined"
                fullWidth
              />
            </Tooltip>
            <Tooltip title="Auto-detected MAC Address" arrow>
              <TextField
                label="MAC Address"
                name="mac"
                value={form.mac}
                disabled
                variant="outlined"
                fullWidth
              />
            </Tooltip>
            {geoLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CircularProgress size={20} />
                <span>Detecting location...</span>
              </div>
            ) : null}
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
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              disabled={loading || geoLoading}
            >
              {loading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Mark Attendance'}
            </ShadcnButton>
            <Slide direction="up" in={!!error || !!success} mountOnEnter unmountOnExit>
              <Alert severity={error ? 'error' : 'success'} sx={{ mt: 2 }}>
                {error || success}
              </Alert>
            </Slide>
            {/* Error logs for debugging */}
            {error && (
              <pre style={{ color: 'red', marginTop: '1rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.95em', background: '#fff0f0', padding: '0.5rem', borderRadius: '4px' }}>
                {error}
              </pre>
            )}
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

export default MarkAttendance;
