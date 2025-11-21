
import React from 'react';
import { Euler } from 'three';
import '../types';

export const ParkedPlane = ({ position, rotation, color = "#ef4444" }: { position: [number, number, number], rotation?: [number, number, number], color?: string }) => (
  <group position={position} rotation={rotation ? new Euler(...rotation) : new Euler(0,0,0)}>
    <mesh castShadow position={[0, 0.5, 0]}>
      <boxGeometry args={[0.5, 0.5, 2]} />
      <meshStandardMaterial color={color} />
    </mesh>
    <mesh castShadow position={[0, 0.9, -0.2]}>
      <boxGeometry args={[3.5, 0.1, 0.6]} />
      <meshStandardMaterial color="white" />
    </mesh>
    <mesh castShadow position={[0, 1.0, 1.6]}>
      <boxGeometry args={[1.2, 0.05, 0.4]} />
      <meshStandardMaterial color="white" />
    </mesh>
    <mesh castShadow position={[0, 1.2, 1.6]}>
      <boxGeometry args={[0.05, 0.6, 0.4]} />
      <meshStandardMaterial color="white" />
    </mesh>
    <mesh position={[0, 0.5, -1.05]}>
      {/* Propeller cone */}
      <group rotation={[Math.PI/2, 0, 0]}>
        <mesh>
           <coneGeometry args={[0.1, 0.2, 16]} />
           <meshStandardMaterial color="#ccc" />
        </mesh>
      </group>
    </mesh>
     <group position={[0, 0.2, -0.2]}>
        <mesh position={[0.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.15, 0.15, 0.1]} />
          <meshStandardMaterial color="black" />
        </mesh>
        <mesh position={[-0.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.15, 0.15, 0.1]} />
          <meshStandardMaterial color="black" />
        </mesh>
      </group>
  </group>
);
