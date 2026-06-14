import { useMemo } from 'react';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';
import { Mesh, BufferGeometry, BufferAttribute } from 'three';

/**
 * Ground — white/grey plane with scattered rocks and grass
 */
export function Ground() {
  // Generate rock positions deterministically around monolith base
  const rocks = useMemo(() => {
    const positions = [];
    const scales = [];
    const rotations = [];

    // 5 rocks scattered around monolith (z=-3)
    const rockCount = 5;
    for (let i = 0; i < rockCount; i++) {
      const angle = (i / rockCount) * Math.PI * 2;
      const distance = 2.5 + Math.sin(i * 1.7) * 0.8; // vary distance
      const x = Math.cos(angle) * distance;
      const z = -3 + Math.sin(angle) * distance;
      const y = 0.3;
      const scale = 0.4 + (i % 3) * 0.15;
      const rotZ = Math.random() * Math.PI;

      positions.push([x, y, z]);
      scales.push(scale);
      rotations.push(rotZ);
    }

    return { positions, scales, rotations };
  }, []);

  return (
    <group>
      {/* Large white ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial
          color="#f0f0f0"
          roughness={0.6}
          metalness={0}
          flatShading={false}
        />
      </mesh>

      {/* Scattered rocks around monolith base */}
      {rocks.positions.map((pos, i) => (
        <group key={i} position={pos} rotation={[0, Math.random() * Math.PI * 2, rocks.rotations[i]]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[rocks.scales[i], rocks.scales[i] * 0.6, rocks.scales[i] * 0.8]} />
            <meshStandardMaterial color="#7a7a7a" roughness={0.9} metalness={0} />
          </mesh>
        </group>
      ))}

      {/* Sparse grass tufts — simple billboards */}
      {useMemo(
        () => (
          <group>
            {Array.from({ length: 20 }).map((_, i) => {
              const angle = (i / 20) * Math.PI * 2;
              const dist = 4 + (i % 3) * 2;
              const x = Math.cos(angle) * dist;
              const z = -3 + Math.sin(angle) * dist;

              return (
                <mesh key={i} position={[x, 0.05, z]} scale={[0.3, 0.6, 0.3]}>
                  <boxGeometry args={[0.1, 1, 0.1]} />
                  <meshStandardMaterial color="#3a4a2a" roughness={0.8} />
                </mesh>
              );
            })}
          </group>
        ),
        [],
      )}
    </group>
  );
}
