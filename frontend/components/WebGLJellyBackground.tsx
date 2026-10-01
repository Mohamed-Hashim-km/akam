"use client";

import React, { useRef, useMemo, useEffect, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";

export interface WebGLJellyBackgroundProps {
  containerRef?: React.RefObject<HTMLElement | null>;
  className?: string;
}

// ── Ashima Arts 3D Simplex Noise Shader Chunk ───────────────────────────────
const SIMPLEX_NOISE_GLSL = /* glsl */ `
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`;

// ── 3D Morphing Jelly Blob Component ─────────────────────────────────────────
interface JellyBlobMeshProps {
  position: [number, number, number];
  scale: [number, number, number] | number;
  rotation?: [number, number, number];
  shapeType?: "bean" | "left-blob";
  distort?: number;
  speed?: number;
  frequency?: number;
  cursorPosRef: React.RefObject<THREE.Vector3>;
}

const JellyBlobMesh: React.FC<JellyBlobMeshProps> = ({
  position,
  scale,
  rotation = [0, 0, 0],
  shapeType = "bean",
  distort = 0.32,
  speed = 0.42,
  frequency = 0.75,
  cursorPosRef,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // MeshPhysicalMaterial injected with:
  // 1. Organic shape deformation (curved bean / kidney contour matching Figma SVG)
  // 2. Ashima Arts 3D Simplex noise continuous fluid displacement
  // 3. Right: Soft light peach, Left: Soft light lilac
  const material = useMemo(() => {
    const isRightBean = shapeType === "bean";

    // Light airy pastels
    const baseColor = isRightBean
      ? new THREE.Color("#F8EAE4")
      : new THREE.Color("#F1DCFA");

    const highlightColor = isRightBean
      ? new THREE.Color("#FEF8F6")
      : new THREE.Color("#FAF4FD");

    const shadowColor = isRightBean
      ? new THREE.Color("#F3DED5")
      : new THREE.Color("#E8CCF8");

    const mat = new THREE.MeshPhysicalMaterial({
      roughness: 0.62,
      metalness: 0.02,
      clearcoat: 0.32,
      clearcoatRoughness: 0.25,
      transparent: true,
      opacity: 0.45,
      flatShading: false,
    });

    const uniforms = {
      uTime: { value: 0 },
      uDistort: { value: distort },
      uSpeed: { value: speed },
      uFrequency: { value: frequency },
      uMousePos: { value: new THREE.Vector3(999, 999, 999) },
      uMouseRadius: { value: 2.5 },
      uMouseStrength: { value: 0.35 },
      uBaseColor: { value: baseColor },
      uHighlightColor: { value: highlightColor },
      uShadowColor: { value: shadowColor },
      uOpacity: { value: 0.45 },
    };

    mat.userData.uniforms = uniforms;
    mat.customProgramCacheKey = () => `jelly-${shapeType}-v5-${isRightBean ? "F8EAE4" : "F1DCFA"}`;

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = uniforms.uTime;
      shader.uniforms.uDistort = uniforms.uDistort;
      shader.uniforms.uSpeed = uniforms.uSpeed;
      shader.uniforms.uFrequency = uniforms.uFrequency;
      shader.uniforms.uMousePos = uniforms.uMousePos;
      shader.uniforms.uMouseRadius = uniforms.uMouseRadius;
      shader.uniforms.uMouseStrength = uniforms.uMouseStrength;
      shader.uniforms.uBaseColor = uniforms.uBaseColor;
      shader.uniforms.uHighlightColor = uniforms.uHighlightColor;
      shader.uniforms.uShadowColor = uniforms.uShadowColor;
      shader.uniforms.uOpacity = uniforms.uOpacity;

      // ── Vertex Shader Injections ──
      shader.vertexShader = `
        uniform float uTime;
        uniform float uDistort;
        uniform float uSpeed;
        uniform float uFrequency;
        uniform vec3 uMousePos;
        uniform float uMouseRadius;
        uniform float uMouseStrength;

        varying vec2 vBlobUv;
        varying float vGradCoord;

        ${SIMPLEX_NOISE_GLSL}

        ${shader.vertexShader}
      `;

      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        `
        #include <begin_vertex>

        vBlobUv = uv;

        // Base geometry deformation for specific blob contours
        vec3 p = position;
        ${
          shapeType === "bean"
            ? `
          // Smooth kidney bean geometry without sharp creases or polygon folds
          p.y *= 1.25;
          p.x *= 0.96;
          p.x += sin(p.y * 1.2) * 0.22 - (p.y * p.y * 0.06);
          float waist = 1.0 - 0.08 * exp(-p.y * p.y * 1.5);
          p.x *= waist;
          p.z *= waist;
          `
            : `
          // Left-hand fluid vertical jelly blob contour
          p.y *= 1.35;
          p.x *= 0.92;
          p.x += sin(p.y * 1.4) * 0.20;
          `
        }

        // Multi-octave 3D Simplex noise displacement for living liquid jelly motion
        vec3 norm = normalize(p);
        float n1 = snoise(p * uFrequency + vec3(uTime * uSpeed));
        float n2 = snoise(p * (uFrequency * 1.8) - vec3(uTime * (uSpeed * 1.2)));
        float disp = (n1 * 0.72 + n2 * 0.28) * uDistort;

        // Reactive proximity bulge and liquid wave ripples when cursor draws near
        vec4 wPos = modelMatrix * vec4(p, 1.0);
        float mDist = distance(wPos.xyz, uMousePos);
        if (mDist < uMouseRadius) {
          float q = 1.0 - (mDist / uMouseRadius);
          float factor = q * q * (3.0 - 2.0 * q);
          disp += factor * uMouseStrength * (0.75 + 0.35 * sin(uTime * 4.5 - mDist * 7.0));
        }

        transformed = p + norm * disp;

        // Smooth view normal calculation
        vNormal = normalize(normalMatrix * (norm + vec3(0.0, 0.0, 0.25)));

        // Diagonal gradient projection parameter [0.0, 1.0]
        vGradCoord = clamp((p.x * 0.45 - p.y * 0.45 + 0.5), 0.0, 1.0);
        `
      );

      // ── Fragment Shader Injections ──
      shader.fragmentShader = `
        uniform float uTime;
        uniform float uOpacity;
        uniform vec3 uBaseColor;
        uniform vec3 uHighlightColor;
        uniform vec3 uShadowColor;
        varying vec2 vBlobUv;
        varying float vGradCoord;

        ${shader.fragmentShader}
      `;

      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <dithering_fragment>",
        `
        #include <dithering_fragment>

        // Custom luminous porcelain-liquid studio shader:
        vec3 norm = normalize(vNormal);
        float ndotv = clamp(dot(norm, vec3(0.0, 0.0, 1.0)), 0.0, 1.0);
        float fres = pow(1.0 - ndotv, 2.2);

        // Studio half-lambert lighting ensures colors stay bright and true
        float lightFactor = ndotv * 0.45 + 0.55;
        vec3 finalRgb = mix(uShadowColor, uBaseColor, lightFactor);
        finalRgb = mix(finalRgb, uHighlightColor, fres * 0.45 + pow(ndotv, 4.0) * 0.35);

        gl_FragColor = vec4(finalRgb, uOpacity);
        `
      );
    };

    return mat;
  }, [distort, speed, frequency, shapeType]);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (mesh && mesh.material) {
      const mat = mesh.material as THREE.MeshPhysicalMaterial;
      if (mat.userData?.uniforms) {
        mat.userData.uniforms.uTime.value += delta;
        if (cursorPosRef.current) {
          mat.userData.uniforms.uMousePos.value.copy(cursorPosRef.current);
        }
      }
      // Gentle subtle breathing rotation
      mesh.rotation.x += delta * 0.04;
      mesh.rotation.y += delta * 0.06;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      scale={scale}
      rotation={rotation}
      material={material}
    >
      {/* 128x128 segment count for absolute organic smoothness */}
      <sphereGeometry args={[1, 128, 128]} />
    </mesh>
  );
};

