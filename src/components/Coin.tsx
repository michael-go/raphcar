import * as THREE from "three";
import React from "react";
import { PositionalAudio } from "@react-three/drei";
import { RefObject, useEffect, useRef, useState } from "react";
import { useSpring, animated } from "@react-spring/three";
import { useGameStore, GameStore } from "../stores/gameStore";

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

  useEffect(() => {
    const interval = setInterval(() => {
      if (!group.current) return;
      if (!carRef.current) return;
      if (isCollected) return;

      const carPosition = carRef.current?.getWorldPosition(new THREE.Vector3());
      const coinPosition = group.current?.getWorldPosition(new THREE.Vector3());

      const distance = carPosition.distanceTo(coinPosition);

      if (distance < 1.5) {
        setIsCollected(true);
        collectSoundRef.current?.play();
        addCredits(1);
        collectAnimationApi.start({
          to: {
            position: 20,
          },
          config: {
            duration: 2000, // Complete rotation takes 2 seconds
          },
          onRest: () => {
            removeCoinId(props.coinId);
          },
        });
      }
    }, 1);
    return () => clearInterval(interval);
  }, [carRef, group, isCollected, addCredits, props.coinId]);

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
