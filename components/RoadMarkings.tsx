
import React, { useLayoutEffect, useRef } from 'react';
import { InstancedMesh, Object3D } from 'three';

const CROSS_ROADS_X = [ -400, -800, -1200, -1600, -2000, -2400, -2800, -3200, -3600 ];
const MAIN_ROAD_START = -200;
const MAIN_ROAD_END = -4800;
const ROAD_Z_LIMIT = 2000;

// MATCH ENVIRONMENT LAYERS
// Main Road: 0.4
// Cross Road: 0.0
// Separation: 0.05

const MAIN_ROAD_MARKING_Y = 0.45;
const CROSS_ROAD_MARKING_Y = 0.05;

export const RoadMarkings: React.FC = () => {
  const yellowRef = useRef<InstancedMesh>(null);
  const whiteRef = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    if (!yellowRef.current || !whiteRef.current) return;
    
    const dummy = new Object3D();
    
    let yellowIdx = 0;
    let whiteIdx = 0;

    // --- 1. CENTER LINES (Yellow) ---
    
    // Main Road (X-axis)
    for (let x = MAIN_ROAD_START; x > MAIN_ROAD_END; x -= 6) {
       // Check if inside intersection
       const inIntersection = CROSS_ROADS_X.some(cx => Math.abs(x - cx) < 15);
       if (inIntersection) continue;

       dummy.position.set(x, MAIN_ROAD_MARKING_Y, 0);
       dummy.rotation.set(-Math.PI/2, 0, 0);
       dummy.scale.set(3, 0.4, 1); 
       dummy.updateMatrix();
       yellowRef.current.setMatrixAt(yellowIdx++, dummy.matrix);
    }

    // Cross Roads (Z-axis)
    CROSS_ROADS_X.forEach(roadX => {
        for (let z = -ROAD_Z_LIMIT; z < ROAD_Z_LIMIT; z += 6) {
            if (Math.abs(z) < 25) continue; // Skip Main Road Intersection

            dummy.position.set(roadX, CROSS_ROAD_MARKING_Y, z);
            dummy.rotation.set(-Math.PI/2, 0, Math.PI/2);
            dummy.scale.set(3, 0.4, 1);
            dummy.updateMatrix();
            yellowRef.current.setMatrixAt(yellowIdx++, dummy.matrix);
        }
    });


    // --- 2. CROSSWALKS (White) ---
    // These sit on the Main Road Level (0.4) or slightly above (0.45)
    
    CROSS_ROADS_X.forEach(cx => {
        const cwX_Left = cx + 14; 
        const cwX_Right = cx - 14;
        const stripesCount = 8;
        const roadWidthZ = 30;
        const stepZ = roadWidthZ / stripesCount;
        
        // Main Road Crosswalks
        for(let i = 0; i < stripesCount; i++) {
            const zPos = -15 + (i * stepZ) + (stepZ/2);
            
            // Right Side
            dummy.position.set(cwX_Right, MAIN_ROAD_MARKING_Y, zPos);
            dummy.rotation.set(-Math.PI/2, 0, 0);
            dummy.scale.set(2, 2, 1);
            dummy.updateMatrix();
            whiteRef.current.setMatrixAt(whiteIdx++, dummy.matrix);

            // Left Side
            dummy.position.set(cwX_Left, MAIN_ROAD_MARKING_Y, zPos);
            dummy.rotation.set(-Math.PI/2, 0, 0);
            dummy.scale.set(2, 2, 1);
            dummy.updateMatrix();
            whiteRef.current.setMatrixAt(whiteIdx++, dummy.matrix);
        }

        // Cross Road Crosswalks
        const cwZ_Top = -24; 
        const cwZ_Bottom = 24;
        const roadWidthX = 16; 
        const stepX = roadWidthX / stripesCount;
        
        for(let i = 0; i < stripesCount; i++) {
            const xPos = (cx - 8) + (i * stepX) + (stepX/2);
            
            // Top Side
            dummy.position.set(xPos, MAIN_ROAD_MARKING_Y, cwZ_Top);
            dummy.rotation.set(-Math.PI/2, 0, 0);
            dummy.scale.set(1.5, 3, 1);
            dummy.updateMatrix();
            whiteRef.current.setMatrixAt(whiteIdx++, dummy.matrix);

            // Bottom Side
            dummy.position.set(xPos, MAIN_ROAD_MARKING_Y, cwZ_Bottom);
            dummy.rotation.set(-Math.PI/2, 0, 0);
            dummy.scale.set(1.5, 3, 1);
            dummy.updateMatrix();
            whiteRef.current.setMatrixAt(whiteIdx++, dummy.matrix);
        }
    });

    yellowRef.current.instanceMatrix.needsUpdate = true;
    whiteRef.current.instanceMatrix.needsUpdate = true;
    
  }, []);

  return (
    <group>
      {/* Yellow Dashes */}
      <instancedMesh ref={yellowRef} args={[undefined, undefined, 5000]} receiveShadow>
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial color="#eab308" />
      </instancedMesh>

      {/* White Markings */}
      <instancedMesh ref={whiteRef} args={[undefined, undefined, 2000]} receiveShadow>
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial color="#ffffff" />
      </instancedMesh>
    </group>
  );
};
