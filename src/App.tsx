import "./App.css";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  KeyboardControls,
  KeyboardControlsEntry,
  OrbitControls,
} from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import { useControls } from "leva";

import { ControlKeys } from "./common/controls.ts";
import { Car } from "./components/Car.tsx";
import { Terrain } from "./components/Terrain.tsx";

function World() {
  const lightRef = useRef();
  const { physDebug } = useControls({ physDebug: false });

  useFrame((state) => {
    const light = lightRef.current;
    light.position.copy(state.camera.position);
    light.position.x += 5;
    light.position.z += 5;
    light.position.y = 10;
    light.target.position.copy(state.camera.position);
    light.target.position.z -= 1;
    light.target.position.y = 2;
    light.target.updateMatrixWorld();
  });

  return (
    <>
      <OrbitControls />
      {/* <ambientLight intensity={0.5} /> */}
      <directionalLight
        ref={lightRef}
        position={[10, 10, 10]}
        intensity={2}
        castShadow
        shadow-mapSize={[10000, 10000]}
        shadow-bias={-0.001}
        shadow-camera-near={-5}
        shadow-camera-far={100}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-bottom={-100}
        shadow-camera-top={100}
      />
      <axesHelper scale={20} />
      <Physics debug={physDebug}>
        <Terrain />
        <Car />
      </Physics>
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
    ],
    []
  );

  return (
    <KeyboardControls map={keyMap}>
      <Canvas
        shadows
        camera={{ fov: 45, near: 0.1, far: 400, position: [3, 5, 10] }}
      >
        <World />
      </Canvas>
    </KeyboardControls>
  );
}

export default App;
