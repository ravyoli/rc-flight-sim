
import React, { useRef, useMemo } from 'react';
import { InstancedMesh, Object3D, Color, Vector3, Euler, MathUtils } from 'three';
import { useFrame } from '@react-three/fiber';
import { TrafficState } from './TrafficLightSystem';
import '../types';

// Car Configuration
const COUNT = 400;
const SPEED_MIN = 15; 
const SPEED_MAX = 25; 

const MAIN_ROAD_Z = 0;
const MAIN_ROAD_X_START = -200;
const MAIN_ROAD_X_END = -4800;

const CROSS_ROADS_X = [ -400, -800, -1200, -1600, -2000, -2400, -2800, -3200, -3600 ];
const CROSS_ROAD_Z_START = -2000;
const CROSS_ROAD_Z_END = 2000;

interface CarData {
  position: Vector3;
  velocity: Vector3; 
  baseSpeed: number; 
  rotation: Euler;
  axis: 'x' | 'z';
  laneOffset: number;
}

interface CarInstancesProps {
    trafficState: React.MutableRefObject<TrafficState>;
}

export const CarInstances: React.FC<CarInstancesProps> = ({ trafficState }) => {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);

  // Initialize Cars
  const cars = useMemo(() => {
    const data: CarData[] = [];
    
    for (let i = 0; i < COUNT; i++) {
      const isMainRoad = Math.random() > 0.7; 
      
      let pos = new Vector3();
      let vel = new Vector3();
      let rot = new Euler();
      let axis: 'x' | 'z' = 'x';
      let laneOffset = 0;

      const speed = SPEED_MIN + Math.random() * (SPEED_MAX - SPEED_MIN);
      const dir = Math.random() > 0.5 ? 1 : -1; 

      if (isMainRoad) {
        axis = 'x';
        laneOffset = dir === 1 ? 10 : -10; 
        
        const xPos = MAIN_ROAD_X_START + Math.random() * (MAIN_ROAD_X_END - MAIN_ROAD_X_START);
        // Main Road Height 0.4. Car Height 1.5 (Center 0.75). 
        // Pos Y = 0.4 + 0.75 = 1.15
        pos.set(xPos, 1.15, MAIN_ROAD_Z + laneOffset);
        vel.set(speed * dir, 0, 0);
        rot.set(0, dir === 1 ? Math.PI / 2 : -Math.PI / 2, 0);

      } else {
        axis = 'z';
        const roadX = CROSS_ROADS_X[Math.floor(Math.random() * CROSS_ROADS_X.length)];
        laneOffset = dir === 1 ? -5 : 5;

        const zPos = CROSS_ROAD_Z_START + Math.random() * (CROSS_ROAD_Z_END - CROSS_ROAD_Z_START);
        // Cross Road Height 0.0. Pos Y = 0.75
        pos.set(roadX + laneOffset, 0.75, zPos);
        vel.set(0, 0, speed * dir);
        rot.set(0, dir === 1 ? 0 : Math.PI, 0);
      }

      data.push({ position: pos, velocity: vel, baseSpeed: speed, rotation: rot, axis, laneOffset });
    }
    return data;
  }, []);

  // Animation Loop
  useFrame((state, delta) => {
    if (!meshRef.current) return;

    if (!meshRef.current.userData.colorsSet) {
       const carColors = [
        new Color('#ef4444'), new Color('#3b82f6'), new Color('#eab308'),
        new Color('#ffffff'), new Color('#1f2937'), new Color('#9ca3af'),
       ];
       for (let i = 0; i < COUNT; i++) {
         meshRef.current.setColorAt(i, carColors[Math.floor(Math.random() * carColors.length)]);
       }
       meshRef.current.instanceColor!.needsUpdate = true;
       meshRef.current.userData.colorsSet = true;
    }

    cars.forEach((car, i) => {
      let targetSpeed = car.baseSpeed;
      let shouldStop = false;

      if (car.axis === 'x') {
        // Main Road Cars
        const dir = car.velocity.x >= 0 ? 1 : -1;
        for (let ix of CROSS_ROADS_X) {
            const dist = (ix - car.position.x) * dir;
            // Stop line logic:
            // Intersection is at 'ix'. Width is 20 total.
            // Stop line is roughly at 15.
            // Check if car is approaching (dist > 0) and within range (dist < 50)
            // dist > 18 to prevent stopping INSIDE the intersection if light changes late.
            if (dist > 18 && dist < 50) {
                const light = trafficState.current[ix] || 'MAIN_GO';
                // If Light is CROSS_GO, Main is RED. Stop.
                if (light === 'CROSS_GO') { 
                    shouldStop = true;
                }
                break; 
            }
        }
      } else {
         // Cross Road Cars
         const dir = car.velocity.z >= 0 ? 1 : -1;
         const dist = (MAIN_ROAD_Z - car.position.z) * dir;
         
         // Main road width is 40. Stop at ~25.
         if (dist > 25 && dist < 55) {
             const roadX = CROSS_ROADS_X.find(rx => Math.abs(rx - car.position.x) < 10);
             if (roadX) {
                 const light = trafficState.current[roadX] || 'MAIN_GO';
                 // If Light is MAIN_GO, Cross is RED. Stop.
                 if (light === 'MAIN_GO') {
                     shouldStop = true;
                 }
             }
         }
      }

      if (shouldStop) {
          targetSpeed = 0;
      }

      const currentSpeed = car.velocity.length();
      const newSpeed = MathUtils.lerp(currentSpeed, targetSpeed, delta * 2);
      
      if (car.axis === 'x') {
          car.velocity.set(Math.sign(car.velocity.x || 1) * newSpeed, 0, 0);
      } else {
          car.velocity.set(0, 0, Math.sign(car.velocity.z || 1) * newSpeed);
      }

      car.position.addScaledVector(car.velocity, delta);

      // Reset Loop
      if (car.axis === 'x') {
         if (car.velocity.x > 0 && car.position.x > MAIN_ROAD_X_START) {
            car.position.x = MAIN_ROAD_X_END;
            car.velocity.set(car.baseSpeed, 0, 0);
         }
         else if (car.velocity.x < 0 && car.position.x < MAIN_ROAD_X_END) {
            car.position.x = MAIN_ROAD_X_START;
            car.velocity.set(-car.baseSpeed, 0, 0);
         }
      } else {
         if (car.velocity.z > 0 && car.position.z > CROSS_ROAD_Z_END) {
            car.position.z = CROSS_ROAD_Z_START;
            car.velocity.set(0, 0, car.baseSpeed);
         }
         else if (car.velocity.z < 0 && car.position.z < CROSS_ROAD_Z_START) {
            car.position.z = CROSS_ROAD_Z_END;
            car.velocity.set(0, 0, -car.baseSpeed);
         }
      }

      dummy.position.copy(car.position);
      dummy.rotation.copy(car.rotation);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]} castShadow>
      <boxGeometry args={[2, 1.5, 4.5]} />
      <meshStandardMaterial roughness={0.5} metalness={0.6} />
    </instancedMesh>
  );
};
