"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { AdditiveBlending, MathUtils, TextureLoader, type Group, type Points as PointsType } from "three";

const BASE_PATH = process.env.NEXT_PUBLIC_BUILD_TARGET === "mobile" ? "" : process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const cards = [
  { image: `${BASE_PATH}/images/item-vinyl.svg`, position: [-1.8, 0.35, 0] as [number, number, number], rotation: [0.02, 0.27, -0.1] as [number, number, number], speed: 0.5, offset: 0.2 },
  { image: `${BASE_PATH}/images/item-streetwear.svg`, position: [0.05, 0.38, 0.8] as [number, number, number], rotation: [-0.02, -0.08, 0.05] as [number, number, number], speed: 0.42, offset: 1.6 },
  { image: `${BASE_PATH}/images/item-gameboy.svg`, position: [1.85, -0.36, -0.5] as [number, number, number], rotation: [0.03, -0.25, 0.09] as [number, number, number], speed: 0.46, offset: 3.1 },
  { image: `${BASE_PATH}/images/item-pokemon.svg`, position: [-0.75, -1.18, -1] as [number, number, number], rotation: [-0.02, 0.14, -0.06] as [number, number, number], speed: 0.35, offset: 4.4 },
];

function ArchiveCard({ config }: { config: (typeof cards)[number] }) {
  const texture = useLoader(TextureLoader, config.image);
  const group = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.elapsedTime * config.speed + config.offset;
    group.current.position.y = config.position[1] + Math.sin(t) * 0.13;
    group.current.rotation.z = config.rotation[2] + Math.sin(t * 0.45) * 0.035;
  });
  return (
    <group ref={group} position={config.position} rotation={config.rotation}>
      <mesh>
        <planeGeometry args={[1.48, 1.94]} />
        <meshStandardMaterial color="#e7e0d1" roughness={0.92} />
      </mesh>
      <mesh position={[0, 0, 0.008]}>
        <planeGeometry args={[1.34, 1.8]} />
        <meshStandardMaterial map={texture} roughness={0.84} />
      </mesh>
    </group>
  );
}

function Dust() {
  const points = useRef<PointsType>(null);
  const positions = useMemo(() => {
    const result = new Float32Array(180 * 3);
    for (let i = 0; i < 180; i += 1) {
      const sample = (seed: number) => {
        const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
        return value - Math.floor(value);
      };
      result[i * 3] = (sample(i * 3) - 0.5) * 10;
      result[i * 3 + 1] = (sample(i * 3 + 1) - 0.5) * 6;
      result[i * 3 + 2] = (sample(i * 3 + 2) - 0.5) * 5;
    }
    return result;
  }, []);
  useFrame(({ clock }) => {
    if (points.current) points.current.rotation.y = clock.elapsedTime * 0.012;
  });
  return <points ref={points}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry><pointsMaterial size={0.018} color="#a9853f" transparent opacity={0.45} depthWrite={false} blending={AdditiveBlending} /></points>;
}

function SceneContent() {
  useFrame(({ camera, pointer }) => {
    camera.position.x = MathUtils.lerp(camera.position.x, pointer.x * 0.32, 0.025);
    camera.position.y = MathUtils.lerp(camera.position.y, pointer.y * 0.2, 0.025);
    camera.lookAt(0, 0, 0);
  });
  return <><color attach="background" args={["#f8f6ef"]} /><ambientLight intensity={1.25} color="#fff8ec" /><directionalLight position={[-4, 5, 6]} intensity={0.9} color="#fff3dd" /><Suspense fallback={null}><group position={[0.1, 0, 0]}>{cards.map((config) => <ArchiveCard config={config} key={config.image} />)}</group><Dust /></Suspense></>;
}

export default function ArchiveScene3D() {
  return <Canvas dpr={[1, 1.35]} camera={{ position: [0, 0, 6.8], fov: 42, near: 0.1, far: 40 }} gl={{ antialias: true, powerPreference: "low-power" }}><SceneContent /></Canvas>;
}