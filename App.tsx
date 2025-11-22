
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Vector3, MathUtils, PerspectiveCamera, Euler } from 'three';
import { Environment } from './components/Environment';
import { Plane } from './components/Plane';
import { Boeing737 } from './components/Boeing737';
import { UI } from './components/UI';
import { Explosion } from './components/Explosion';
import { FlightState, PlaneType } from './types';
import { useSound } from './hooks/useSound';
import { getCityBuildings, BuildingData } from './components/CityInstances';
import { InputManager } from './utils/InputManager';
import { PhysicsEngine } from './utils/PhysicsEngine';
import { PLANE_CONFIGS } from './constants';

const Simulation: React.FC<{ 
  setFlightState: (state: FlightState) => void, 
  inputManager: InputManager,
  cameraMode: 'GROUND' | 'CHASE',
  onCrash: (pos: [number, number, number]) => void,
  planeType: PlaneType,
  resetKey: number
}> = ({ setFlightState, inputManager, cameraMode, onCrash, planeType, resetKey }) => {
  const planeRef = useRef<any>(null);
  const { camera } = useThree();
  const perspectiveCamera = camera as PerspectiveCamera;
  
  const { init: initSound, update: updateSound, playCrash } = useSound();
  const pilotPos = useRef(new Vector3(-30, 0, 50));
  const physics = useMemo(() => new PhysicsEngine(), []);

  const config = PLANE_CONFIGS[planeType];

  // Reset when plane type or key changes
  useEffect(() => {
    const startPos = new Vector3(-50, config.minAltitude, 0);
    physics.reset(startPos, config.minAltitude);
    
    if (planeRef.current) {
       planeRef.current.position.copy(physics.position);
       planeRef.current.rotation.setFromQuaternion(physics.rotation);
    }
  }, [planeType, resetKey, config.minAltitude, physics]);

  const buildingGrid = useMemo(() => {
      const grid = new Map<string, BuildingData[]>();
      const cellSize = 200;
      const buildings = getCityBuildings();
      
      buildings.forEach(b => {
          const k = `${Math.floor(b.x / cellSize)},${Math.floor(b.z / cellSize)}`;
          if (!grid.has(k)) grid.set(k, []);
          grid.get(k)!.push(b);
      });
      return { grid, cellSize };
  }, []);

  useEffect(() => {
    camera.position.copy(pilotPos.current);
    camera.lookAt(physics.position);
  }, [camera, physics.position]);

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

    if (isNaN(physics.position.x)) {
        // Emergency reset if physics explodes
        const startPos = new Vector3(-50, config.minAltitude, 0);
        physics.reset(startPos, config.minAltitude);
    }

    const controls = inputManager.controls;
    
    // --- UPDATE PHYSICS ---
    physics.update(delta, controls, config);
    
    // --- CHECK COLLISIONS ---
    const hasCrashed = physics.checkCollisions(config, buildingGrid, onCrash, planeType);
    if (hasCrashed) {
        playCrash();
    }

    // --- UPDATE VISUALS ---
    planeRef.current.position.copy(physics.position);
    planeRef.current.rotation.setFromQuaternion(physics.rotation);

    // --- UPDATE SOUND ---
    updateSound(Math.abs(physics.throttle), physics.velocity.length(), physics.crashed);

    // --- UPDATE CAMERA ---
    const distance = physics.position.distanceTo(pilotPos.current);
    
    if (cameraMode === 'GROUND') {
      camera.position.copy(pilotPos.current);
      camera.lookAt(physics.position);
      
      const baseFov = 50;
      const minFov = 10;
      const targetFov = MathUtils.clamp(
        MathUtils.mapLinear(distance, 50, 1500, baseFov, minFov),
        minFov,
        baseFov
      );
      perspectiveCamera.fov = MathUtils.lerp(perspectiveCamera.fov, targetFov, delta * 2);
      perspectiveCamera.updateProjectionMatrix();
    } else {
      // Chase Camera
      const heading = physics.velocity.clone().normalize();
      if (heading.lengthSq() < 0.001) heading.set(0, 0, -1).applyQuaternion(physics.rotation);
      // Fallback if vertical
      if (Math.abs(heading.y) > 0.9) heading.set(0, 0, -1).applyQuaternion(physics.rotation);
      heading.y = 0;
      heading.normalize();

      const chaseDist = planeType === 'BOEING_737' ? 30 : 12;
      const chaseHeight = planeType === 'BOEING_737' ? 10 : 6;

      const targetCamPos = physics.position.clone()
        .sub(heading.multiplyScalar(chaseDist))
        .add(new Vector3(0, chaseHeight, 0));

      camera.position.lerp(targetCamPos, delta * 5);
      
      // Look a bit ahead of the plane
      const lookAtPoint = physics.position.clone().add(physics.velocity.clone().normalize().multiplyScalar(20));
      camera.lookAt(lookAtPoint);

      if (perspectiveCamera.fov !== 60) {
        perspectiveCamera.fov = 60;
        perspectiveCamera.updateProjectionMatrix();
      }
    }

    // --- SYNC STATE TO UI ---
    setFlightState({
      position: physics.position.toArray(),
      rotation: new Euler().setFromQuaternion(physics.rotation).toArray() as [number, number, number],
      speed: physics.velocity.length(),
      throttle: physics.throttle,
      altitude: physics.position.y,
      distance: distance,
      crashed: physics.crashed,
      gearDeployed: physics.gearDeployed,
      physics: {
        velocityVector: physics.velocity.toArray(),
        liftForce: physics.liftForce,
        dragForce: physics.dragForce,
        thrustForce: physics.thrustForce
      }
    });
  });

  return (
    <>
      {planeType === 'SMALL' ? (
        <Plane key={resetKey} ref={planeRef} throttle={physics.throttle} gearDeployed={physics.gearDeployed} />
      ) : (
        <Boeing737 key={resetKey} ref={planeRef} throttle={physics.throttle} gearDeployed={physics.gearDeployed} />
      )}
    </>
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
    gearDeployed: true,
    physics: {
      velocityVector: [0,0,0],
      liftForce: 0,
      dragForce: 0,
      thrustForce: 0
    }
  });
  
  const [cameraMode, setCameraMode] = useState<'GROUND' | 'CHASE'>('CHASE');
  const [planeType, setPlaneType] = useState<PlaneType>('SMALL');
  const [crashPosition, setCrashPosition] = useState<[number, number, number] | null>(null);
  const [resetKey, setResetKey] = useState(0);

  // Initialize Input Manager
  const inputManager = useMemo(() => new InputManager(), []);

  useEffect(() => {
    return () => inputManager.dispose();
  }, [inputManager]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyC') {
        setCameraMode(prev => prev === 'GROUND' ? 'CHASE' : 'GROUND');
      }
      if (e.code === 'Space') {
        setCrashPosition(null); 
        setResetKey(p => p + 1);
        inputManager.controls.reset = true;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [inputManager]);

  const handleCrash = (pos: [number, number, number]) => {
    setCrashPosition(pos);
  };

  const handleSetPlaneType = (type: PlaneType) => {
    setPlaneType(type);
    setCrashPosition(null);
    setResetKey(p => p + 1);
    inputManager.controls.reset = true; 
  };

  return (
    <div className="w-full h-screen bg-sky-300">
      <UI 
        flightState={flightState} 
        cameraMode={cameraMode} 
        planeType={planeType}
        setPlaneType={handleSetPlaneType}
      />
      <Canvas shadows camera={{ position: [-30, 0, 50], fov: 50, far: 20000 }}>
        <Environment />
        {crashPosition && <Explosion position={crashPosition} />}
        <Simulation 
          setFlightState={setFlightState} 
          inputManager={inputManager}
          cameraMode={cameraMode} 
          onCrash={handleCrash} 
          planeType={planeType}
          resetKey={resetKey}
        />
      </Canvas>
    </div>
  );
};

export default App;
