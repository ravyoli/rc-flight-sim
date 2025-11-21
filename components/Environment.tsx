
import React, { useRef } from 'react';
import { Sky, Stars, Cloud } from '@react-three/drei';
import { Airport } from './Airport';
import { CityInstances } from './CityInstances';
import { TreeInstances } from './TreeInstances';
import { IslandInstances } from './IslandInstances';
import { CarInstances } from './CarInstances';
import { BirdInstances } from './BirdInstances';
import { TrafficLightSystem, TrafficState } from './TrafficLightSystem';
import '../types';

const CROSS_ROADS_X = [ -400, -800, -1200, -1600, -2000, -2400, -2800, -3200, -3600 ];

const EnvironmentComponent: React.FC = () => {
  // Initialize Traffic State (All start Green for Main Road)
  const trafficState = useRef<TrafficState>({});
  // Set defaults once
  if (Object.keys(trafficState.current).length === 0) {
      CROSS_ROADS_X.forEach(x => trafficState.current[x] = 'MAIN_GO');
  }

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
      {/* Lowered to -0.35 to prevent z-fighting with roads (-0.25) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-50100, -0.35, 0]}>
        <planeGeometry args={[100000, 100000]} />
        <meshStandardMaterial color="#777" roughness={0.9} /> 
      </mesh>

      {/* --- AIRPORTS --- */}
      <group position={[-50, -0.3, 0]}>
        <Airport position={[0, 0, 0]} />
      </group>
      <group position={[-3000, -0.3, 0]}>
          <mesh rotation={[-Math.PI/2, 0, 0]}>
             <planeGeometry args={[200, 2000]} />
             <meshStandardMaterial color="#546e44" roughness={1} />
          </mesh>
          <Airport position={[0, 0, 0]} rotationY={Math.PI} />
      </group>

      {/* --- ROADS --- */}
      {/* Adjusted heights for proper stacking: CityGround (-0.35) < MainRoad (-0.25) < CrossRoad (-0.20) */}
      <group position={[0, 0, 0]}> 
        {/* Main Street (Z=0) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2500, -0.25, 0]}>
            <planeGeometry args={[5000, 40]} />
            <meshStandardMaterial color="#333" />
        </mesh>
        
        {/* Cross Streets */}
        {CROSS_ROADS_X.map(x => (
            <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, -0.20, 0]}>
            <planeGeometry args={[20, 4000]} />
            <meshStandardMaterial color="#333" />
            </mesh>
        ))}
      </group>

      <TrafficLightSystem intersections={CROSS_ROADS_X} stateRef={trafficState} />
      <CityInstances />
      <TreeInstances />
      <CarInstances trafficState={trafficState} />
      <BirdInstances />

    </group>
  );
};

export const Environment = React.memo(EnvironmentComponent);
