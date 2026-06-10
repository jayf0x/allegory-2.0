import { useEffect, useRef } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useApp } from '@/hooks/useApp';

// Azimuth = horizontal (left/right), polar = vertical (up/down)
// All angles in radians. Adjust these to taste.
const CAM_LIMITS = {
  minAzimuthAngle: -Math.PI / 10, // ~18° left
  maxAzimuthAngle: Math.PI / 10, // ~18° right
  minPolarAngle: Math.PI / 2 - 1.18, // ~10° up from horizon
  maxPolarAngle: Math.PI / 2 + 0.1, // ~6° down from horizon
};

export const CameraUserControls = () => {
  const { camera } = useThree();
  const controlsRef = useRef();
  const { isDevMode } = useApp();

  useEffect(() => {
    if (!isDevMode) return;
    window.camera = camera;
    window.controls = controlsRef.current;

    const onKey = (e) => {
      if (e.key === 'p') {
        console.log('camera position', camera.position.toArray());
        console.log('controls target', controlsRef.current.target.toArray());
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [camera, isDevMode]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={isDevMode}
      enableZoom={isDevMode}
      rotateSpeed={isDevMode ? undefined : 0.1}
      {...(isDevMode ? {} : CAM_LIMITS)}
    />
  );
};
