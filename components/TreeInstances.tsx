
import React, { useRef, useLayoutEffect } from 'react';
import { InstancedMesh, Object3D, Color } from 'three';
import '../types';

export const TreeInstances = () => {
  const meshRef = useRef<InstancedMesh>(null);
  const trunkRef = useRef<InstancedMesh>(null);
  const count = 2000;

  useLayoutEffect(() => {
    if (!meshRef.current || !trunkRef.current) return;
    const tempObj = new Object3D();
    
    let i = 0;
    for (let k = 0; k < count; k++) {
      // Spread mostly in the city/buffer zone (X < -100)
      let x = -100 - Math.random() * 3500;
      let z = (Math.random() - 0.5) * 3000;
      
      // Avoid Runways areas
      // Airport 1: x ~ -50, z range
      if (x > -100 && Math.abs(z) < 500) continue;
      // Airport 2: x ~ -3000, z range
      if (Math.abs(x - (-3000)) < 100 && Math.abs(z) < 500) continue;

      // Avoid Main Roads
      if (Math.abs(z) < 30) continue;
      if (Math.abs(x % 400) < 20) continue;

      const scale = 1 + Math.random() * 1.5;
      
      tempObj.position.set(x, 1.5 * scale, z);
      tempObj.scale.set(scale, scale, scale);
      tempObj.rotation.set(0, Math.random() * Math.PI, 0);
      tempObj.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObj.matrix);

      tempObj.position.set(x, 0.5 * scale, z);
      tempObj.scale.set(scale * 0.3, scale, scale * 0.3);
      tempObj.updateMatrix();
      trunkRef.current.setMatrixAt(i, tempObj.matrix);

      const green = new Color().setHSL(0.3, 0.5 + Math.random() * 0.3, 0.2 + Math.random() * 0.2);
      meshRef.current.setColorAt(i, green);

      i++;
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    trunkRef.current.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <group>
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow>
        <coneGeometry args={[1.5, 4, 8]} />
        <meshStandardMaterial roughness={0.8} />
      </instancedMesh>
      <instancedMesh ref={trunkRef} args={[undefined, undefined, count]} castShadow>
         <cylinderGeometry args={[0.5, 0.5, 2]} />
         <meshStandardMaterial color="#3f2e18" />
      </instancedMesh>
    </group>
  );
};
