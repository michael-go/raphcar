import * as THREE from "three";
import { PositionalAudio, useGLTF } from "@react-three/drei";
import { GLTF } from "three-stdlib";
import { RefObject, useEffect, useRef, useState } from "react";
import { useSpring, animated } from "@react-spring/three";
import { useGameStore, GameStore } from "../stores/gameStore";

type GLTFResult = GLTF & {
  nodes: {
    coin: THREE.Mesh;
  };
  materials: {
    ["Gold.009"]: THREE.MeshStandardMaterial;
  };
};

export function Coin(
  props: JSX.IntrinsicElements["group"] & { coinId: string },
) {
  const group = useRef<THREE.Group>(null);
  const { nodes, materials } = useGLTF(
    "https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/coin/model.gltf",
  ) as GLTFResult;

  const carRef = useGameStore((state: GameStore) => state.carRef);
  const collectSoundRef: RefObject<THREE.PositionalAudio> = useRef(null);
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
        geometry={nodes.coin.geometry}
        material={materials["Gold.009"]}
        rotation={rotation as any}
        position-y={collectAnimationStyles.position}
      />
      <PositionalAudio
        ref={collectSoundRef}
        url="/assets/sounds/coin-collected.mp3"
        loop={false}
        distance={5}
      />
    </group>
  );
}

useGLTF.preload(
  "https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/coin/model.gltf",
);
