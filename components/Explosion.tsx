
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group, Mesh } from 'three';
import '../types';

interface ExplosionProps {
  position: [number, number, number];
}

export const Explosion: React.FC<ExplosionProps> = ({ position }) => {
  const groupRef = useRef<Group>(null);
  const particlesRef = useRef<Mesh[]>([]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Expand and fade particles
    groupRef.current.children.forEach((child, i) => {
      const mesh = child as Mesh;
      // Move outward
      const speed = 5 + (i % 5);
      const dir = new Vector3(
        Math.sin(i * 132.1),
        Math.cos(i * 23.1),
        Math.sin(i * 41.2)
      ).normalize();
      
      mesh.position.addScaledVector(dir, speed * delta);
      
      // Rotate debris
      mesh.rotation.x += delta * 2;
      mesh.rotation.z += delta * 2;

      // Shrink/Fade
      if (mesh.scale.x > 0) {
        const shrink = delta * 0.8;
        mesh.scale.subScalar(shrink);
        if (mesh.scale.x < 0) mesh.scale.set(0,0,0);
      }
    });
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Fireball Center */}
      {[...Array(5)].map((_, i) => (
        <mesh key={`fire-${i}`} position={[0, 0, 0]}>
          <sphereGeometry args={[1 + Math.random(), 8, 8]} />
          <meshStandardMaterial color="orange" emissive="red" emissiveIntensity={2} />
        </mesh>
      ))}
      
      {/* Debris */}
      {[...Array(20)].map((_, i) => (
        <mesh key={`debris-${i}`} position={[0, 0, 0]}>
          <boxGeometry args={[0.3 + Math.random()*0.5, 0.3, 0.3]} />
          <meshStandardMaterial color={i % 2 === 0 ? '#333' : '#ef4444'} />
        </mesh>
      ))}
      
      {/* Smoke Puff */}
      <mesh position={[0, 2, 0]}>
         <dodecahedronGeometry args={[2, 0]} />
         <meshStandardMaterial color="#555" transparent opacity={0.6} />
      </mesh>
    </group>
  );
};
