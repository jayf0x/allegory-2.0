export function Monolith() {
  return (
    <mesh position={[0, 2, -3]} castShadow receiveShadow>
      <boxGeometry args={[1.2, 4.0, 0.6]} />
      <meshStandardMaterial color="#0a0a0a" roughness={0.9} metalness={0.0} />
    </mesh>
  );
}
