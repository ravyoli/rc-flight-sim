import React from 'react';

export interface FlightState {
  position: [number, number, number];
  rotation: [number, number, number]; // Euler angles
  speed: number;
  throttle: number;
  altitude: number;
  distance: number; // Distance from pilot
  crashed: boolean;
  physics: {
    velocityVector: [number, number, number];
    liftForce: number;
    dragForce: number;
    thrustForce: number;
  };
}

export interface Controls {
  pitchUp: boolean;
  pitchDown: boolean;
  rollLeft: boolean;
  rollRight: boolean;
  throttleUp: boolean;
  throttleDown: boolean;
  yawLeft: boolean;
  yawRight: boolean;
  reset: boolean;
}

// Augment JSX namespace to support React Three Fiber intrinsic elements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      boxGeometry: any;
      meshStandardMaterial: any;
      cylinderGeometry: any;
      coneGeometry: any;
      planeGeometry: any;
      instancedMesh: any;
      ambientLight: any;
      directionalLight: any;
      sphereGeometry: any;
      dodecahedronGeometry: any;
    }
  }
}
