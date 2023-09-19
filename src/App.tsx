import "./App.css";

import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { KeyboardControls, KeyboardControlsEntry } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import { useControls } from "leva";

import { ControlKeys } from "./common/controls.ts";
import { Car } from "./components/Car.tsx";
import { Terrain } from "./components/Terrain.tsx";

function App() {
  const { physDebug } = useControls({ physDebug: false });
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
        camera={{ fov: 45, near: 0.1, far: 400, position: [10, 25, 75] }}
      >
        {/* <OrbitControls /> */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} intensity={5} />
        <axesHelper scale={20} />
        <Physics debug={physDebug}>
          <Car />
          <Terrain />
        </Physics>
      </Canvas>
    </KeyboardControls>
  );
}

export default App;
