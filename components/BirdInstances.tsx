
import React, { useRef, useMemo } from 'react';
import { InstancedMesh, Object3D, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import '../types';

export const BirdInstances = () => {
  const meshRef = useRef<InstancedMesh>(null);
  const count = 150;
  const dummy = useMemo(() => new Object3D(), []);

  const birds = useMemo(() => {
    return new Array(count).fill(0).map(() => ({
      position: new Vector3(
        (Math.random() - 0.5) * 3000,
        40 + Math.random() * 100,
        (Math.random() - 0.5) * 3000
      ),
      velocity: new Vector3(Math.random()-0.5, 0, Math.random()-0.5).normalize().multiplyScalar(10 + Math.random() * 5),
      phase: Math.random() * Math.PI * 2
    }));
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;

    birds.forEach((bird, i) => {
      // Move
      bird.position.addScaledVector(bird.velocity, delta);
      
      // Meander
      bird.velocity.x += Math.sin(t + bird.phase) * 0.1;
      bird.velocity.z += Math.cos(t * 0.8 + bird.phase) * 0.1;
      bird.velocity.normalize().multiplyScalar(15);

      // Wrap
      if(Math.abs(bird.position.x) > 2000) bird.velocity.x *= -1;
      if(Math.abs(bird.position.z) > 2000) bird.velocity.z *= -1;
      
      dummy.position.copy(bird.position);
      
      // Orientation
      const target = bird.position.clone().add(bird.velocity);
      dummy.lookAt(target);
      
      // Banking
      dummy.rotateZ(Math.sin(t * 3 + bird.phase) * 0.5);
      
      // Wings (Scale X to look like wings, Y as thickness)
      // "Flap" by scaling width slightly or just banking
      const flap = Math.sin(t * 15 + bird.phase);
      dummy.scale.set(2, 0.1, 0.5 + flap * 0.1);

      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow>
      {/* Simple Pyramid shape flattened */}
      <coneGeometry args={[0.5, 1, 4]} />
      <meshStandardMaterial color="#111" />
    </instancedMesh>
  );
};
