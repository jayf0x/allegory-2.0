import { SCENE_CONFIG as C } from '@/scene/config';
import { ProjectedSurface } from '../ProjectedSurface';

export function Monolith() {
  const { monolithWidth: w, monolithHeight: h, monolithDepth: d } = C;

  return (
    <group position={[0, h / 2, -3]}>
      {/* Obsidian slab — polished, near-black, clearcoated */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshPhysicalMaterial
          color="#050506"
          roughness={0.16}
          metalness={0.25}
          clearcoat={1}
          clearcoatRoughness={0.08}
        />
      </mesh>

      {/* Video glowing from within the front face */}
      <ProjectedSurface width={w} height={h} depth={d} />
    </group>
  );
}
