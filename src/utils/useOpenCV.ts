// This file loads OpenCV.js from CDN and provides a hook to check if it's ready
import { useEffect, useState } from 'react';

export function useOpenCV() {
  const [cvReady, setCvReady] = useState(false);

  useEffect(() => {
    if (window.cv) {
      setCvReady(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://docs.opencv.org/4.x/opencv.js';
    script.async = true;
    script.onload = () => {
      // Wait for cv['onRuntimeInitialized']
      window.cv['onRuntimeInitialized'] = () => setCvReady(true);
    };
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return cvReady;
}
