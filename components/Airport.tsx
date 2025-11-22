
import React from 'react';
import { ParkedPlane } from './ParkedPlane';
import { Hangar } from './Hangar';
import '../types';

export const Airport = ({ position, rotationY = 0 }: { position: [number, number, number], rotationY?: number }) => {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Runway */}
      {/* Main Road Level is 0.4 */}
      {/* Airport Group is at Y=0 (relative to parent which might be at -2 or 0) */}
      {/* In Environment, Airport group is at y=0 */}
      
      <group position={[0, 0.4, 0]}> 
         <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[24, 800]} />
          <meshStandardMaterial color="#333" roughness={0.8} />
        </mesh>
        {/* Markings - +0.05 */}
         <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, -380]}>
             <planeGeometry args={[16, 10]} />
             <meshStandardMaterial color="#fff" />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 380]}>
             <planeGeometry args={[16, 10]} />
             <meshStandardMaterial color="#fff" />
        </mesh>
        {Array.from({ length: 30 }).map((_, i) => (
             <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, -350 + i * 24]}>
                <planeGeometry args={[1.5, 10]} />
                <meshStandardMaterial color="#fff" />
             </mesh>
        ))}
      </group>

      {/* Structures (On Ground -2.0) */}
      <group position={[30, -2.0, 0]}>
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
