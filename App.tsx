
import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Vector3, Quaternion, Euler, MathUtils, PerspectiveCamera } from 'three';
import { Environment } from './components/Environment';
import { Plane } from './components/Plane';
import { UI } from './components/UI';
import { Explosion } from './components/Explosion';
import { FlightState, Controls } from './types';
import { useSound } from './hooks/useSound';

// Constants for physics tuning
const GRAVITY = 9.81;
const LIFT_COEFFICIENT = 0.5; 
const DRAG_COEFFICIENT = 0.02;
const SIDE_DRAG_COEFFICIENT = 1.0;
const THRUST_POWER = 50.0;
const ROTATION_SPEED = 1.2;
const MAX_SPEED = 60.0;
const GROUND_Y = 0.1;

const Simulation: React.FC<{ 
  setFlightState: (state: FlightState) => void, 
  controls: React.MutableRefObject<Controls>,
  cameraMode: 'GROUND' | 'CHASE',
  onCrash: (pos: [number, number, number]) => void
}> = ({ setFlightState, controls, cameraMode, onCrash }) => {
  const planeRef = useRef<any>(null);
  const { camera } = useThree();
  const perspectiveCamera = camera as PerspectiveCamera;
  
  // Audio Hook
  const { init: initSound, update: updateSound, playCrash } = useSound();

  // Physics State
  // Spawn on the new runway at x=-50
  const position = useRef(new Vector3(-50, 0.5, 0));
  const velocity = useRef(new Vector3(0, 0, 0));
  const rotation = useRef(new Quaternion());
  const throttle = useRef(0);
  const crashed = useRef(false);

  // Helper vectors
  const forward = useRef(new Vector3());
  const up = useRef(new Vector3());
  const right = useRef(new Vector3());
  const euler = useRef(new Euler());
  
  // Pilot stands on the grass near the runway (X=-30)
  const pilotPos = useRef(new Vector3(-30, 1.7, 50));

  useEffect(() => {
    camera.position.copy(pilotPos.current);
    camera.lookAt(position.current);
  }, [camera]);

  // Initialize sound on first interaction
  useEffect(() => {
    const handleInter = () => initSound();
    window.addEventListener('keydown', handleInter);
    window.addEventListener('mousedown', handleInter);
    return () => {
      window.removeEventListener('keydown', handleInter);
      window.removeEventListener('mousedown', handleInter);
    }
  }, [initSound]);

  useFrame((state, delta) => {
    if (!planeRef.current) return;

    let dt = delta;
    if (dt > 0.1) dt = 0.1; 
    
    if (isNaN(position.current.x) || isNaN(velocity.current.x)) {
       controls.current.reset = true;
    }

    const input = controls.current;

    // --- RESET LOGIC ---
    if (input.reset) {
      position.current.set(-50, 0.5, 0);
      velocity.current.set(0, 0, 0);
      rotation.current.setFromEuler(new Euler(0, 0, 0));
      throttle.current = 0;
      crashed.current = false;
      planeRef.current.position.copy(position.current);
      planeRef.current.rotation.setFromQuaternion(rotation.current);
      perspectiveCamera.fov = 50;
      perspectiveCamera.updateProjectionMatrix();
      
      // Reset Sound
      updateSound(0, 0, false);
      return;
    }

    if (crashed.current) return;

    // --- INPUT PROCESSING ---
    if (input.throttleUp) throttle.current = Math.min(throttle.current + 80 * dt, 100);
    if (input.throttleDown) throttle.current = Math.max(throttle.current - 80 * dt, 0);

    forward.current.set(0, 0, -1).applyQuaternion(rotation.current);
    up.current.set(0, 1, 0).applyQuaternion(rotation.current);
    right.current.set(1, 0, 0).applyQuaternion(rotation.current);

    const currentSpeed = velocity.current.length();
    const distance = position.current.distanceTo(pilotPos.current);

    const altitude = position.current.y;
    const airDensity = Math.max(0.2, 1.0 - (altitude / 500)); 

    const controlAuthority = Math.min(currentSpeed / 10, 1.5) * airDensity + (throttle.current / 200);
    
    const pitchInput = (input.pitchDown ? 1 : 0) - (input.pitchUp ? 1 : 0);
    const rollInput = (input.rollRight ? -1 : 0) - (input.rollLeft ? -1 : 0);
    const yawInput = (input.yawLeft ? 1 : 0) - (input.yawRight ? 1 : 0);

    const rotDelta = dt * ROTATION_SPEED * controlAuthority;
    
    const qPitch = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), pitchInput * rotDelta);
    const qYaw = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), yawInput * rotDelta * 0.6);
    const qRoll = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), rollInput * rotDelta * 1.8); 

    rotation.current.multiply(qPitch).multiply(qYaw).multiply(qRoll);
    rotation.current.normalize();

    // --- LINEAR PHYSICS ---
    velocity.current.y -= GRAVITY * dt;

    const thrustForceVal = (throttle.current / 100) * THRUST_POWER * airDensity;
    const thrustVector = forward.current.clone().multiplyScalar(thrustForceVal);
    velocity.current.addScaledVector(thrustVector, dt);

    const liftForceVal = currentSpeed * LIFT_COEFFICIENT * airDensity;
    const liftVector = up.current.clone().multiplyScalar(liftForceVal);
    velocity.current.addScaledVector(liftVector, dt);

    let dragForceVal = 0;
    if (currentSpeed > 0) {
      const rawDrag = (currentSpeed * currentSpeed) * DRAG_COEFFICIENT * airDensity;
      const clampedDrag = Math.min(rawDrag, currentSpeed / dt); // Prevent drag from reversing velocity
      dragForceVal = clampedDrag;
      const dragDir = velocity.current.clone().normalize().negate();
      velocity.current.addScaledVector(dragDir, clampedDrag * dt);
    }

    const inverseRotation = rotation.current.clone().invert();
    const localVelocity = velocity.current.clone().applyQuaternion(inverseRotation);
    if (Math.abs(localVelocity.x) > 0.01) {
        const sideDrag = -localVelocity.x * currentSpeed * SIDE_DRAG_COEFFICIENT * dt * airDensity;
        const sideCorrection = new Vector3(sideDrag, 0, 0).applyQuaternion(rotation.current);
        velocity.current.add(sideCorrection);
    }
    
    if (velocity.current.length() > MAX_SPEED) {
      velocity.current.setLength(MAX_SPEED);
    }

    // Collision
    if (position.current.y <= GROUND_Y) {
      // EXTREMELY Relaxed Crash Thresholds for easier landing
      // Can land incredibly hard (up to 18m/s vertical impact - that's 64 km/h downwards!)
      const isFallingFast = velocity.current.y < -18.0; 
      // Can land with extreme tilt (up to ~75 degrees)
      const isTilted = Math.abs(rotation.current.x) > 1.3 || Math.abs(rotation.current.z) > 1.3;

      if (isFallingFast || isTilted) {
        crashed.current = true;
        onCrash(position.current.toArray());
        playCrash(); // Play sound
      } else {
        position.current.y = GROUND_Y;
        if (velocity.current.y < 0) velocity.current.y = 0;
        velocity.current.multiplyScalar(0.992);
        
        // Auto-level plane on ground (Very Strong correction to prevent tipping)
        const currentEuler = new Euler().setFromQuaternion(rotation.current);
        currentEuler.z *= 0.6; // Snappier upright
        currentEuler.x *= 0.6; // Snappier upright
        rotation.current.setFromEuler(currentEuler);
      }
    }

    position.current.addScaledVector(velocity.current, dt);

    planeRef.current.position.copy(position.current);
    planeRef.current.rotation.setFromQuaternion(rotation.current);

    // --- AUDIO UPDATE ---
    updateSound(throttle.current, currentSpeed, crashed.current);

    // --- CAMERA LOGIC ---
    if (cameraMode === 'GROUND') {
      camera.position.copy(pilotPos.current);
      camera.lookAt(position.current);
      
      const baseFov = 50;
      const minFov = 10;
      const targetFov = MathUtils.clamp(
        MathUtils.mapLinear(distance, 50, 1500, baseFov, minFov),
        minFov,
        baseFov
      );
      perspectiveCamera.fov = MathUtils.lerp(perspectiveCamera.fov, targetFov, dt * 2);
      perspectiveCamera.updateProjectionMatrix();
    } else {
      // Chase Camera
      const heading = forward.current.clone();
      heading.y = 0; 
      if (heading.lengthSq() > 0.001) {
        heading.normalize();
      } else {
        const currentOffset = camera.position.clone().sub(position.current);
        currentOffset.y = 0;
        if (currentOffset.lengthSq() > 0.1) heading.copy(currentOffset).normalize().negate();
        else heading.set(0, 0, 1);
      }

      const targetCamPos = position.current.clone()
        .sub(heading.multiplyScalar(12))
        .add(new Vector3(0, 6, 0));

      camera.position.lerp(targetCamPos, dt * 5);
      
      const lookAtPoint = position.current.clone().add(forward.current.clone().multiplyScalar(5));
      camera.lookAt(lookAtPoint);

      if (perspectiveCamera.fov !== 60) {
        perspectiveCamera.fov = 60;
        perspectiveCamera.updateProjectionMatrix();
      }
    }

    setFlightState({
      position: position.current.toArray(),
      rotation: [euler.current.x, euler.current.y, euler.current.z],
      speed: velocity.current.length(),
      throttle: throttle.current,
      altitude: position.current.y,
      distance: distance,
      crashed: crashed.current,
      physics: {
        velocityVector: velocity.current.toArray(),
        liftForce: liftForceVal,
        dragForce: dragForceVal,
        thrustForce: thrustForceVal
      }
    });
  });

  return (
    <Plane ref={planeRef} throttle={throttle.current} />
  );
};

