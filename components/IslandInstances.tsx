
import React from 'react';
import '../types';

const TreeInstancesIsland = ({ position, radius }: { position: [number, number, number], radius: number }) => {
     const count = 20;
     return (
        <group position={position}>
             {[...Array(count)].map((_, i) => {
                 const r = Math.random() * radius;
                 const theta = Math.random() * Math.PI * 2;
                 return (
                     <mesh key={i} position={[r * Math.cos(theta), 2, r * Math.sin(theta)]} castShadow>
                         <coneGeometry args={[2, 8, 8]} />
                         <meshStandardMaterial color="#166534" />
                     </mesh>
                 )
             })}
        </group>
     )
}

export const IslandInstances = () => {
    const count = 8;
    return (
        <group>
            {[...Array(count)].map((_, i) => {
                const x = 300 + Math.random() * 2000;
                const z = (Math.random() - 0.5) * 4000;
                const scale = 50 + Math.random() * 150;
                // Ocean is at -10.0.
                // We want island to stick out.
                // Cylinder height is 10.
                // If pos Y = -6.0. Top = -1. Bottom = -11.
                // Top (-1) is well above Ocean (-10).
                return (
                    <group key={i} position={[x, -6, z]}>
                        <mesh receiveShadow>
                            <cylinderGeometry args={[scale * 0.8, scale, 10, 16]} />
                            <meshStandardMaterial color="#4ade80" />
                        </mesh>
                        <TreeInstancesIsland position={[0, 5, 0]} radius={scale * 0.6} />
                    </group>
                )
            })}
        </group>
    )
}
