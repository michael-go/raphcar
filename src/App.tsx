import "./App.css";

import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, RootState, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  useGLTF,
  KeyboardControls,
  useKeyboardControls,
} from "@react-three/drei";
import { HeightfieldCollider, Physics, RigidBody } from "@react-three/rapier";
import { useControls } from "leva";

function Terrain() {
  const width = 1000;
  const height = 500;
  const widthSegments = width / 10;
  const heightSegments = height / 10;

  const heightField = useMemo(() => {
    const heightField = Array((widthSegments + 1) * (heightSegments + 1)).fill(
      0
    );

    for (let h = 0; h < heightSegments + 1; h++) {
      for (let w = 0; w < widthSegments + 1; w++) {
        const i = h * widthSegments + w;
        heightField[i] = ((h + w) % 5) * Math.random() * 0.3 * 3;
      }
    }

    return heightField;
  }, []);

  const geometry = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(
      width,
      height,
      widthSegments,
      heightSegments
    );

    heightField.forEach((v, index) => {
      (geometry.attributes.position.array as any)[index * 3 + 2] = v;
    });
    geometry.scale(-1, 1, 1);
    geometry.rotateX(Math.PI / 2);
    geometry.rotateY(Math.PI / 2);
    geometry.rotateZ(-Math.PI);
    geometry.computeVertexNormals();

    return geometry;
  }, [heightField]);

  return (
    <RigidBody colliders={false} position={[0, 0, 0]}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshPhysicalMaterial color="limegreen" side={2} wireframe={false} />
      </mesh>
      <HeightfieldCollider
        args={[
          widthSegments,
          heightSegments,
          heightField as number[],
          { x: height, y: 1, z: width },
        ]}
      />
    </RigidBody>
  );
}

enum Controls {
  forward = "forward",
  back = "back",
  left = "left",
  right = "right",
}

function Car() {
  const body = useRef();
  const modelRef = useRef();

  const [sub, _] = useKeyboardControls<Controls>();

  const [smoothedCameraPositon] = useState(new THREE.Vector3(10, 10, 10));
  const [smoothedCameraTarget] = useState(new THREE.Vector3());

  useEffect(() => {
    return sub(
      (state) => state,
      (pressed) => {
        const direction = new THREE.Vector3();
        modelRef.current.getWorldDirection(direction);

        const force = 3;

        if (pressed.left) {
          // rotate direction vector left
          direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 4);
        }
        if (pressed.right) {
          // rotate direction vector right
          direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 4);
        }

        if (pressed.forward) {
          body.current.applyImpulse({
            x: direction.x * force,
            y: 0,
            z: direction.z * force,
          });
        }
        if (pressed.back) {
          body.current.applyImpulse({
            x: -direction.x * force,
            y: 0,
            z: -direction.z * force,
          });
        }
      }
    );
  });

  useFrame((state: RootState, delta: number) => {
    const bodyPosition = body.current.translation();

    const cameraPosition = new THREE.Vector3();
    cameraPosition.copy(bodyPosition);
    cameraPosition.z += 20;
    cameraPosition.y += 6;

    const cameraTarget = new THREE.Vector3();
    cameraTarget.copy(bodyPosition);
    cameraTarget.y += 0.25;

    smoothedCameraPositon.lerp(cameraPosition, 7 * delta);
    smoothedCameraTarget.lerp(cameraTarget, 7 * delta);

    // TODO: rotate camera in the direction of the car

    state.camera.position.copy(smoothedCameraPositon);
    state.camera.lookAt(smoothedCameraTarget);
  });

  const nudge = () => {
    body.current.applyImpulse({
      x: Math.random() * 10,
      y: 10,
      z: Math.random() * 10,
    });
  };

  const { scene: model } = useGLTF(
    "https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/race-car/model.gltf"
  );

  return (
    <RigidBody ref={body} colliders={"hull"} canSleep={false}>
      <primitive
        ref={modelRef}
        object={model}
        onClick={nudge}
        position={[0, 2, 0]}
        rotation-y={Math.PI}
      />
    </RigidBody>
  );
}

function App() {
  const { physDebug } = useControls({ physDebug: false });
  const keyMap = useMemo<KeyboardControlsEntry<Controls>[]>(
    () => [
      { name: Controls.forward, keys: ["ArrowUp", "KeyW"] },
      { name: Controls.back, keys: ["ArrowDown", "KeyS"] },
      { name: Controls.left, keys: ["ArrowLeft", "KeyA"] },
      { name: Controls.right, keys: ["ArrowRight", "KeyD"] },
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
