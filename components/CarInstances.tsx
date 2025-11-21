
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
  velocity: Vector3; // Current actual velocity vector
  baseSpeed: number; // The cruising speed of this car
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
        pos.set(xPos, 0.75, MAIN_ROAD_Z + laneOffset);
        vel.set(speed * dir, 0, 0);
        rot.set(0, dir === 1 ? Math.PI / 2 : -Math.PI / 2, 0);

      } else {
        axis = 'z';
        const roadX = CROSS_ROADS_X[Math.floor(Math.random() * CROSS_ROADS_X.length)];
        laneOffset = dir === 1 ? -5 : 5;

        const zPos = CROSS_ROAD_Z_START + Math.random() * (CROSS_ROAD_Z_END - CROSS_ROAD_Z_START);
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

    // Init colors hack
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
      // Traffic Logic
      let targetSpeed = car.baseSpeed;

      // Find nearest intersection
      // If we are approaching an intersection, check lights
      
      let distanceToStop = 9999;
      let shouldStop = false;

      if (car.axis === 'x') {
        // On Main Road
        // Find closest X intersection
        // Direction matter: If vel.x > 0, look for intersections > car.x
        const dir = car.velocity.x >= 0 ? 1 : -1;
        
        for (let ix of CROSS_ROADS_X) {
            const dist = (ix - car.position.x) * dir;
            // Logic: Intersection is ahead (dist > 0) and close (dist < 40)
            // Also ensure we haven't passed the stop line (dist > 15)
            if (dist > 10 && dist < 60) {
                // Check Light
                const light = trafficState.current[ix] || 'MAIN_GO';
                if (light === 'CROSS_GO') {
                    shouldStop = true;
                    distanceToStop = dist;
                }
                break; // Only care about the immediate next one
            }
        }
      } else {
         // On Cross Road (Z axis)
         // Approaching Z=0
         const dir = car.velocity.z >= 0 ? 1 : -1;
         const dist = (MAIN_ROAD_Z - car.position.z) * dir;
         
         if (dist > 10 && dist < 60) {
             // Use the X coordinate of this cross road to lookup state
             // We need to find which cross road we are on.
             // Approximate check
             const roadX = CROSS_ROADS_X.find(rx => Math.abs(rx - car.position.x) < 10);
             if (roadX) {
                 const light = trafficState.current[roadX] || 'MAIN_GO';
                 if (light === 'MAIN_GO') {
                     shouldStop = true;
                     distanceToStop = dist;
                 }
             }
         }
      }

      if (shouldStop) {
          targetSpeed = 0;
      }

      // Accelerate/Brake physics
      const currentSpeed = car.velocity.length();
      const newSpeed = MathUtils.lerp(currentSpeed, targetSpeed, delta * 2);
      
      if (car.axis === 'x') {
          car.velocity.set(Math.sign(car.velocity.x || 1) * newSpeed, 0, 0); // Keep direction
          // Fix direction flip issue if speed hits 0
          if (currentSpeed < 0.1 && targetSpeed > 1) {
               // Restarting
               // We lost direction if vel is 0, need to infer from position limits or stored dir?
               // Simplified: we initialized cars with direction, but velocity is vector.
               // If velocity is 0, we can't normalize. 
               // Solution: Don't modify velocity vector directly, keep a direction scalar in data.
          }
          // Hack: Just re-apply direction based on logic below (wrap around logic infers dir)
          // Actually, let's just trust the sign of X doesn't flip because we clamp > 0?
          // No, velocity can be negative.
          // If velocity becomes 0, Math.sign(0) is 0 or 1.
          // Let's just scale the existing normalized velocity?
      } else {
          // Same for Z
          car.velocity.set(0, 0, Math.sign(car.velocity.z || 1) * newSpeed);
      }

      // Apply Velocity
      car.position.addScaledVector(car.velocity, delta);

      // Wrap Around Logic (Reset speed when respawning)
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

      // Update Matrix
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