// ── Main Scene Interior ──────────────────────────────────────────────────────
const JellyScene: React.FC<{
  mouseNDC: React.RefObject<{ x: number; y: number; active: boolean }>;
}> = ({ mouseNDC }) => {
  const { viewport, camera, raycaster } = useThree();
  const cursorPosRef = useRef<THREE.Vector3>(new THREE.Vector3(999, 999, 999));
  const pointerVec = useMemo(() => new THREE.Vector2(), []);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const intersectionPoint = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    if (!mouseNDC.current) return;
    const m = mouseNDC.current;

    if (m.active) {
      pointerVec.set(m.x, m.y);
      raycaster.setFromCamera(pointerVec, camera);
      raycaster.ray.intersectPlane(plane, intersectionPoint);

      const lerpFactor = 1.0 - Math.pow(0.018, delta);
      cursorPosRef.current.x = THREE.MathUtils.lerp(
        cursorPosRef.current.x,
        intersectionPoint.x,
        lerpFactor
      );
      cursorPosRef.current.y = THREE.MathUtils.lerp(
        cursorPosRef.current.y,
        intersectionPoint.y,
        lerpFactor
      );
      cursorPosRef.current.z = 0.5;
    } else {
      cursorPosRef.current.set(999, 999, 999);
    }
  });

  // 1. Top-Right Bean-Shaped Jelly Blob (Matching the designer's exact top-right SVG graphic)
  const topRightPos = useMemo<[number, number, number]>(() => {
    return [viewport.width * 0.45, viewport.height * 0.40, -0.6];
  }, [viewport.width, viewport.height]);

  const topRightScale = useMemo<[number, number, number]>(() => {
    const s = Math.min(viewport.width * 0.13, 1.45);
    return [s * 1.35, s * 0.95, s * 1.1];
  }, [viewport.width]);

  // 2. Left Undulating Fluid Jelly Blob (Middle-left, partially off-screen)
  const leftPos = useMemo<[number, number, number]>(() => {
    return [-viewport.width * 0.47, 0.0, -0.6];
  }, [viewport.width]);

  const leftScale = useMemo<[number, number, number]>(() => {
    const s = Math.min(viewport.width * 0.14, 1.50);
    return [s * 0.95, s * 1.35, s * 1.05];
  }, [viewport.width]);

  return (
    <>
      {/* ── Soft Porcelain Lighting (Zero harsh specular highlights) ── */}
      <hemisphereLight args={["#ffffff", "#e5e7eb", 0.95]} />
      <directionalLight position={[6, 8, 6]} intensity={0.45} />
      <ambientLight intensity={0.38} />

      {/* ── Top-Right Bean-Shaped Gradient Blob (Matching the SVG) ── */}
      <JellyBlobMesh
        position={topRightPos}
        scale={topRightScale}
        rotation={[-0.1, 0.2, -0.42]}
        shapeType="bean"
        distort={0.42}
        speed={0.22}
        frequency={0.65}
        cursorPosRef={cursorPosRef}
      />

      {/* ── Left Animated Fluid Gradient Blob ── */}
      <JellyBlobMesh
        position={leftPos}
        scale={leftScale}
        rotation={[0.15, -0.2, 0.25]}
        shapeType="left-blob"
        distort={0.45}
        speed={0.20}
        frequency={0.60}
        cursorPosRef={cursorPosRef}
      />
    </>
  );
};

