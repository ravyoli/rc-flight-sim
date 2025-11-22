
import { Vector3, Quaternion, Euler, MathUtils } from 'three';
import { Controls } from '../types';
import { BuildingData } from '../components/CityInstances';
import { GRAVITY, PlaneConfig } from '../constants';

export class PhysicsEngine {
  position = new Vector3();
  velocity = new Vector3();
  rotation = new Quaternion();
  throttle = 0;
  gearDeployed = true;
  crashed = false;

  // Smooth input state
  inputState = { pitch: 0, roll: 0, yaw: 0 };

  // Telemetry
  liftForce = 0;
  dragForce = 0;
  thrustForce = 0;

  // Helpers to avoid GC
  private forward = new Vector3();
  private up = new Vector3();
  private right = new Vector3();
  private euler = new Euler();

  constructor() {}

  reset(startPos: Vector3, minAltitude: number) {
    this.position.copy(startPos);
    this.position.y = minAltitude;
    this.velocity.set(0, 0, 0);
    this.rotation.setFromEuler(new Euler(0, 0, 0));
    this.throttle = 0;
    this.crashed = false;
    this.gearDeployed = true;
    this.inputState = { pitch: 0, roll: 0, yaw: 0 };
  }

  update(dt: number, input: Controls, config: PlaneConfig) {
    if (this.crashed) return;
    
    // Cap dt to prevent physics explosion on lag spikes
    const delta = Math.min(dt, 0.1);

    // --- TOGGLE GEAR ---
    if (input.toggleGear) {
      this.gearDeployed = !this.gearDeployed;
      input.toggleGear = false; // Consume event
    }

    const isOnGround = this.position.y <= config.minAltitude + 0.5;

    // --- THROTTLE ---
    if (input.throttleUp) {
        this.throttle = Math.min(this.throttle + config.throttleSpeed * delta, 100);
    }
    if (input.throttleDown) {
        // Allow reverse throttle (up to -25%) only when on ground
        const minThrottle = isOnGround ? -25 : 0;
        this.throttle = Math.max(this.throttle - config.throttleSpeed * delta, minThrottle);
    }
    // Safety: If we leave ground with negative throttle, reset to 0
    if (!isOnGround && this.throttle < 0) {
        this.throttle = Math.min(this.throttle + config.throttleSpeed * delta, 0);
    }

    // --- INPUT PROCESSING & SMOOTHING ---
    const targetPitch = (input.pitchDown ? 1 : 0) - (input.pitchUp ? 1 : 0);
    const targetRoll = (input.rollRight ? -1 : 0) - (input.rollLeft ? -1 : 0);
    const targetYaw = (input.yawLeft ? 1 : 0) - (input.yawRight ? 1 : 0);

    const resp = config.responsiveness;
    this.inputState.pitch = MathUtils.lerp(this.inputState.pitch, targetPitch, delta * resp);
    this.inputState.roll = MathUtils.lerp(this.inputState.roll, targetRoll, delta * resp);
    this.inputState.yaw = MathUtils.lerp(this.inputState.yaw, targetYaw, delta * resp);

    // --- PHYSICS VECTORS ---
    this.forward.set(0, 0, -1).applyQuaternion(this.rotation);
    this.up.set(0, 1, 0).applyQuaternion(this.rotation);
    this.right.set(1, 0, 0).applyQuaternion(this.rotation);

    const currentSpeed = this.velocity.length();
    const altitude = this.position.y;
    const airDensity = Math.max(0.2, 1.0 - (altitude / 500)); 

    const controlAuthority = Math.min(currentSpeed / 10, 1.5) * airDensity + (Math.abs(this.throttle) / 200);
    
    // --- ROTATION ---
    const rotDelta = delta * config.rotSpeed * controlAuthority;
    
    const qPitch = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), this.inputState.pitch * rotDelta);
    const qYaw = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), this.inputState.yaw * rotDelta * 0.6);
    const qRoll = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), this.inputState.roll * rotDelta * 1.8); 

    this.rotation.multiply(qPitch).multiply(qYaw).multiply(qRoll);
    this.rotation.normalize();

    // --- ROTATION LIMITS & BANK-TO-TURN ---
    // Convert to Euler YXZ (Yaw first, then Pitch, then Roll)
    const currentEuler = new Euler().setFromQuaternion(this.rotation, 'YXZ');
    
    // 1. Bank Induced Turn (Aerodynamic)
    if (altitude > config.minAltitude + 0.5) {
        const speedForTurn = Math.max(currentSpeed, 20); 
        // Rate = g * tan(bank) / v
        const turnRate = (GRAVITY * Math.tan(currentEuler.z)) / speedForTurn;
        currentEuler.y += turnRate * delta;
    }

    // 2. Clamping
    if (config.maxPitch) {
        currentEuler.x = MathUtils.clamp(currentEuler.x, -config.maxPitch, config.maxPitch);
    }
    if (config.maxRoll) {
        currentEuler.z = MathUtils.clamp(currentEuler.z, -config.maxRoll, config.maxRoll);
    }
    this.rotation.setFromEuler(currentEuler);

    // --- FORCES ---
    
    // Gravity
    this.velocity.y -= GRAVITY * delta;

    // Thrust
    this.thrustForce = (this.throttle / 100) * config.thrust * airDensity;
    const thrustVector = this.forward.clone().multiplyScalar(this.thrustForce);
    this.velocity.addScaledVector(thrustVector, delta);

    // Lift (Only from forward velocity)
    const forwardSpeed = this.velocity.dot(this.forward);
    this.liftForce = Math.max(0, forwardSpeed) * config.lift * airDensity;
    const liftVector = this.up.clone().multiplyScalar(this.liftForce);
    this.velocity.addScaledVector(liftVector, delta);

    // Drag
    if (currentSpeed > 0) {
      const rawDrag = (currentSpeed * currentSpeed) * config.drag * airDensity;
      const gearDragVal = this.gearDeployed ? config.gearDrag * (currentSpeed * currentSpeed) : 0;
      
      const totalDrag = rawDrag + gearDragVal;
      const clampedDrag = Math.min(totalDrag, currentSpeed / delta); 
      this.dragForce = clampedDrag;
      const dragDir = this.velocity.clone().normalize().negate();
      this.velocity.addScaledVector(dragDir, clampedDrag * delta);
    } else {
      this.dragForce = 0;
    }

    // Side Drag
    const inverseRotation = this.rotation.clone().invert();
    const localVelocity = this.velocity.clone().applyQuaternion(inverseRotation);
    if (Math.abs(localVelocity.x) > 0.01) {
        const sideDrag = -localVelocity.x * currentSpeed * config.sideDrag * delta * airDensity;
        const sideCorrection = new Vector3(sideDrag, 0, 0).applyQuaternion(this.rotation);
        this.velocity.add(sideCorrection);
    }
    
    // Speed Cap
    if (this.velocity.length() > config.maxSpeed) {
      this.velocity.setLength(config.maxSpeed);
    }

    // Update Position
    this.position.addScaledVector(this.velocity, delta);
  }

  checkCollisions(config: PlaneConfig, buildingGrid: { grid: Map<string, BuildingData[]>, cellSize: number }, onCrash: (pos: [number, number, number]) => void, planeType: string) {
      if (this.crashed) return;

      // 1. Ground Collision
      if (this.position.y <= config.minAltitude) {
        const isFallingFast = this.velocity.y < config.crashVelocity; 
        
        // Re-calculate up vector for check
        const worldUp = new Vector3(0, 1, 0).applyQuaternion(this.rotation);
        const isTilted = worldUp.y < 0.5; // > 60 deg tilt
        const isGearUp = !this.gearDeployed;

        if (isFallingFast || isTilted || isGearUp) {
          this.crashed = true;
          onCrash(this.position.toArray());
          return true; // Signal crash
        } else {
          // Landed / Taxiing
          this.position.y = config.minAltitude;
          if (this.velocity.y < 0) this.velocity.y = 0;
          this.velocity.multiplyScalar(0.992); // Ground friction
          
          // Stabilize
          const groundEuler = new Euler().setFromQuaternion(this.rotation, 'YXZ');
          if (Math.abs(this.inputState.pitch) < 0.1) {
               groundEuler.x *= 0.9; 
          }
          groundEuler.z *= 0.9;
          this.rotation.setFromEuler(groundEuler);
        }
      }

      // 2. Building Collision
      if (this.position.y < 170 && this.position.y > -2.0) {
         const px = this.position.x;
         const pz = this.position.z;
         const py = this.position.y;
         const radius = planeType === 'BOEING_737' ? 5 : 1;

         const cx = Math.floor(px / buildingGrid.cellSize);
         const cz = Math.floor(pz / buildingGrid.cellSize);
         
         checkBuildings: for (let x = cx - 1; x <= cx + 1; x++) {
             for (let z = cz - 1; z <= cz + 1; z++) {
                 const cellKey = `${x},${z}`;
                 const cell = buildingGrid.grid.get(cellKey);
                 if (!cell) continue;
                 
                 for (const b of cell) {
                     if (py < -2.0 + b.height + radius) {
                         const halfW = b.width / 2 + radius;
                         const halfD = b.depth / 2 + radius;
                         
                         if (px > b.x - halfW && px < b.x + halfW &&
                             pz > b.z - halfD && pz < b.z + halfD) {
                             
                             this.crashed = true;
                             onCrash(this.position.toArray());
                             return true; // Signal crash
                         }
                     }
                 }
             }
         }
      }
      return false;
  }
}
