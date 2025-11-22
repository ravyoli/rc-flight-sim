
import React, { useRef, useMemo, useLayoutEffect } from 'react';
import { InstancedMesh, Object3D, Color, CanvasTexture, RepeatWrapping } from 'three';
import '../types';

export interface BuildingData {
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  color: Color;
}

const createSeededRandom = (s: number) => {
  let seed = s;
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
};

export const getCityBuildings = (): BuildingData[] => {
  const buildings: BuildingData[] = [];
  const count = 4000;
  const rng = createSeededRandom(12345);
  
  let i = 0;
  for (let x = -200; x > -4000; x -= 60) {
    if (Math.abs(x - (-3000)) < 80) continue;
    if (Math.abs(x % 400) < 30) continue;

    if (i >= count) break;
    for (let z = -2000; z < 2000; z += 60) {
      if (Math.abs(z) < 40) continue; 
      if (i >= count) break;
      
      const xPos = x - rng() * 10;
      const zPos = z + rng() * 10;
      
      const width = 15 + rng() * 20;
      const depth = 15 + rng() * 20;
      const height = 10 + rng() * 60 + (rng() > 0.95 ? 100 : 0); 

      const shade = 0.3 + rng() * 0.5;
      const color = new Color().setRGB(shade, shade, shade + 0.05);
      
      buildings.push({
        x: xPos,
        z: zPos,
        width,
        depth,
        height,
        color
      });
      i++;
    }
  }
  return buildings;
};

const buildingMaterialBeforeCompile = (shader: any) => {
  shader.vertexShader = `
    varying vec3 vWorldPos;
    varying vec3 vWorldNormal;
  ` + shader.vertexShader;

  shader.vertexShader = shader.vertexShader.replace(
    '#include <begin_vertex>',
    `
    #include <begin_vertex>
    vec4 instanceWorldPos = instanceMatrix * vec4(position, 1.0);
    vWorldPos = instanceWorldPos.xyz;
    vWorldNormal = normalize(mat3(instanceMatrix) * normal);
    `
  );

  shader.fragmentShader = `
    varying vec3 vWorldPos;
    varying vec3 vWorldNormal;
  ` + shader.fragmentShader;

  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <map_fragment>',
    `
    #ifdef USE_MAP
      vec2 wUv = vec2(0.0);
      vec3 n = abs(vWorldNormal);
      float scale = 0.15; 
      if (n.y < 0.5) {
         if (n.z > n.x) wUv = vWorldPos.xy * scale;
         else wUv = vWorldPos.zy * scale;
         vec4 texColor = texture2D(map, wUv);
         diffuseColor *= texColor;
      }
    #endif
    `
  );
};

export const CityInstances = () => {
  const meshRef = useRef<InstancedMesh>(null);
  const buildings = useMemo(() => getCityBuildings(), []);

  const windowMap = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    ctx.fillStyle = '#9ca3af'; 
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = '#dbeafe';
    ctx.fillRect(6, 6, 22, 36);
    ctx.fillRect(36, 6, 22, 36);
    ctx.fillStyle = '#4b5563';
    ctx.fillRect(0, 50, 64, 6);

    const tex = new CanvasTexture(canvas);
    tex.wrapS = RepeatWrapping;
    tex.wrapT = RepeatWrapping;
    return tex;
  }, []);

  useLayoutEffect(() => {
    if (!meshRef.current) return;
    const tempObj = new Object3D();
    
    buildings.forEach((b, i) => {
        // Base is at -2.0.
        // Box geometry is centered. So Y = -2.0 + Height/2.
        tempObj.position.set(b.x, -2.0 + b.height / 2, b.z);
        tempObj.rotation.set(0, 0, 0);
        tempObj.scale.set(b.width, b.height, b.depth);
        tempObj.updateMatrix();
        meshRef.current!.setMatrixAt(i, tempObj.matrix);
        meshRef.current!.setColorAt(i, b.color);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  }, [buildings]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, buildings.length]} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial 
        map={windowMap}
        roughness={0.5} 
        metalness={0.2} 
        onBeforeCompile={buildingMaterialBeforeCompile}
      />
    </instancedMesh>
  );
};
