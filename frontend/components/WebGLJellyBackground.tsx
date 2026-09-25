"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
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
  // 3. Exact 4-Stop SVG Gradient: #E0892B (Orange) -> #B22222 (Crimson) -> #8123DB (Purple) -> #CF25D8 (Magenta)
  const material = useMemo(() => {
    const mat = new THREE.MeshPhysicalMaterial({
      roughness: 0.62,
      metalness: 0.02,
      clearcoat: 0.32,
      clearcoatRoughness: 0.25,
      transparent: true,
      opacity: 0.84,
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
    };

    mat.userData.uniforms = uniforms;

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = uniforms.uTime;
      shader.uniforms.uDistort = uniforms.uDistort;
      shader.uniforms.uSpeed = uniforms.uSpeed;
      shader.uniforms.uFrequency = uniforms.uFrequency;
      shader.uniforms.uMousePos = uniforms.uMousePos;
      shader.uniforms.uMouseRadius = uniforms.uMouseRadius;
      shader.uniforms.uMouseStrength = uniforms.uMouseStrength;

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
          // Right-hand curved kidney bean geometry:
          // Elongate along Y, add C-shape curve along X, and gentle waist pinch
          p.y *= 1.32;
          p.x *= 0.94;
          p.x += (p.y * p.y * -0.22 + p.y * 0.16);
          float waist = 1.0 - 0.16 * exp(-p.y * p.y * 2.2);
          p.x *= waist;
          p.z *= waist;
          `
            : `
          // Left-hand fluid vertical jelly blob contour
          p.y *= 1.42;
          p.x *= 0.90;
          p.x += sin(p.y * 1.5) * 0.22;
          `
        }

        // Simplex 3D noise displacement for living liquid motion
        vec3 norm = normalize(p);
        float n = snoise(p * uFrequency + vec3(uTime * uSpeed));
        float disp = n * uDistort;

        // Reactive proximity ripple when custom cursor draws near
        vec4 wPos = modelMatrix * vec4(p, 1.0);
        float mDist = distance(wPos.xyz, uMousePos);
        if (mDist < uMouseRadius) {
          float factor = 1.0 - (mDist / uMouseRadius);
          disp += factor * factor * uMouseStrength * sin(uTime * 4.0 + mDist * 6.0);
        }

        transformed = p + norm * disp;

        // Diagonal gradient projection parameter [0.0, 1.0]
        vGradCoord = clamp((p.x * 0.45 - p.y * 0.45 + 0.5), 0.0, 1.0);
        `
      );

      // ── Fragment Shader Injections ──
      shader.fragmentShader = `
        uniform float uTime;
        varying vec2 vBlobUv;
        varying float vGradCoord;

        ${shader.fragmentShader}
      `;

      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <color_fragment>",
        `
        #include <color_fragment>

        // Exact 4-Stop SVG Gradient Stops:
        // 0.00: #E0892B (Golden Orange)
        // 0.29: #B22222 (Crimson Red)
        // 0.48: #8123DB (Royal Purple)
        // 0.80 - 1.00: #CF25D8 (Vibrant Magenta)
        vec3 c0 = vec3(0.878, 0.537, 0.169); // #E0892B
        vec3 c1 = vec3(0.698, 0.133, 0.133); // #B22222
        vec3 c2 = vec3(0.506, 0.137, 0.859); // #8123DB
        vec3 c3 = vec3(0.812, 0.145, 0.847); // #CF25D8

        // Living gradient modulation with subtle ambient color swirl
        float t = clamp(vGradCoord + sin(uTime * 0.3 + vBlobUv.x * 4.0) * 0.04, 0.0, 1.0);

        vec3 grad;
        if (t < 0.29) {
          grad = mix(c0, c1, smoothstep(0.0, 0.29, t));
        } else if (t < 0.48) {
          grad = mix(c1, c2, smoothstep(0.29, 0.48, t));
        } else if (t < 0.80) {
          grad = mix(c2, c3, smoothstep(0.48, 0.80, t));
        } else {
          grad = c3;
        }

        diffuseColor.rgb = grad;
        `
      );
    };

    return mat;
  }, [distort, speed, frequency, shapeType]);

  useFrame((_, delta) => {
    if (material.userData.uniforms) {
      material.userData.uniforms.uTime.value += delta;
      if (cursorPosRef.current) {
        material.userData.uniforms.uMousePos.value.copy(cursorPosRef.current);
      }
    }
    if (meshRef.current) {
      // Gentle subtle breathing rotation
      meshRef.current.rotation.x += delta * 0.04;
      meshRef.current.rotation.y += delta * 0.06;
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

// ── 3D Trailing Cursor Sphere ───────────────────────────────────────────────
interface CursorSphereProps {
  mouseNDC: React.RefObject<{ x: number; y: number; active: boolean }>;
  cursorPosRef: React.RefObject<THREE.Vector3>;
}

const CursorSphere: React.FC<CursorSphereProps> = ({ mouseNDC, cursorPosRef }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const currentPos = useRef(new THREE.Vector3(0, 0, 0.5));
  const pointerVec = useMemo(() => new THREE.Vector2(), []);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const intersectionPoint = useMemo(() => new THREE.Vector3(), []);
  const { camera, raycaster } = useThree();

  useFrame((_, delta) => {
    if (!meshRef.current || !mouseNDC.current) return;
    const m = mouseNDC.current;

    if (m.active) {
      pointerVec.set(m.x, m.y);
      raycaster.setFromCamera(pointerVec, camera);
      raycaster.ray.intersectPlane(plane, intersectionPoint);

      // Smooth physics-like lerp tracking with slight inertia
      const lerpFactor = 1.0 - Math.pow(0.018, delta);
      currentPos.current.x = THREE.MathUtils.lerp(
        currentPos.current.x,
        intersectionPoint.x,
        lerpFactor
      );
      currentPos.current.y = THREE.MathUtils.lerp(
        currentPos.current.y,
        intersectionPoint.y,
        lerpFactor
      );
      currentPos.current.z = 0.5;

      meshRef.current.position.copy(currentPos.current);
      if (cursorPosRef.current) {
        cursorPosRef.current.copy(currentPos.current);
      }
    }

    // Smooth visibility fade when entering / leaving the section
    const targetScale = m.active ? 1.0 : 0.0;
    const currentScale = meshRef.current.scale.x;
    const nextScale = THREE.MathUtils.lerp(currentScale, targetScale, 0.16);
    meshRef.current.scale.set(nextScale, nextScale, nextScale);
  });

  return (
    <mesh ref={meshRef} scale={0} position={[0, 0, 0.5]}>
      <sphereGeometry args={[0.075, 32, 32]} />
      <meshStandardMaterial
        color="#1f2937"
        roughness={0.4}
        metalness={0.1}
        transparent
        opacity={0.65}
      />
    </mesh>
  );
};

// ── Main Scene Interior ──────────────────────────────────────────────────────
const JellyScene: React.FC<{
  mouseNDC: React.RefObject<{ x: number; y: number; active: boolean }>;
}> = ({ mouseNDC }) => {
  const { viewport } = useThree();
  const cursorPosRef = useRef<THREE.Vector3>(new THREE.Vector3(999, 999, 999));

  // 1. Top-Right Bean-Shaped Jelly Blob (Matching the designer's exact top-right SVG graphic)
  // Positioned partially off-screen at top-right, rotated by ~ -24° matching SVG clip-path rotation
  const topRightPos = useMemo<[number, number, number]>(() => {
    return [viewport.width * 0.42, viewport.height * 0.36, -0.6];
  }, [viewport.width, viewport.height]);

  const topRightScale = useMemo<[number, number, number]>(() => {
    const s = Math.min(viewport.width * 0.25, 2.7);
    return [s * 1.35, s * 0.95, s * 1.1];
  }, [viewport.width]);

  // 2. Left Undulating Fluid Jelly Blob (Middle-left, partially off-screen)
  const leftPos = useMemo<[number, number, number]>(() => {
    return [-viewport.width * 0.44, 0.0, -0.6];
  }, [viewport.width]);

  const leftScale = useMemo<[number, number, number]>(() => {
    const s = Math.min(viewport.width * 0.26, 2.75);
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
        distort={0.32}
        speed={0.42}
        frequency={0.75}
        cursorPosRef={cursorPosRef}
      />

      {/* ── Left Animated Fluid Gradient Blob ── */}
      <JellyBlobMesh
        position={leftPos}
        scale={leftScale}
        rotation={[0.15, -0.2, 0.25]}
        shapeType="left-blob"
        distort={0.34}
        speed={0.38}
        frequency={0.7}
        cursorPosRef={cursorPosRef}
      />

      {/* ── Trailing 3D Cursor Sphere with Spring Physics ── */}
      <CursorSphere mouseNDC={mouseNDC} cursorPosRef={cursorPosRef} />
    </>
  );
};

// ── Standalone WebGLJellyBackground Component ────────────────────────────────
export const WebGLJellyBackground: React.FC<WebGLJellyBackgroundProps> = ({
  containerRef,
  className = "",
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
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
    return (
      <div
        className={`absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-0 select-none ${className}`}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      ref={wrapperRef}
      className={`absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-0 select-none ${className}`}
      aria-hidden="true"
    >
      <Canvas
        className="w-full h-full pointer-events-auto"
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
