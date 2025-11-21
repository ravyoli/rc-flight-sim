
import React from 'react';
import { ParkedPlane } from './ParkedPlane';
import { Hangar } from './Hangar';
import '../types';

export const Airport = ({ position, rotationY = 0 }: { position: [number, number, number], rotationY?: number }) => {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Runway */}
      <group position={[0, 0.15, 0]}> {/* Relative to airport ground */}
         <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[24, 800]} />
          <meshStandardMaterial color="#333" roughness={0.8} />
        </mesh>
        {/* Markings */}
         <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -380]}>
             <planeGeometry args={[16, 10]} />
             <meshStandardMaterial color="#fff" />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 380]}>
             <planeGeometry args={[16, 10]} />
             <meshStandardMaterial color="#fff" />
        </mesh>
        {Array.from({ length: 30 }).map((_, i) => (
             <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -350 + i * 24]}>
                <planeGeometry args={[1.5, 10]} />
                <meshStandardMaterial color="#fff" />
             </mesh>
        ))}
      </group>

      {/* Structures */}
      <group position={[30, 0, 0]}>
        <ParkedPlane position={[0, 0, 50]} rotation={[0, -Math.PI/4, 0]} color="#3b82f6" />
        <ParkedPlane position={[0, 0, 20]} rotation={[0, -Math.PI/6, 0]} color="#ef4444" />
        <ParkedPlane position={[-5, 0, -40]} rotation={[0, Math.PI/3, 0]} color="#22c55e" />
        <Hangar position={[-10, 0, 150]} />
        <Hangar position={[-10, 0, 200]} />
        
        {/* Control Tower */}
        <group position={[0, 0, 100]}>
          <mesh position={[0, 15, 0]} castShadow>
            <boxGeometry args={[8, 30, 8]} />
            <meshStandardMaterial color="#888" />
          </mesh>
          <mesh position={[0, 32, 0]} castShadow>
            <cylinderGeometry args={[6, 5, 6, 8]} />
            <meshStandardMaterial color="#333" />
          </mesh>
        </group>
      </group>
    </group>
  )
}
