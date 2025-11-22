
import { Controls } from '../types';

export class InputManager {
  controls: Controls = {
    pitchUp: false, pitchDown: false,
    rollLeft: false, rollRight: false,
    throttleUp: false, throttleDown: false,
    yawLeft: false, yawRight: false,
    reset: false,
    toggleGear: false
  };

  constructor() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  dispose() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }

  private handleKeyDown(e: KeyboardEvent) {
    this.updateKey(e.code, true);
    // Toggle triggers on keydown only
    if (e.code === 'KeyG') {
        this.controls.toggleGear = true;
    }
  }

  private handleKeyUp(e: KeyboardEvent) {
    this.updateKey(e.code, false);
  }

  private updateKey(code: string, isDown: boolean) {
    switch (code) {
      case 'ArrowUp': this.controls.pitchUp = isDown; break;
      case 'ArrowDown': this.controls.pitchDown = isDown; break;
      case 'ArrowLeft': this.controls.rollLeft = isDown; break;
      case 'ArrowRight': this.controls.rollRight = isDown; break;
      case 'KeyW': this.controls.throttleUp = isDown; break;
      case 'KeyS': this.controls.throttleDown = isDown; break;
      case 'KeyA': this.controls.yawLeft = isDown; break;
      case 'KeyD': this.controls.yawRight = isDown; break;
      case 'Space': this.controls.reset = isDown; break;
    }
  }
}