const App: React.FC = () => {
  const [flightState, setFlightState] = useState<FlightState>({
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    speed: 0,
    throttle: 0,
    altitude: 0,
    distance: 0,
    crashed: false,
    physics: {
      velocityVector: [0,0,0],
      liftForce: 0,
      dragForce: 0,
      thrustForce: 0
    }
  });
  
  const [cameraMode, setCameraMode] = useState<'GROUND' | 'CHASE'>('CHASE');
  const [crashPosition, setCrashPosition] = useState<[number, number, number] | null>(null);

  const controls = useRef<Controls>({
    pitchUp: false, pitchDown: false,
    rollLeft: false, rollRight: false,
    throttleUp: false, throttleDown: false,
    yawLeft: false, yawRight: false,
    reset: false
  });

  useEffect(() => {
    const handleKey = (e: KeyboardEvent, isDown: boolean) => {
      if (e.code === 'KeyC' && isDown) {
        setCameraMode(prev => prev === 'GROUND' ? 'CHASE' : 'GROUND');
      }
      switch (e.code) {
        case 'ArrowUp': controls.current.pitchUp = isDown; break;
        case 'ArrowDown': controls.current.pitchDown = isDown; break;
        case 'ArrowLeft': controls.current.rollLeft = isDown; break;
        case 'ArrowRight': controls.current.rollRight = isDown; break;
        case 'KeyW': controls.current.throttleUp = isDown; break;
        case 'KeyS': controls.current.throttleDown = isDown; break;
        case 'KeyA': controls.current.yawLeft = isDown; break;
        case 'KeyD': controls.current.yawRight = isDown; break;
        case 'Space': 
          controls.current.reset = isDown; 
          if(isDown) setCrashPosition(null); 
          break;
      }
    };
    window.addEventListener('keydown', (e) => handleKey(e, true));
    window.addEventListener('keyup', (e) => handleKey(e, false));
    return () => {
      window.removeEventListener('keydown', (e) => handleKey(e, true));
      window.removeEventListener('keyup', (e) => handleKey(e, false));
    };
  }, []);

  const handleCrash = (pos: [number, number, number]) => {
    setCrashPosition(pos);
  };

  return (
    <div className="w-full h-screen bg-sky-300">
      <UI flightState={flightState} cameraMode={cameraMode} />
      <Canvas shadows camera={{ position: [-30, 1.7, 50], fov: 50, far: 20000 }}>
        <Environment />
        {crashPosition && <Explosion position={crashPosition} />}
        <Simulation 
          setFlightState={setFlightState} 
          controls={controls} 
          cameraMode={cameraMode} 
          onCrash={handleCrash}
        />
      </Canvas>
    </div>
  );
};

export default App;
