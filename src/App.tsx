import "./App.css";

import { RefObject, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Hud,
  PerspectiveCamera,
  KeyboardControls,
  KeyboardControlsEntry,
  OrbitControls,
  Text,
} from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import { useControls, Leva } from "leva";
import { Perf } from "r3f-perf";
import * as THREE from "three";
import { v4 as uuidv4 } from "uuid";
import seedrandom from "seedrandom";

import { ControlKeys } from "./common/controls.ts";
import { Car } from "./components/Car.tsx";
import { Terrain } from "./components/Terrain.tsx";
import { Coin } from "./components/Coin.tsx";
import { useGameStore, GameStore } from "./stores/gameStore";

function World() {
  const lightRef: RefObject<THREE.DirectionalLight> = useRef(null);
  const { physDebug } = useControls({ physDebug: false });
  const credits = useGameStore((state: GameStore) => state.credits);
  const addCoinId = useGameStore((state: GameStore) => state.addCoinId);
  const coinIds = useGameStore((state: GameStore) => state.coinIds);

  useEffect(() => {
    for (let i = 0; i < 100; i++) {
      const coinId = uuidv4();
      addCoinId(coinId);
    }
  }, [addCoinId]);

  interface CoinInfo {
    coinId: string;
    position: THREE.Vector3;
  }

  const coinsInfo: CoinInfo[] = useMemo(() => {
    return coinIds.map((coinId: string) => ({
      coinId: coinId,
      position: new THREE.Vector3(
        seedrandom(coinId)() * 500 - 250,
        0.8,
        seedrandom(coinId + 1)() * 500 - 250,
      ),
    }));
  }, [coinIds]);

  useFrame((state) => {
    const light = lightRef.current;
    if (!light) return;
    light.position.copy(state.camera.position);
    light.position.x += 5;
    light.position.z += 5;
    light.position.y = 10;
    light.target.position.copy(state.camera.position);
    light.target.position.z -= 1;
    light.target.position.y = 2;
    light.target.updateMatrixWorld();
  });

  const car = <Car />;

  return (
    <>
      <OrbitControls />
      <ambientLight intensity={0.5} />
      <directionalLight
        ref={lightRef}
        position={[10, 10, 10]}
        intensity={2}
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-bias={-0.001}
        shadow-camera-near={0.1}
        shadow-camera-far={100}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-bottom={-50}
        shadow-camera-top={50}
      />
      <axesHelper scale={20} visible={false} />
      <Physics debug={physDebug}>
        <Terrain />
        {car}
        {coinsInfo.map((coinInfo: CoinInfo) => (
          <Coin
            key={coinInfo.coinId}
            position={coinInfo.position}
            coinId={coinInfo.coinId}
          />
        ))}
      </Physics>
      <Hud>
        <PerspectiveCamera makeDefault position={[0, -8.5, 20]} />
        <Text
          color="gold"
          outlineWidth={0.05}
          outlineColor="black"
          fillOpacity={1}
        >
          🪙{credits}
        </Text>
      </Hud>
    </>
  );
}

function App() {
  const keyMap = useMemo<KeyboardControlsEntry<ControlKeys>[]>(
    () => [
      { name: ControlKeys.forward, keys: ["ArrowUp", "KeyW"] },
      { name: ControlKeys.back, keys: ["ArrowDown", "KeyS"] },
      { name: ControlKeys.left, keys: ["ArrowLeft", "KeyA"] },
      { name: ControlKeys.right, keys: ["ArrowRight", "KeyD"] },
      { name: ControlKeys.jumproll, keys: ["Space"] },
    ],
    [],
  );

  return (
    <KeyboardControls map={keyMap}>
      <Canvas
        shadows
        camera={{ fov: 45, near: 0.1, far: 400, position: [3, 5, 10] }}
      >
        {window.location.hash === "#debug" && (
          <>
            <Perf position="top-left" />
          </>
        )}
        {window.location.hash !== "#debug" && <Leva hidden={true} />}
        <World />
      </Canvas>
    </KeyboardControls>
  );
}

export default App;
