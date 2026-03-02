import * as THREE from "three";
import React from "react";
import { PositionalAudio } from "@react-three/drei";
import { RefObject, useRef, useState } from "react";
import { useSpring, animated } from "@react-spring/three";
import { useFrame } from "@react-three/fiber";
import { useGameStore, GameStore } from "../stores/gameStore";

// Reused vectors to avoid per-frame allocations
const _carPos = new THREE.Vector3();
const _coinPos = new THREE.Vector3();

export function Coin(
  props: React.JSX.IntrinsicElements["group"] & { coinId: string },
) {
  const group = useRef<THREE.Group>(null);

  const carRef = useGameStore((state: GameStore) => state.carRef);
  const collectSoundRef: RefObject<THREE.PositionalAudio | null> = useRef<THREE.PositionalAudio>(null);
  const addCredits = useGameStore((state: GameStore) => state.addCredits);
  const removeCoinId = useGameStore((state: GameStore) => state.removeCoinId);

  const [isCollected, setIsCollected] = useState(false);

  const { rotation } = useSpring({
    from: {
      rotation: [Math.PI / 2, 0, 0],
    },
    to: {
      rotation: [Math.PI / 2, 0, Math.PI * 2],
    },
    loop: true,
    config: {
      duration: 2000, // Complete rotation takes 2 seconds
    },
  });

  const [collectAnimationStyles, collectAnimationApi] = useSpring(() => ({
    from: {
      position: (props.position as THREE.Vector3)?.y,
    },
  }));

  useFrame(() => {
    if (!group.current || !carRef.current || isCollected) return;

    carRef.current.getWorldPosition(_carPos);
    group.current.getWorldPosition(_coinPos);

    const distance = _carPos.distanceTo(_coinPos);
    if (distance < 1.5) {
      setIsCollected(true);
      collectSoundRef.current?.play();
      addCredits(1);
      collectAnimationApi.start({
        to: { position: 20 },
        config: { duration: 2000 },
        onRest: () => removeCoinId(props.coinId),
      });
    }
  });

  return (
    <group ref={group} castShadow receiveShadow {...props} dispose={null}>
      <animated.mesh
        rotation={rotation as any}
        position-y={collectAnimationStyles.position}
      >
        <cylinderGeometry args={[0.4, 0.4, 0.08, 32]} />
        <meshStandardMaterial color="gold" metalness={0.9} roughness={0.05} />
      </animated.mesh>
      <PositionalAudio
        ref={collectSoundRef}
        url="/assets/sounds/coin-collected.mp3"
        loop={false}
        distance={5}
      />
    </group>
  );
}
