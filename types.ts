
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
