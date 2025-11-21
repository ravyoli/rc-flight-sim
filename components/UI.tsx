
import React from 'react';
import { FlightState } from '../types';

interface UIProps {
  flightState: FlightState;
  cameraMode: 'GROUND' | 'CHASE';
}

export const UI: React.FC<UIProps> = ({ flightState, cameraMode }) => {
  const isFar = flightState.distance > 800 && cameraMode === 'GROUND';

  // Format vector for display
  const fmtVec = (v: [number, number, number]) => `[${v[0].toFixed(1)}, ${v[1].toFixed(1)}, ${v[2].toFixed(1)}]`;

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 p-6 flex flex-col justify-between">
      {/* Top Bar */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col space-y-4">
          {/* Main Stats */}
          <div className="bg-black/40 backdrop-blur-md p-4 rounded-lg text-white font-mono border border-white/10 shadow-xl">
            <h1 className="text-xl font-bold text-sky-400 mb-2">RC FLIGHT SIM</h1>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
              <span className="text-gray-400">VIEW</span>
              <span className="font-bold text-yellow-300">{cameraMode}</span>
              <span className="text-gray-400">ALTITUDE</span>
              <span>{flightState.altitude.toFixed(1)}m</span>
              <span className="text-gray-400">SPEED</span>
              <span>{(flightState.speed * 3.6).toFixed(0)} km/h</span>
              <span className="text-gray-400">DISTANCE</span>
              <span className={isFar ? 'text-red-400 animate-pulse font-bold' : 'text-white'}>
                {flightState.distance.toFixed(0)}m
              </span>
              <span className="text-gray-400">THROTTLE</span>
              <span className={`${flightState.throttle > 90 ? 'text-red-400' : 'text-green-400'}`}>
                {flightState.throttle.toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Physics Telemetry */}
          <div className="bg-slate-900/80 backdrop-blur-md p-3 rounded-lg text-xs font-mono text-green-300 border border-green-900/50 shadow-lg w-64">
            <h3 className="text-green-500 font-bold mb-1 uppercase border-b border-green-800 pb-1">Physics Telemetry</h3>
            <div className="grid grid-cols-[60px_1fr] gap-y-1">
              <span className="text-slate-400">POS</span>
              <span>{fmtVec(flightState.position)}</span>
              
              <span className="text-slate-400">VEL</span>
              <span>{fmtVec(flightState.physics.velocityVector)}</span>
              
              <span className="text-slate-400">LIFT</span>
              <span>{flightState.physics.liftForce.toFixed(2)} N</span>
              
              <span className="text-slate-400">DRAG</span>
              <span>{flightState.physics.dragForce.toFixed(2)} N</span>
              
              <span className="text-slate-400">THRUST</span>
              <span>{flightState.physics.thrustForce.toFixed(2)} N</span>
            </div>
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur-md p-4 rounded-lg text-white text-xs font-sans border border-white/10 max-w-xs shadow-xl">
          <h3 className="font-bold text-yellow-400 mb-2">CONTROLS</h3>
          <ul className="space-y-1">
            <li className="flex justify-between"><span>↑ / ↓</span> <span>Pitch (Nose Up/Down)</span></li>
            <li className="flex justify-between"><span>← / →</span> <span>Roll (Turn)</span></li>
            <li className="flex justify-between"><span>W / S</span> <span>Throttle</span></li>
            <li className="flex justify-between"><span>A / D</span> <span>Yaw (Rudder)</span></li>
            <li className="flex justify-between"><span>C</span> <span>Switch Camera</span></li>
            <li className="flex justify-between"><span>SPACE</span> <span>Reset Plane</span></li>
          </ul>
        </div>
      </div>

      {/* Center Messages */}
      <div className="flex flex-col justify-center items-center space-y-4">
        {isFar && !flightState.crashed && (
          <div className="bg-yellow-600/80 text-white px-6 py-2 rounded-lg text-lg font-bold shadow-lg backdrop-blur-sm animate-bounce">
            WARNING: TURN BACK
          </div>
        )}
        
        {flightState.crashed && (
          <div className="bg-red-600/90 text-white px-8 py-4 rounded-xl text-2xl font-bold shadow-lg animate-pulse backdrop-blur-md border-2 border-red-400">
            CRASHED! PRESS SPACE TO RESET
          </div>
        )}
      </div>

      {/* Bottom Status */}
      <div className="flex justify-between items-end text-white/60 text-xs">
        <div>Pilot Position: Beach Station 1</div>
        <div>v1.3.0 | Telemetry Update</div>
      </div>
    </div>
  );
};
