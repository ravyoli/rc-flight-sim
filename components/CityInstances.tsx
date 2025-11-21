
import React, { useRef, useMemo, useLayoutEffect } from 'react';
import { InstancedMesh, Object3D, Color, CanvasTexture, RepeatWrapping } from 'three';
import '../types';

// Custom shader logic to map window texture in World Space
// This prevents texture stretching on scaled instances
const buildingMaterialBeforeCompile = (shader: any) => {
  shader.vertexShader = `
    varying vec3 vWorldPos;
    varying vec3 vWorldNormal;
  ` + shader.vertexShader;

  // FIX: Rename 'worldPosition' to 'instanceWorldPos' to avoid redefinition conflict with Three.js internal variable
  shader.vertexShader = shader.vertexShader.replace(
    '#include <begin_vertex>',
    `
    #include <begin_vertex>
    // Calculate world position for this instance
    vec4 instanceWorldPos = instanceMatrix * vec4(position, 1.0);
    vWorldPos = instanceWorldPos.xyz;
    
    // Calculate world normal
    // For axis-aligned non-uniform scaling, normals stay axis aligned.
    // We just rotate them by the rotation part of the matrix.
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
      
      // Density of windows
      float scale = 0.15; 
      
      // Walls (Use Y and X/Z)
      // If normal is horizontal (y is small)
      if (n.y < 0.5) {
         // If normal is Z-facing (z > x)
         if (n.z > n.x) wUv = vWorldPos.xy * scale;
         else wUv = vWorldPos.zy * scale;
         
         vec4 texColor = texture2D(map, wUv);
         
         // Blend texture with instance color
         // We want windows to pop, so we use texture to darken/lighten
         diffuseColor *= texColor;
      }
      // Roof (n.y > 0.5) - keep base instance color
    #endif
    `
  );
};

export const CityInstances = () => {
  const meshRef = useRef<InstancedMesh>(null);
  const count = 4000;

  // Generate Window Texture
  const windowMap = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    // Wall Color (Mid Grey - lets instance color tint it)
    ctx.fillStyle = '#9ca3af'; 
    ctx.fillRect(0, 0, 64, 64);
    
    // Windows (Light Blue)
    ctx.fillStyle = '#dbeafe'; // Tailwind blue-100
    // Simple 2x1 Grid
    ctx.fillRect(6, 6, 22, 36);
    ctx.fillRect(36, 6, 22, 36);
    
    // Dark Ledge
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
    
    let i = 0;
    // Generate grid from -200 down to -4000
    for (let x = -200; x > -4000; x -= 60) {
      // Skip Second Airport area
      if (Math.abs(x - (-3000)) < 80) continue;

      // Cross Roads
      if (Math.abs(x % 400) < 30) continue;

      if (i >= count) break;
      for (let z = -2000; z < 2000; z += 60) {
        if (Math.abs(z) < 40) continue; // Main St
        if (i >= count) break;
        
        const xPos = x - Math.random() * 10;
        const zPos = z + Math.random() * 10;
        
        const width = 15 + Math.random() * 20;
        const depth = 15 + Math.random() * 20;
        const height = 10 + Math.random() * 60 + (Math.random() > 0.95 ? 100 : 0); 

        tempObj.position.set(xPos, height / 2, zPos);
        tempObj.rotation.set(0, 0, 0);
        tempObj.scale.set(width, height, depth);
        tempObj.updateMatrix();
        meshRef.current.setMatrixAt(i, tempObj.matrix);
        
        const shade = 0.3 + Math.random() * 0.5;
        const color = new Color().setRGB(shade, shade, shade + 0.05);
        meshRef.current.setColorAt(i, color);
        i++;
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  }, []);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow receiveShadow>
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
