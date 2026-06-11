import { Preload } from '@react-three/drei';
import { Lighting } from './Lighting';
import { Monolith } from './Monolith';
import { CameraUserControls } from './components/CameraUserControls';

export const Scene = () => {
  return (
    <>
      {/* Dark void — the monolith's screen is the light source */}
      <color attach="background" args={['#030305']} />

      <CameraUserControls />
      <Lighting />
      <Monolith />

      {/* Floor catches the light pool spilling from the screen */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#0b0b0e" roughness={0.35} metalness={0} />
      </mesh>

      <Preload all />
    </>
  );
};
