import { folder, useControls } from 'leva';
import { SCENE_CONFIG as C } from '@/scene/config.js';
import { Fire } from './Fire';

export const Lighting = () => {
  const { ambientIntensity } = useControls({
    Atmosphere: folder({
      ambientIntensity: {
        value: C.ambientIntensity,
        min: 0,
        max: 2,
        step: 0.01,
      },
    }),
  });

  return (
    <>
      <ambientLight intensity={ambientIntensity} color="#fff5e0" />
      <Fire />
    </>
  );
};
