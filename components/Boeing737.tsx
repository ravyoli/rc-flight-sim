
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, MathUtils } from 'three';
import '../types';

interface Boeing737Props {
  throttle: number;
  gearDeployed: boolean;
}

export const Boeing737 = React.forwardRef<Group, Boeing737Props>(({ throttle, gearDeployed }, ref) => {
  const gearRef = useRef<Group>(null);
  const gearAnim = useRef(1);

  useFrame((state, delta) => {
    // Animate Gear
    const target = gearDeployed ? 1 : 0;
    gearAnim.current = MathUtils.lerp(gearAnim.current, target, delta * 2); 

    if (gearRef.current) {
       // Lift up
       gearRef.current.position.y = MathUtils.lerp(0.0, -0.6, gearAnim.current);
       // Scale down to hide
       const s = MathUtils.lerp(0.01, 1, gearAnim.current);
       gearRef.current.scale.set(s, s, s);
    }
  });

  const windowPositions = useMemo(() => {
      const pos = [];
      // Generate z-positions for windows along the fuselage
      for(let z = -2.5; z < 3.5; z+=0.45) {
          pos.push(z);
      }
      return pos;
  }, []);

  return (
    <group ref={ref}>
      
      {/* --- FUSELAGE SECTIONS --- */}
      
      {/* Main Body */}
      <mesh castShadow position={[0, 0, 0.5]} rotation={[Math.PI/2, 0, 0]}>
        <cylinderGeometry args={[0.75, 0.75, 7, 32]} />
        <meshStandardMaterial color="white" roughness={0.3} />
      </mesh>
      
      {/* Forward Taper */}
      <mesh castShadow position={[0, -0.05, -3.5]} rotation={[Math.PI/2, 0, 0]}>
        <cylinderGeometry args={[0.75, 0.68, 1.5, 32]} />
        <meshStandardMaterial color="white" roughness={0.3} />
      </mesh>
      
      {/* Nose Cone */}
      <mesh castShadow position={[0, -0.15, -4.7]} rotation={[Math.PI/2, 0, 0]}>
         <cylinderGeometry args={[0.68, 0.1, 1.5, 32]} />
         <meshStandardMaterial color="white" roughness={0.3} />
      </mesh>

      {/* Aft Taper */}
      <mesh castShadow position={[0, 0.1, 4.5]} rotation={[Math.PI/2, 0, 0]}>
         <cylinderGeometry args={[0.75, 0.6, 2.0, 32]} />
         <meshStandardMaterial color="white" roughness={0.3} />
      </mesh>

      {/* Tail Cone */}
      <mesh castShadow position={[0, 0.25, 6.0]} rotation={[Math.PI/2, 0, 0]}>
         <cylinderGeometry args={[0.6, 0.2, 1.5, 32]} />
         <meshStandardMaterial color="white" roughness={0.3} />
      </mesh>

      {/* --- COCKPIT --- */}
      <group position={[0, 0.35, -3.6]} rotation={[0.2, 0, 0]}>
         {/* Center Pane */}
         <mesh position={[0, 0, 0]}>
             <boxGeometry args={[0.5, 0.25, 0.3]} />
             <meshStandardMaterial color="#111" metalness={0.8} roughness={0.1} />
         </mesh>
         {/* Side Panes */}
         <mesh position={[0.32, -0.05, 0.1]} rotation={[0, 0.5, 0]}>
             <boxGeometry args={[0.35, 0.22, 0.1]} />
             <meshStandardMaterial color="#111" metalness={0.8} roughness={0.1} />
         </mesh>
         <mesh position={[-0.32, -0.05, 0.1]} rotation={[0, -0.5, 0]}>
             <boxGeometry args={[0.35, 0.22, 0.1]} />
             <meshStandardMaterial color="#111" metalness={0.8} roughness={0.1} />
         </mesh>
      </group>

      {/* --- PASSENGER WINDOWS --- */}
      <group>
         {windowPositions.map((z, i) => (
             <React.Fragment key={i}>
                 {/* Right Side Windows */}
                 <mesh position={[0.74, 0.15, z]} rotation={[0, Math.PI/2, 0]}>
                     <circleGeometry args={[0.08, 16]} />
                     <meshStandardMaterial color="#0f172a" roughness={0.1} />
                 </mesh>
                 {/* Left Side Windows */}
                 <mesh position={[-0.74, 0.15, z]} rotation={[0, -Math.PI/2, 0]}>
                     <circleGeometry args={[0.08, 16]} />
                     <meshStandardMaterial color="#0f172a" roughness={0.1} />
                 </mesh>
             </React.Fragment>
         ))}
      </group>

      {/* --- WINGS --- */}
      <group position={[0, -0.3, 0.5]}>
        {/* Left Wing */}
        <group position={[-2.8, 0, 1.0]} rotation={[0, -0.35, -0.08]}>
            <mesh castShadow receiveShadow>
                <boxGeometry args={[5.5, 0.15, 1.8]} />
                <meshStandardMaterial color="#e2e8f0" />
            </mesh>
            {/* Winglet */}
            <mesh position={[-2.7, 0.5, 0]} rotation={[0, 0, 0.8]}>
                <boxGeometry args={[0.1, 1.2, 0.8]} />
                <meshStandardMaterial color="#0ea5e9" />
            </mesh>
        </group>

         {/* Right Wing */}
         <group position={[2.8, 0, 1.0]} rotation={[0, 0.35, 0.08]}>
            <mesh castShadow receiveShadow>
                <boxGeometry args={[5.5, 0.15, 1.8]} />
                <meshStandardMaterial color="#e2e8f0" />
            </mesh>
            {/* Winglet */}
            <mesh position={[2.7, 0.5, 0]} rotation={[0, 0, -0.8]}>
                <boxGeometry args={[0.1, 1.2, 0.8]} />
                <meshStandardMaterial color="#0ea5e9" />
            </mesh>
        </group>
      </group>

      {/* --- ENGINES --- */}
      <group position={[0, -0.6, 1.5]}>
          {/* Left Engine */}
          <group position={[-2.5, 0, -0.5]}>
               {/* Pylon */}
               <mesh position={[0, 0.4, 0.5]} rotation={[-0.1, 0, 0]}>
                   <boxGeometry args={[0.3, 0.6, 1.5]} />
                   <meshStandardMaterial color="#cbd5e1" />
               </mesh>
               {/* Nacelle */}
               <mesh castShadow rotation={[Math.PI/2, 0, 0]}>
                   <cylinderGeometry args={[0.45, 0.4, 1.6, 24]} />
                   <meshStandardMaterial color="#cbd5e1" />
               </mesh>
               {/* Black Intake */}
               <mesh position={[0, 0, -0.81]} rotation={[Math.PI/2, 0, 0]}>
                   <circleGeometry args={[0.42, 24]} />
                   <meshStandardMaterial color="#111" />
               </mesh>
               {/* Spinner */}
               <mesh position={[0, 0, -0.8]} rotation={[Math.PI/2, 0, 0]}>
                   <coneGeometry args={[0.15, 0.2, 16]} />
                   <meshStandardMaterial color="#64748b" />
               </mesh>
          </group>

          {/* Right Engine */}
          <group position={[2.5, 0, -0.5]}>
               {/* Pylon */}
               <mesh position={[0, 0.4, 0.5]} rotation={[-0.1, 0, 0]}>
                   <boxGeometry args={[0.3, 0.6, 1.5]} />
                   <meshStandardMaterial color="#cbd5e1" />
               </mesh>
               {/* Nacelle */}
               <mesh castShadow rotation={[Math.PI/2, 0, 0]}>
                   <cylinderGeometry args={[0.45, 0.4, 1.6, 24]} />
                   <meshStandardMaterial color="#cbd5e1" />
               </mesh>
               {/* Black Intake */}
               <mesh position={[0, 0, -0.81]} rotation={[Math.PI/2, 0, 0]}>
                   <circleGeometry args={[0.42, 24]} />
                   <meshStandardMaterial color="#111" />
               </mesh>
               {/* Spinner */}
               <mesh position={[0, 0, -0.8]} rotation={[Math.PI/2, 0, 0]}>
                   <coneGeometry args={[0.15, 0.2, 16]} />
                   <meshStandardMaterial color="#64748b" />
               </mesh>
          </group>
      </group>

      {/* --- TAIL --- */}
      <group position={[0, 0.8, 6.0]}>
         {/* Vertical Stabilizer */}
         <group position={[0, 1.4, 0.5]}>
             <mesh castShadow rotation={[0.4, 0, 0]}>
                <boxGeometry args={[0.15, 2.8, 1.8]} /> 
                <meshStandardMaterial color="#0ea5e9" />
             </mesh>
         </group>
         
         {/* Horizontal Stabilizers */}
         <mesh castShadow position={[0, 0.1, 0.5]} rotation={[-0.1, 0, 0]}>
             <boxGeometry args={[4.2, 0.1, 1.4]} />
             <meshStandardMaterial color="white" />
         </mesh>
      </group>

      {/* --- LANDING GEAR --- */}
      <group ref={gearRef} position={[0, -0.8, 0]}>
         {/* Nose Gear */}
         <group position={[0, -0.3, -3.8]}>
             <mesh position={[0, 0.3, 0]}>
                 <cylinderGeometry args={[0.08, 0.08, 0.8]} />
                 <meshStandardMaterial color="#94a3b8" />
             </mesh>
             <mesh position={[0, -0.2, 0]} rotation={[0, 0, Math.PI/2]}>
                 <cylinderGeometry args={[0.18, 0.18, 0.15]} />
                 <meshStandardMaterial color="#111" />
             </mesh>
         </group>

         {/* Main Gear Left */}
         <group position={[-2.0, -0.3, 0.8]}>
             <mesh position={[0, 0.3, 0]}>
                 <cylinderGeometry args={[0.1, 0.1, 0.9]} />
                 <meshStandardMaterial color="#94a3b8" />
             </mesh>
             <mesh position={[0, -0.2, 0]} rotation={[0, 0, Math.PI/2]}>
                 <cylinderGeometry args={[0.24, 0.24, 0.2]} />
                 <meshStandardMaterial color="#111" />
             </mesh>
         </group>

         {/* Main Gear Right */}
         <group position={[2.0, -0.3, 0.8]}>
             <mesh position={[0, 0.3, 0]}>
                 <cylinderGeometry args={[0.1, 0.1, 0.9]} />
                 <meshStandardMaterial color="#94a3b8" />
             </mesh>
             <mesh position={[0, -0.2, 0]} rotation={[0, 0, Math.PI/2]}>
                 <cylinderGeometry args={[0.24, 0.24, 0.2]} />
                 <meshStandardMaterial color="#111" />
             </mesh>
         </group>
      </group>

    </group>
  );
});
Boeing737.displayName = 'Boeing737';
