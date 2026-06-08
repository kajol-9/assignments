"use client";

import { Suspense, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { FloatingBooks } from "./FloatingBooks";

export function Scene3D() {
  const scrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => { scrollY.current = window.scrollY; };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        style={{ background: "transparent" }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <FloatingBooks scrollY={scrollY} />
        </Suspense>
      </Canvas>
    </div>
  );
}
