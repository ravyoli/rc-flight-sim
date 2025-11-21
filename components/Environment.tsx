
import React, { useMemo, useLayoutEffect, useRef } from 'react';
import { Sky, Stars, Cloud } from '@react-three/drei';
import { Object3D, Color, InstancedMesh, Vector3, Euler } from 'three';

// Parked Plane Component
const ParkedPlane = ({ position, rotation, color = "#ef4444" }: { position: [number, number, number], rotation?: [number, number, number], color?: string }) => (
  <group position={position} rotation={rotation ? new Euler(...rotation) : new Euler(0,0,0)}>
    <mesh castShadow position={[0, 0.5, 0]}>
      <boxGeometry args={[0.5, 0.5, 2]} />
      <meshStandardMaterial color={color} />
    </mesh>
    <mesh castShadow position={[0, 0.9, -0.2]}>
      <boxGeometry args={[3.5, 0.1, 0.6]} />
      <meshStandardMaterial color="white" />
    </mesh>
    <mesh castShadow position={[0, 1.0, 1.6]}>
      <boxGeometry args={[1.2, 0.05, 0.4]} />
      <meshStandardMaterial color="white" />
    </mesh>
    <mesh castShadow position={[0, 1.2, 1.6]}>
      <boxGeometry args={[0.05, 0.6, 0.4]} />
      <meshStandardMaterial color="white" />
    </mesh>
    <mesh position={[0, 0.5, -1.05]}>
      {/* Propeller cone */}
      <group rotation={[Math.PI/2, 0, 0]}>
        <mesh>
           <coneGeometry args={[0.1, 0.2, 16]} />
           <meshStandardMaterial color="#ccc" />
        </mesh>
      </group>
    </mesh>
     <group position={[0, 0.2, -0.2]}>
        <mesh position={[0.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.15, 0.15, 0.1]} />
          <meshStandardMaterial color="black" />
        </mesh>
        <mesh position={[-0.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.15, 0.15, 0.1]} />
          <meshStandardMaterial color="black" />
        </mesh>
      </group>
  </group>
);

const Hangar = ({ position }: { position: [number, number, number] }) => (
  <group position={position}>
    <mesh castShadow position={[0, 4, 0]} rotation={[0, 0, Math.PI/2]}>
      <cylinderGeometry args={[10, 10, 20, 32, 1, false, 0, Math.PI]} />
      <meshStandardMaterial color="#cbd5e1" side={2} />
    </mesh>
    <mesh position={[0, 2, 0]}>
      <boxGeometry args={[20, 4, 20]} />
      <meshStandardMaterial color="#94a3b8" />
    </mesh>
  </group>
);

// Reusable Airport Component
const Airport = ({ position, rotationY = 0 }: { position: [number, number, number], rotationY?: number }) => {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Runway */}
      <group position={[0, 0.15, 0]}> {/* Relative to airport ground */}
         <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[24, 800]} />
          <meshStandardMaterial color="#333" roughness={0.8} />
        </mesh>
        {/* Markings */}
         <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -380]}>
             <planeGeometry args={[16, 10]} />
             <meshStandardMaterial color="#fff" />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 380]}>
             <planeGeometry args={[16, 10]} />
             <meshStandardMaterial color="#fff" />
        </mesh>
        {Array.from({ length: 30 }).map((_, i) => (
             <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -350 + i * 24]}>
                <planeGeometry args={[1.5, 10]} />
                <meshStandardMaterial color="#fff" />
             </mesh>
        ))}
      </group>

      {/* Structures */}
      <group position={[30, 0, 0]}>
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

