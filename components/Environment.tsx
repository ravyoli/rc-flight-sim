
import React, { useRef, useMemo } from 'react';
import { Sky, Stars, Cloud } from '@react-three/drei';
import { Airport } from './Airport';
import { CityInstances } from './CityInstances';
import { TreeInstances } from './TreeInstances';
import { IslandInstances } from './IslandInstances';
import { CarInstances } from './CarInstances';
import { BirdInstances } from './BirdInstances';
import { TrafficLightSystem, TrafficState } from './TrafficLightSystem';
import { RoadMarkings } from './RoadMarkings';
import '../types';

const CROSS_ROADS_X = [ -400, -800, -1200, -1600, -2000, -2400, -2800, -3200, -3600 ];

// --- NEW LAYER SYSTEM ---
// Ocean: -10.0
// Ground (Grass/City): -2.0
// Cross Roads: 0.0
// Main Road: 0.4
// Sidewalks: 0.55

const EnvironmentComponent: React.FC = () => {
  const trafficState = useRef<TrafficState>({});
  if (Object.keys(trafficState.current).length === 0) {
      CROSS_ROADS_X.forEach(x => trafficState.current[x] = 'MAIN_GO');
  }

  const clouds = useMemo(() => {
    return [...Array(30)].map((_, i) => ({
      position: [
        (Math.random() - 0.5) * 4000,
        200 + Math.random() * 200,
        (Math.random() - 0.5) * 4000
      ] as [number, number, number],
      opacity: 0.3 + Math.random() * 0.3,
      speed: 0.1 + Math.random() * 0.3,
      seed: Math.random() * 1000
    }));
  }, []);

  return (
    <group>
      {/* --- ATMOSPHERE --- */}
      <Sky distance={450000} sunPosition={[100, 20, 100]} inclination={0} azimuth={0.25} turbidity={8} rayleigh={1.5} />
      <Stars radius={300} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      {clouds.map((cloud, i) => (
        <Cloud 
          key={i}
          opacity={cloud.opacity} 
          speed={cloud.speed} 
          bounds={[100, 20, 20]} 
          segments={20} 
          position={cloud.position} 
          color="white" 
          seed={cloud.seed}
        />
      ))}

      <ambientLight intensity={0.6} />
      <directionalLight 
        position={[50, 100, 50]} 
        intensity={1.5} 
        castShadow 
        shadow-bias={-0.0005} 
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-200}
        shadow-camera-right={200}
        shadow-camera-top={200}
        shadow-camera-bottom={-200}
      />

      {/* --- GROUND ZONES (Level -2.0) --- */}
      
      {/* 1. Ocean (Far Right) - Level -10.0 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[50100, -10.0, 0]}>
        <planeGeometry args={[100000, 100000]} />
        <meshStandardMaterial color="#006994" roughness={0.1} metalness={0.1} />
      </mesh>
      <IslandInstances />

      {/* 2. Beach (Right) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[50, -2.0, 0]} receiveShadow>
        <planeGeometry args={[100, 10000]} />
        <meshStandardMaterial color="#eab308" roughness={1} />
      </mesh>

      {/* 3. Airfield 1 Buffer (Center) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-50, -2.0, 0]} receiveShadow>
        <planeGeometry args={[100, 10000]} />
        <meshStandardMaterial color="#546e44" roughness={1} />
      </mesh>

      {/* 4. City Ground (Left) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-50100, -2.0, 0]} receiveShadow>
        <planeGeometry args={[100000, 100000]} />
        <meshStandardMaterial color="#777" roughness={0.9} /> 
      </mesh>
      {/* Second Airfield Ground patch */}
       <mesh rotation={[-Math.PI/2, 0, 0]} position={[-3000, -2.0, 0]}>
             <planeGeometry args={[200, 2000]} />
             <meshStandardMaterial color="#546e44" roughness={1} />
       </mesh>


      {/* --- AIRPORTS --- */}
      <group position={[-50, 0, 0]}>
        <Airport position={[0, 0, 0]} />
      </group>
      <group position={[-3000, 0, 0]}>
          <Airport position={[0, 0, 0]} rotationY={Math.PI} />
      </group>

      {/* --- ROADS & SIDEWALKS --- */}
      <group position={[0, 0, 0]}> 
        
        {/* MAIN ROAD - Level 0.4 */}
        <group>
             {/* Tarmac */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2500, 0.4, 0]} receiveShadow>
                <planeGeometry args={[5000, 40]} />
                <meshStandardMaterial color="#333" />
            </mesh>
            {/* Sidewalks (Level 0.55) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2500, 0.55, 22]} receiveShadow>
                <planeGeometry args={[5000, 4]} />
                <meshStandardMaterial color="#9ca3af" />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2500, 0.55, -22]} receiveShadow>
                <planeGeometry args={[5000, 4]} />
                <meshStandardMaterial color="#9ca3af" />
            </mesh>
        </group>
        
        {/* CROSS STREETS - Level 0.0 */}
        {CROSS_ROADS_X.map(x => (
            <group key={x}>
                {/* Tarmac */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.0, 0]} receiveShadow>
                    <planeGeometry args={[20, 4000]} />
                    <meshStandardMaterial color="#333" />
                </mesh>
                {/* Sidewalks - Level 0.55 (Same as main sidewalks for seamless curb) */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x - 12, 0.55, 0]} receiveShadow>
                    <planeGeometry args={[4, 4000]} />
                    <meshStandardMaterial color="#9ca3af" />
                </mesh>
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x + 12, 0.55, 0]} receiveShadow>
                    <planeGeometry args={[4, 4000]} />
                    <meshStandardMaterial color="#9ca3af" />
                </mesh>
            </group>
        ))}
      </group>

      <RoadMarkings />
      <TrafficLightSystem intersections={CROSS_ROADS_X} stateRef={trafficState} />
      <CityInstances />
      <TreeInstances />
      <CarInstances trafficState={trafficState} />
      <BirdInstances />

    </group>
  );
};

export const Environment = React.memo(EnvironmentComponent);
