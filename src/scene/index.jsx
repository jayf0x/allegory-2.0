import { Preload } from '@react-three/drei';
import { Lighting } from './Lighting';
import { Monolith } from './Monolith';
import { Ground } from './Ground';
import { CameraUserControls } from './components/CameraUserControls';

export const Scene = () => {
  return (
    <>
      {/* Dark void — the monolith's screen is the light source */}
      <color attach="background" args={['#030305']} />

      <CameraUserControls />
      <Lighting />
      <Monolith />
      <Ground />

      <Preload all />
    </>
  );
};
