
import React from 'react';
import '../types';

export const Hangar = ({ position }: { position: [number, number, number] }) => (
  <group position={position}>
    <mesh castShadow position={[0, 4, 0]} rotation={[0, 0, Math.PI/2]}>
      <cylinderGeometry args={[10, 10, 20, 32, 1, false, 0, Math.PI]} />
      <meshStandardMaterial color="#cbd5e1" side={2} />
    </mesh>
    <mesh position={[0, 2, 0]}>
      <boxGeometry args={[20, 4, 20]} />
      <meshStandardMaterial color="#94a3b8" />
    </mesh>
  </group>
);
