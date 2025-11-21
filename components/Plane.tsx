
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, MathUtils } from 'three';
import '../types';

interface PlaneProps {
  throttle: number;
  gearDeployed: boolean;
}

export const Plane = React.forwardRef<Group, PlaneProps>(({ throttle, gearDeployed }, ref) => {
  const propRef = useRef<Group>(null);
  const gearRef = useRef<Group>(null);
  const rearGearRef = useRef<Group>(null);
  
  // Animation state for gear (0 = retracted, 1 = deployed)
  const gearAnim = useRef(1);

  useFrame((state, delta) => {
    if (propRef.current) {
      // Spin propeller based on throttle
      const speed = 10 + (throttle * 0.5);
      propRef.current.rotation.z += speed * delta;
    }

    // Animate Gear
    const target = gearDeployed ? 1 : 0;
    gearAnim.current = MathUtils.lerp(gearAnim.current, target, delta * 5);

    if (gearRef.current) {
      // Rotate main gear back into body (simple retraction)
      // Pivot is roughly at top of struts. 
      // If we rotate X, it swings back/forward.
      gearRef.current.rotation.x = MathUtils.lerp(-Math.PI / 2, 0, gearAnim.current);
      gearRef.current.position.y = MathUtils.lerp(-0.1, -0.3, gearAnim.current);
    }
    
    if (rearGearRef.current) {
      // Scale rear wheel to hide it or move it up
       rearGearRef.current.position.y = MathUtils.lerp(0.1, -0.1, gearAnim.current);
       const s = MathUtils.lerp(0, 1, gearAnim.current);
       rearGearRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group ref={ref}>
      {/* Fuselage */}
      <mesh castShadow position={[0, 0, 0]}>
        <boxGeometry args={[0.5, 0.5, 2]} />
        <meshStandardMaterial color="#ef4444" /> {/* Red body */}
      </mesh>

      {/* Tail Boom */}
      <mesh castShadow position={[0, 0.2, 1.2]}>
        <boxGeometry args={[0.2, 0.2, 1]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>

      {/* Main Wing */}
      <mesh castShadow position={[0, 0.4, -0.2]}>
        <boxGeometry args={[3.5, 0.1, 0.6]} />
        <meshStandardMaterial color="white" />
      </mesh>
      
      {/* Wing Struts */}
      <mesh position={[0.8, 0.1, -0.2]} rotation={[0, 0, -0.5]}>
        <cylinderGeometry args={[0.02, 0.02, 1]} />
        <meshStandardMaterial color="#999" />
      </mesh>
      <mesh position={[-0.8, 0.1, -0.2]} rotation={[0, 0, 0.5]}>
        <cylinderGeometry args={[0.02, 0.02, 1]} />
        <meshStandardMaterial color="#999" />
      </mesh>

      {/* Horizontal Stabilizer (Rear Wing) */}
      <mesh castShadow position={[0, 0.3, 1.6]}>
        <boxGeometry args={[1.2, 0.05, 0.4]} />
        <meshStandardMaterial color="white" />
      </mesh>

      {/* Vertical Stabilizer (Tail Fin) */}
      <mesh castShadow position={[0, 0.6, 1.6]}>
        <boxGeometry args={[0.05, 0.6, 0.4]} />
        <meshStandardMaterial color="white" />
      </mesh>

      {/* Landing Gear Group */}
      <group ref={gearRef} position={[0, -0.3, -0.2]}>
        {/* Axle */}
        <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.03, 0.03, 1]} />
          <meshStandardMaterial color="#333" />
        </mesh>
        {/* Wheels */}
        <mesh position={[0.5, -0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.15, 0.15, 0.1]} />
          <meshStandardMaterial color="black" />
        </mesh>
        <mesh position={[-0.5, -0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.15, 0.15, 0.1]} />
          <meshStandardMaterial color="black" />
        </mesh>
      </group>
      
      {/* Rear Wheel */}
      <mesh ref={rearGearRef} position={[0, -0.1, 1.6]}>
         <cylinderGeometry args={[0.05, 0.05, 0.05]} />
         <meshStandardMaterial color="black" />
      </mesh>

      {/* Propeller Group */}
      <group ref={propRef} position={[0, 0, -1.05]}>
        {/* Spinner */}
        <mesh rotation={[Math.PI/2, 0, 0]}>
          <coneGeometry args={[0.1, 0.2, 16]} />
          <meshStandardMaterial color="#ccc" />
        </mesh>
        {/* Blades */}
        <mesh>
          <boxGeometry args={[1.8, 0.1, 0.02]} />
          <meshStandardMaterial color="#333" />
        </mesh>
        <mesh rotation={[0, 0, Math.PI/2]}>
          <boxGeometry args={[1.8, 0.1, 0.02]} />
          <meshStandardMaterial color="#333" />
        </mesh>
      </group>
    </group>
  );
});
Plane.displayName = 'Plane';
