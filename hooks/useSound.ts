
import { useRef, useCallback } from 'react';

export const useSound = () => {
  const audioCtx = useRef<AudioContext | null>(null);
  const engineOsc = useRef<OscillatorNode | null>(null);
  const engineGain = useRef<GainNode | null>(null);
  const windNode = useRef<AudioBufferSourceNode | null>(null);
  const windGain = useRef<GainNode | null>(null);
  const initialized = useRef(false);

  const init = useCallback(() => {
    if (initialized.current) return;
    
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    audioCtx.current = new AudioContext();

    // --- Engine Sound (Sawtooth Oscillator) ---
    const osc = audioCtx.current.createOscillator();
    const gain = audioCtx.current.createGain();
    const filter = audioCtx.current.createBiquadFilter();
    
    osc.type = 'sawtooth';
    osc.frequency.value = 60; // Idle RPM
    filter.type = 'lowpass';
    filter.frequency.value = 400; // Muffle the harsh sawtooth
    gain.gain.value = 0; // Start silent

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.current.destination);
    osc.start();

    engineOsc.current = osc;
    engineGain.current = gain;

    // --- Wind Sound (White Noise) ---
    const bufferSize = audioCtx.current.sampleRate * 2;
    const buffer = audioCtx.current.createBuffer(1, bufferSize, audioCtx.current.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const windSource = audioCtx.current.createBufferSource();
    const windG = audioCtx.current.createGain();
    const windF = audioCtx.current.createBiquadFilter();

    windSource.buffer = buffer;
    windSource.loop = true;
    windF.type = 'lowpass';
    windF.frequency.value = 600;
    windG.gain.value = 0;

    windSource.connect(windF);
    windF.connect(windG);
    windG.connect(audioCtx.current.destination);
    windSource.start();

    windNode.current = windSource;
    windGain.current = windG;

    initialized.current = true;
  }, []);

  const update = useCallback((throttle: number, speed: number, crashed: boolean) => {
    if (!initialized.current || !audioCtx.current) return;
    
    // Auto-resume context if browser suspended it (requires user gesture)
    if (audioCtx.current.state === 'suspended') {
      audioCtx.current.resume().catch(() => {});
    }

    const now = audioCtx.current.currentTime;

    // Mute everything on crash
    if (crashed) {
        engineGain.current?.gain.setTargetAtTime(0, now, 0.1);
        windGain.current?.gain.setTargetAtTime(0, now, 0.1);
        return;
    }

    // --- Engine Physics ---
    // Throttle: 0 to 100
    // Pitch: 60Hz idle -> 180Hz max
    const pitch = 60 + (throttle * 1.2); 
    // Volume: 0.05 idle -> 0.25 max (quieter idle)
    const vol = 0.05 + (throttle / 100) * 0.2; 

    engineOsc.current?.frequency.setTargetAtTime(pitch, now, 0.1);
    engineGain.current?.gain.setTargetAtTime(vol, now, 0.1);

    // --- Wind Physics ---
    // Speed: 0 to 60 m/s
    // Volume max 0.4
    const windVol = Math.min((speed / 60) * 0.4, 0.4);
    windGain.current?.gain.setTargetAtTime(windVol, now, 0.1);

  }, []);

  const playCrash = useCallback(() => {
    if (!audioCtx.current) return;
    const t = audioCtx.current.currentTime;
    
    // 1. Noise Burst
    const bufferSize = audioCtx.current.sampleRate;
    const buffer = audioCtx.current.createBuffer(1, bufferSize, audioCtx.current.sampleRate);
    const data = buffer.getChannelData(0);
    for(let i=0; i<bufferSize; i++) data[i] = (Math.random() * 2 - 1);
    
    const noise = audioCtx.current.createBufferSource();
    noise.buffer = buffer;
    
    const noiseGain = audioCtx.current.createGain();
    noiseGain.gain.setValueAtTime(0.8, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 1.0);
    
    noise.connect(noiseGain);
    noiseGain.connect(audioCtx.current.destination);
    noise.start();

    // 2. Low Frequency Boom
    const osc = audioCtx.current.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.exponentialRampToValueAtTime(10, t + 0.5);
    
    const oscGain = audioCtx.current.createGain();
    oscGain.gain.setValueAtTime(0.5, t);
    oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
    
    osc.connect(oscGain);
    oscGain.connect(audioCtx.current.destination);
    osc.start();
    osc.stop(t + 1);

  }, []);

  return { init, update, playCrash };
};
