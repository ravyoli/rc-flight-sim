import React from 'react';

export type PlaneType = 'SMALL' | 'BOEING_737';

export interface FlightState {
  position: [number, number, number];
  rotation: [number, number, number]; // Euler angles
  speed: number;
  throttle: number;
  altitude: number;
  distance: number; // Distance from pilot
  crashed: boolean;
  gearDeployed: boolean;
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
  toggleGear: boolean;
}

// Augment JSX namespace to support React Three Fiber intrinsic elements
// We augment both the global JSX namespace and the React module JSX namespace
// to ensure compatibility with different TypeScript and React type definitions.

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
      circleGeometry: any;
    }
  }
}

declare module 'react' {
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
      circleGeometry: any;
    }
  }
}