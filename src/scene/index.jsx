import { Preload } from '@react-three/drei';
import { Lighting } from './Lighting';
import { Monolith } from './Monolith';
import { CameraUserControls } from './components/CameraUserControls';

// ProjectedSurface — kept for future use, not active
// import { ProjectedSurface } from './ProjectedSurface';

export const Scene = () => {
  return (
    <>
      <color attach="background" args={['#ffffff']} />

      <CameraUserControls />
      <Lighting />
      <Monolith />

      {/* White void floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#f0f0f0" roughness={0.8} metalness={0} />
      </mesh>

      <Preload all />
    </>
  );
};