// ── Standalone WebGLJellyBackground Component ────────────────────────────────
export const WebGLJellyBackground: React.FC<WebGLJellyBackgroundProps> = ({
  containerRef,
  className = "",
}) => {
  const [mounted, setMounted] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mouseNDC = useRef<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });

  useEffect(() => {
    setMounted(true);

    // Disable mouse follower tracking on touch-only mobile devices
    if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) {
      return;
    }

    const container = containerRef?.current || wrapperRef.current?.parentElement;
    if (!container) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;

      const rect = container.getBoundingClientRect();
      const isInside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      if (isInside) {
        // Map to normalized device coordinates [-1, 1] relative to the target container
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
        mouseNDC.current = { x, y, active: true };
      } else {
        mouseNDC.current.active = false;
      }
    };

    const handlePointerLeave = () => {
      mouseNDC.current.active = false;
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("mouseleave", handlePointerLeave);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("mouseleave", handlePointerLeave);
    };
  }, [containerRef]);

  if (!mounted) {
    return null;
  }

  return (
    <div
      ref={wrapperRef}
      className={`absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-0 select-none ${className}`}
      aria-hidden="true"
    >
      <Canvas
        className="gl w-full h-full pointer-events-none"
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        }}
        camera={{ position: [0, 0, 7], fov: 45 }}
        dpr={[1, 2]}
      >
        <JellyScene mouseNDC={mouseNDC} />
      </Canvas>
    </div>
  );
};

export default WebGLJellyBackground;