// Trees
const TreeInstances = () => {
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

const CityInstances = () => {
  const meshRef = useRef<InstancedMesh>(null);
  const count = 4000;

  useLayoutEffect(() => {
    if (!meshRef.current) return;
    const tempObj = new Object3D();
    
    let i = 0;
    // Generate grid from -200 down to -4000
    for (let x = -200; x > -4000; x -= 60) {
      // Skip Second Airport area
      if (Math.abs(x - (-3000)) < 80) continue;

      // Cross Roads
      if (Math.abs(x % 400) < 30) continue;

      if (i >= count) break;
      for (let z = -2000; z < 2000; z += 60) {
        if (Math.abs(z) < 40) continue; // Main St
        if (i >= count) break;
        
        const xPos = x - Math.random() * 10;
        const zPos = z + Math.random() * 10;
        
        const width = 15 + Math.random() * 20;
        const depth = 15 + Math.random() * 20;
        const height = 10 + Math.random() * 60 + (Math.random() > 0.95 ? 100 : 0); 

        tempObj.position.set(xPos, height / 2, zPos);
        tempObj.rotation.set(0, 0, 0);
        tempObj.scale.set(width, height, depth);
        tempObj.updateMatrix();
        meshRef.current.setMatrixAt(i, tempObj.matrix);
        
        const shade = 0.3 + Math.random() * 0.5;
        const color = new Color().setRGB(shade, shade, shade + 0.05);
        meshRef.current.setColorAt(i, color);
        i++;
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  }, []);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.6} metalness={0.1} />
    </instancedMesh>
  );
};

const IslandInstances = () => {
    const count = 8;
    return (
        <group>
            {[...Array(count)].map((_, i) => {
                const x = 300 + Math.random() * 2000;
                const z = (Math.random() - 0.5) * 4000;
                const scale = 50 + Math.random() * 150;
                return (
                    <group key={i} position={[x, -2, z]}>
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

// Helper for island trees
const TreeInstancesIsland = ({ position, radius }: { position: [number, number, number], radius: number }) => {
     // Simple simplified trees for islands
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

const EnvironmentComponent: React.FC = () => {
  return (
    <group>
      {/* --- ATMOSPHERE --- */}
      <Sky distance={450000} sunPosition={[100, 20, 100]} inclination={0} azimuth={0.25} turbidity={8} rayleigh={1.5} />
      <Stars radius={300} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      {/* Clouds */}
      <Cloud opacity={0.5} speed={0.4} bounds={[50, 10, 15]} segments={20} position={[-100, 150, -200]} color="white" />
      <Cloud opacity={0.5} speed={0.4} bounds={[50, 10, 15]} segments={20} position={[-300, 200, 100]} color="white" />
      <Cloud opacity={0.4} speed={0.3} bounds={[100, 20, 20]} segments={30} position={[100, 300, 0]} color="white" />
      <Cloud opacity={0.3} speed={0.2} bounds={[100, 20, 20]} segments={30} position={[-800, 250, 500]} color="#eee" />

      <ambientLight intensity={0.6} />
      <directionalLight 
        position={[50, 100, 50]} 
        intensity={1.5} 
        castShadow 
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-200}
        shadow-camera-right={200}
        shadow-camera-top={200}
        shadow-camera-bottom={-200}
      />

      {/* --- GROUND ZONES --- */}
      
      {/* 1. Ocean (Far Right) - X > 100 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[50100, -3.0, 0]}>
        <planeGeometry args={[100000, 100000]} />
        <meshStandardMaterial color="#006994" roughness={0.1} metalness={0.1} />
      </mesh>
      <IslandInstances />

      {/* 2. Beach (Right) - X: 0 to 100 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[50, -0.3, 0]} receiveShadow>
        <planeGeometry args={[100, 10000]} />
        <meshStandardMaterial color="#eab308" roughness={1} />
      </mesh>

      {/* 3. Airfield 1 Buffer (Center) - X: -100 to 0 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-50, -0.3, 0]} receiveShadow>
        <planeGeometry args={[100, 10000]} />
        <meshStandardMaterial color="#546e44" roughness={1} />
      </mesh>

      {/* 4. City Ground (Left) - X < -100 */}
      {/* Changed color to lighter grey to see roads better */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-50100, -0.3, 0]}>
        <planeGeometry args={[100000, 100000]} />
        <meshStandardMaterial color="#777" roughness={0.9} /> 
      </mesh>

      {/* --- AIRPORTS --- */}
      {/* Airport 1 (Start) */}
      <group position={[-50, -0.3, 0]}>
        <Airport position={[0, 0, 0]} />
      </group>

      {/* Airport 2 (Far Side) */}
      <group position={[-3000, -0.3, 0]}>
          <mesh rotation={[-Math.PI/2, 0, 0]}>
             <planeGeometry args={[200, 2000]} />
             <meshStandardMaterial color="#546e44" roughness={1} />
          </mesh>
          <Airport position={[0, 0, 0]} rotationY={Math.PI} />
      </group>

      {/* --- ROADS --- */}
      {/* Raised to -0.25 to prevent flicker with ground at -0.3 */}
      <group position={[0, 0.05, 0]}> 
        {/* Main Street (Z=0) running through city */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2500, -0.3, 0]}>
            <planeGeometry args={[5000, 40]} />
            <meshStandardMaterial color="#333" />
        </mesh>
        {/* Cross Streets */}
        {[ -400, -800, -1200, -1600, -2000, -2400, -2800, -3200, -3600 ].map(x => (
            <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, -0.3, 0]}>
            <planeGeometry args={[20, 4000]} />
            <meshStandardMaterial color="#333" />
            </mesh>
        ))}
      </group>

      <CityInstances />
      <TreeInstances />

    </group>
  );
};

export const Environment = React.memo(EnvironmentComponent);
