
import React, { useRef, useLayoutEffect } from 'react';
import { InstancedMesh, Object3D, Color } from 'three';
import '../types';

export const TreeInstances = () => {
  const foliageRef = useRef<InstancedMesh>(null);
  const trunkRef = useRef<InstancedMesh>(null);
  const count = 3000;

  useLayoutEffect(() => {
    if (!foliageRef.current || !trunkRef.current) return;
    const tempObj = new Object3D();
    
    let i = 0;
    for (let k = 0; k < count; k++) {
      let x = -100 - Math.random() * 3800;
      let z = (Math.random() - 0.5) * 4000;
      
      // --- EXCLUSION ZONES ---

      if (x > -200 && Math.abs(z) < 600) continue;
      if (Math.abs(x - (-3000)) < 300 && Math.abs(z) < 600) continue;

      const inCityX = x < -200 && x > -3800;
      const inCityZ = Math.abs(z) < 1800;
      if (inCityX && inCityZ) continue;

      if (Math.abs(z) < 50) continue;

      const nearestRoadX = Math.round(x / 400) * 400;
      if (Math.abs(x - nearestRoadX) < 45) continue; 

      if (i >= count) break;

      const scale = 1 + Math.random() * 1.5;
      
      // Ground is at -2.0.
      // Trunk: Center Y relative to base is 1.8 * scale (Height is 3.6 * scale effectively?)
      // Cylinder Height = 3. 
      // Real Height = 3 * (scale * 1.2) = 3.6 * scale.
      // Center Y = -2.0 + (1.8 * scale).
      
      const trunkY = -2.0 + (1.8 * scale);
      // Foliage sits on top roughly
      const foliageY = -2.0 + (3.5 * scale);

      // Foliage
      tempObj.position.set(x, foliageY, z);
      tempObj.scale.set(scale * 1.5, scale * 1.5, scale * 1.5);
      tempObj.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      tempObj.updateMatrix();
      foliageRef.current.setMatrixAt(i, tempObj.matrix);

      // Trunk
      tempObj.position.set(x, trunkY, z);
      tempObj.rotation.set(0, Math.random() * Math.PI, 0);
      tempObj.scale.set(scale * 0.4, scale * 1.2, scale * 0.4);
      tempObj.updateMatrix();
      trunkRef.current.setMatrixAt(i, tempObj.matrix);

      const green = new Color().setHSL(
        0.25 + Math.random() * 0.1, 
        0.4 + Math.random() * 0.4, 
        0.3 + Math.random() * 0.3
      );
      foliageRef.current.setColorAt(i, green);
      
      const wood = new Color().setHSL(0.07, 0.4, 0.2 + Math.random() * 0.1);
      trunkRef.current.setColorAt(i, wood);

      i++;
    }
    foliageRef.current.instanceMatrix.needsUpdate = true;
    if (foliageRef.current.instanceColor) foliageRef.current.instanceColor.needsUpdate = true;
    trunkRef.current.instanceMatrix.needsUpdate = true;
    if (trunkRef.current.instanceColor) trunkRef.current.instanceColor.needsUpdate = true;
  }, []);

  return (
    <group>
      <instancedMesh ref={foliageRef} args={[undefined, undefined, count]} castShadow>
        <dodecahedronGeometry args={[1.5, 0]} />
        <meshStandardMaterial roughness={0.8} flatShading />
      </instancedMesh>
      <instancedMesh ref={trunkRef} args={[undefined, undefined, count]} castShadow>
         <cylinderGeometry args={[0.5, 0.7, 3, 6]} />
         <meshStandardMaterial roughness={0.9} flatShading />
      </instancedMesh>
    </group>
  );
};
