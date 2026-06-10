import { Suspense } from 'react';
import { PerformanceMonitor, StatsGl } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { SceneLoader } from '@/components/SceneLoader';
import { Scene } from '@/scene';
import { initialCameraPos } from './config';

export const App = () => {
  return (
    <>
      <Canvas
        shadows
        camera={initialCameraPos}
        style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh' }}
      >
        <Suspense fallback={null}>
          <StatsGl />
          <PerformanceMonitor>
            <Scene />
          </PerformanceMonitor>
        </Suspense>
      </Canvas>

      <SceneLoader />
    </>
  );
};
