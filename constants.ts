
import { PlaneType } from './types';

export const GRAVITY = 9.81;

export interface PlaneConfig {
  lift: number;
  drag: number;
  sideDrag: number;
  thrust: number;
  rotSpeed: number;
  maxSpeed: number;
  minAltitude: number;
  crashVelocity: number;
  responsiveness: number;
  throttleSpeed: number;
  gearDrag: number;
  maxPitch?: number;
  maxRoll?: number;
}

export const PLANE_CONFIGS: Record<PlaneType, PlaneConfig> = {
  SMALL: {
    lift: 0.35,
    drag: 0.008,
    sideDrag: 1.0,
    thrust: 35.0,
    rotSpeed: 1.2,
    maxSpeed: 180.0,
    minAltitude: 0.85, 
    crashVelocity: -18.0,
    responsiveness: 8.0, // Snappy controls
    throttleSpeed: 80.0, // Fast engine response
    gearDrag: 0.005,
    maxPitch: 1.2, // ~70 degrees
    maxRoll: 1.2   // ~70 degrees
  },
  BOEING_737: {
    lift: 0.10, // Reduced lift to require more speed
    drag: 0.0004, // Very low drag for high speed and fast descent
    sideDrag: 0.3, // Heavy inertia
    thrust: 55.0, // Much higher thrust for speed
    rotSpeed: 0.5, // Controlled rotation
    maxSpeed: 450.0, // High top speed
    minAltitude: 2.0, 
    crashVelocity: -25.0,
    responsiveness: 1.2, // Improved responsiveness
    throttleSpeed: 30.0, 
    gearDrag: 0.004,
    maxPitch: 0.6, // ~35 degrees
    maxRoll: 0.8   // ~45 degrees
  }
};
