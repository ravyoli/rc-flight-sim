
import React, { useRef, useLayoutEffect, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { InstancedMesh, Object3D, Color } from 'three';
import '../types';

export type TrafficState = Record<number, 'MAIN_GO' | 'CROSS_GO'>;

interface TrafficLightSystemProps {
  intersections: number[];
  stateRef: React.MutableRefObject<TrafficState>;
}

export const TrafficLightSystem: React.FC<TrafficLightSystemProps> = ({ intersections, stateRef }) => {
  // Visual Refs
  const poleRef = useRef<InstancedMesh>(null);
  const housingRef = useRef<InstancedMesh>(null);
  const lightMainRef = useRef<InstancedMesh>(null); // Lights facing Main Road
  const lightCrossRef = useRef<InstancedMesh>(null); // Lights facing Cross Road

  const [dummy] = useState(() => new Object3D());
  const timer = useRef(0);

  // Initialize Visuals
  useLayoutEffect(() => {
    if (!poleRef.current || !housingRef.current || !lightMainRef.current || !lightCrossRef.current) return;

    let idx = 0;
    intersections.forEach((x) => {
      // 4 Corners per intersection
      // Corner 1: x-12, z-12
      // Corner 2: x+12, z-12
      // Corner 3: x+12, z+12
      // Corner 4: x-12, z+12
      
      const offsets = [
        [-12, -12], [12, -12], [12, 12], [-12, 12]
      ];

      offsets.forEach(([offX, offZ]) => {
        // POLE
        dummy.position.set(x + offX, 3, offZ);
        dummy.scale.set(1, 1, 1);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        poleRef.current!.setMatrixAt(idx, dummy.matrix);

        // HOUSING (Box on top)
        dummy.position.set(x + offX, 6, offZ);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        housingRef.current!.setMatrixAt(idx, dummy.matrix);

        // LIGHTS
        // We need lights facing the incoming traffic.
        // Main Road (X-axis) traffic comes from Left (-X) and Right (+X).
        // Cross Road (Z-axis) traffic comes from Top (-Z) and Bottom (+Z).
        
        // Simplified: Each pole has 2 lights. One facing X, one facing Z.
        
        // Main Facing Light (Visible to cars on Main St)
        // Needs to face +/- X
        dummy.position.set(x + offX, 6, offZ); 
        // Rotate to face Z axis (side of box)? No, face X axis.
        dummy.rotation.set(0, Math.PI/2, 0); 
        dummy.updateMatrix();
        lightMainRef.current!.setMatrixAt(idx, dummy.matrix);

        // Cross Facing Light (Visible to cars on Cross St)
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        lightCrossRef.current!.setMatrixAt(idx, dummy.matrix);

        idx++;
      });
    });

    poleRef.current.instanceMatrix.needsUpdate = true;
    housingRef.current.instanceMatrix.needsUpdate = true;
    lightMainRef.current.instanceMatrix.needsUpdate = true;
    lightCrossRef.current.instanceMatrix.needsUpdate = true;
  }, [intersections, dummy]);

  // Logic & Animation Loop
  useFrame((state, delta) => {
    timer.current += delta;
    
    // Toggle lights every 8 seconds
    if (timer.current > 8) {
      timer.current = 0;
      intersections.forEach(x => {
        const current = stateRef.current[x] || 'MAIN_GO';
        stateRef.current[x] = current === 'MAIN_GO' ? 'CROSS_GO' : 'MAIN_GO';
      });
      
      // Update Visuals
      if (lightMainRef.current && lightCrossRef.current) {
        let idx = 0;
        const green = new Color('#22c55e');
        const red = new Color('#ef4444');

        intersections.forEach(x => {
          const phase = stateRef.current[x];
          const mainColor = phase === 'MAIN_GO' ? green : red;
          const crossColor = phase === 'CROSS_GO' ? green : red;

          // 4 poles per intersection
          for (let i=0; i<4; i++) {
            lightMainRef.current!.setColorAt(idx, mainColor);
            lightCrossRef.current!.setColorAt(idx, crossColor);
            idx++;
          }
        });
        
        lightMainRef.current.instanceColor!.needsUpdate = true;
        lightCrossRef.current.instanceColor!.needsUpdate = true;
      }
    }
  });

  const count = intersections.length * 4;

  return (
    <group>
      {/* Poles */}
      <instancedMesh ref={poleRef} args={[undefined, undefined, count]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 6]} />
        <meshStandardMaterial color="#333" />
      </instancedMesh>

      {/* Housings */}
      <instancedMesh ref={housingRef} args={[undefined, undefined, count]} castShadow>
        <boxGeometry args={[1, 2, 1]} />
        <meshStandardMaterial color="#111" />
      </instancedMesh>

      {/* Main Road Lights (Faces X) */}
      <instancedMesh ref={lightMainRef} args={[undefined, undefined, count]}>
         {/* Thin box acting as the glowing panel */}
         <boxGeometry args={[0.2, 0.8, 1.1]} />
         <meshStandardMaterial emissiveIntensity={3} toneMapped={false} />
      </instancedMesh>

      {/* Cross Road Lights (Faces Z) */}
      <instancedMesh ref={lightCrossRef} args={[undefined, undefined, count]}>
         <boxGeometry args={[1.1, 0.8, 0.2]} />
         <meshStandardMaterial emissiveIntensity={3} toneMapped={false} />
      </instancedMesh>
    </group>
  );
};
