
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
  const poleRef = useRef<InstancedMesh>(null);
  const housingRef = useRef<InstancedMesh>(null);
  const lightMainRef = useRef<InstancedMesh>(null); 
  const lightCrossRef = useRef<InstancedMesh>(null); 

  const [dummy] = useState(() => new Object3D());
  const timer = useRef(0);

  useLayoutEffect(() => {
    if (!poleRef.current || !housingRef.current || !lightMainRef.current || !lightCrossRef.current) return;

    let idx = 0;
    intersections.forEach((x) => {
      // Update offsets to match sidewalk positions
      // Main Road Sidewalks are at Z = +/- 22
      // Cross Road Sidewalks are at X (relative) = +/- 12
      const offsets = [
        [-12, -22], [12, -22], [12, 22], [-12, 22]
      ];

      offsets.forEach(([offX, offZ]) => {
        // Sidewalk Level: 0.55
        // Pole Height: 6
        // Center Y = 0.55 + 3 = 3.55
        dummy.position.set(x + offX, 3.55, offZ);
        dummy.scale.set(1, 1, 1);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        poleRef.current!.setMatrixAt(idx, dummy.matrix);

        // Housing Center Y = 0.55 + 6 = 6.55
        dummy.position.set(x + offX, 6.55, offZ);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        housingRef.current!.setMatrixAt(idx, dummy.matrix);

        // Light Main (Faces X-axis / Main Road)
        // Geometry: [0.2, 0.8, 1.1] -> Thin X, Wide Z.
        // Unrotated, this presents the flat face (YZ plane) to X-axis traffic.
        // Positioned slightly HIGHER to avoid Z-fighting with Cross light
        dummy.position.set(x + offX, 6.8, offZ); 
        dummy.rotation.set(0, 0, 0); 
        dummy.updateMatrix();
        lightMainRef.current!.setMatrixAt(idx, dummy.matrix);

        // Light Cross (Faces Z-axis / Cross Road)
        // Geometry: [1.1, 0.8, 0.2] -> Wide X, Thin Z.
        // Unrotated, this presents the flat face (XY plane) to Z-axis traffic.
        // Positioned slightly LOWER
        dummy.position.set(x + offX, 6.3, offZ);
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

  useFrame((state, delta) => {
    timer.current += delta;
    
    if (timer.current > 8) {
      timer.current = 0;
      intersections.forEach(x => {
        const current = stateRef.current[x] || 'MAIN_GO';
        stateRef.current[x] = current === 'MAIN_GO' ? 'CROSS_GO' : 'MAIN_GO';
      });
      
      if (lightMainRef.current && lightCrossRef.current) {
        let idx = 0;
        const green = new Color('#22c55e');
        const red = new Color('#ef4444');

        intersections.forEach(x => {
          const phase = stateRef.current[x];
          const mainColor = phase === 'MAIN_GO' ? green : red;
          const crossColor = phase === 'CROSS_GO' ? green : red;

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
      <instancedMesh ref={poleRef} args={[undefined, undefined, count]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 6]} />
        <meshStandardMaterial color="#333" />
      </instancedMesh>
      <instancedMesh ref={housingRef} args={[undefined, undefined, count]} castShadow>
        <boxGeometry args={[1, 2, 1]} />
        <meshStandardMaterial color="#111" />
      </instancedMesh>
      
      {/* Light facing Main Road (X-Axis) - Thin X, Wide Z */}
      <instancedMesh ref={lightMainRef} args={[undefined, undefined, count]}>
         <boxGeometry args={[0.2, 0.6, 1.0]} />
         <meshStandardMaterial emissiveIntensity={3} toneMapped={false} />
      </instancedMesh>
      
      {/* Light facing Cross Road (Z-Axis) - Wide X, Thin Z */}
      <instancedMesh ref={lightCrossRef} args={[undefined, undefined, count]}>
         <boxGeometry args={[1.0, 0.6, 0.2]} />
         <meshStandardMaterial emissiveIntensity={3} toneMapped={false} />
      </instancedMesh>
    </group>
  );
};
