"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";

const BOOK_DATA = [
  { pos: [-2.5,  0.5, -1], rot: [0.1,  0.3,  0.05], color: "#3b82f6", speed: 0.8 },
  { pos: [ 2.2,  0.3, -2], rot: [0.05, -0.4,  0.1], color: "#8b5cf6", speed: 1.1 },
  { pos: [-1.5, -0.8,  0], rot: [-0.1,  0.6,  0.0], color: "#ec4899", speed: 0.6 },
  { pos: [ 1.8, -0.6, -1], rot: [0.2,   0.1, -0.1], color: "#10b981", speed: 0.9 },
  { pos: [ 0.2,  1.4, -3], rot: [0.0,  -0.2,  0.15], color: "#f59e0b", speed: 0.7 },
  { pos: [-3.0, -0.2, -2], rot: [0.15,  0.5, -0.05], color: "#ef4444", speed: 1.0 },
  { pos: [ 3.2,  0.8, -1], rot: [-0.1,  0.2,  0.1], color: "#06b6d4", speed: 0.85 },
  { pos: [ 0.0, -1.5, -1], rot: [0.1,  -0.3,  0.0], color: "#a78bfa", speed: 1.2 },
];

function Book({
  position,
  rotation,
  color,
  speed,
  mouseRef,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
  speed: number;
  mouseRef: React.MutableRefObject<{ x: number; y: number }>;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const initialY = position[1];
  const t = useRef(Math.random() * Math.PI * 2);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    t.current += delta * speed * 0.4;

    meshRef.current.position.y =
      initialY + Math.sin(t.current) * 0.25;

    meshRef.current.rotation.y +=
      delta * 0.3 + mouseRef.current.x * delta * 0.5;
    meshRef.current.rotation.x +=
      mouseRef.current.y * delta * 0.3;
  });

  return (
    <mesh ref={meshRef} position={position} rotation={rotation} castShadow>
      <RoundedBox args={[0.65, 0.9, 0.12]} radius={0.02} smoothness={4}>
        <meshStandardMaterial
          color={color}
          roughness={0.3}
          metalness={0.15}
          emissive={color}
          emissiveIntensity={0.15}
        />
      </RoundedBox>
      {/* Spine line */}
      <mesh position={[-0.295, 0, 0]}>
        <boxGeometry args={[0.025, 0.9, 0.13]} />
        <meshStandardMaterial color="#000" opacity={0.3} transparent />
      </mesh>
    </mesh>
  );
}

export function FloatingBooks({
  scrollY,
}: {
  scrollY: React.MutableRefObject<number>;
}) {
  const mouseRef = useRef({ x: 0, y: 0 });
  const groupRef = useRef<THREE.Group>(null);
  const { gl } = useThree();

  useMemo(() => {
    const handleMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth  - 0.5) * 2;
      mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    gl.domElement.ownerDocument.addEventListener("mousemove", handleMove);
    return () =>
      gl.domElement.ownerDocument.removeEventListener("mousemove", handleMove);
  }, [gl]);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.y = -scrollY.current * 0.003;
      groupRef.current.rotation.y = scrollY.current * 0.0008;
    }
  });

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.6} />
      <pointLight position={[5, 5, 5]}   intensity={1.5} color="#60a5fa" />
      <pointLight position={[-5, -3, 3]} intensity={1.0} color="#a78bfa" />
      <pointLight position={[0, 8, -5]}  intensity={0.8} color="#ffffff" />

      {BOOK_DATA.map((b, i) => (
        <Book
          key={i}
          position={b.pos as [number, number, number]}
          rotation={b.rot as [number, number, number]}
          color={b.color}
          speed={b.speed}
          mouseRef={mouseRef}
        />
      ))}
    </group>
  );
}
