import "./App.css";

import * as THREE from "three";
import { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { HeightfieldCollider, Physics, RigidBody } from "@react-three/rapier";

function Terrain() {
  const width = 100;
  const height = 50;
  const widthSegments = 20;
  const heightSegments = 10;

  const heightField = Array((widthSegments + 1) * (heightSegments + 1)).fill(0);

  const geometry = new THREE.PlaneGeometry(
    width,
    height,
    widthSegments,
    heightSegments
  );

  for (let h = 0; h < heightSegments + 1; h++) {
    for (let w = 0; w < widthSegments + 1; w++) {
      const i = h * widthSegments + w;
      heightField[i] = ((h + w) % 5) * Math.random() * 0.3 * 3;
      // heightField[i] = i * 2;
    }
  }

  // console.log("before", geometry.attributes.position.array);
  heightField.forEach((v, index) => {
    (geometry.attributes.position.array as any)[index * 3 + 2] = v;
  });
  // console.log("after ", geometry.attributes.position.array);
  geometry.scale(-1, 1, 1);
  geometry.rotateX(Math.PI / 2);
  geometry.rotateZ(Math.PI);
  geometry.rotateY(-Math.PI / 2);
  // geometry.rotateY(Math.PI);
  geometry.computeVertexNormals();

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

function Ball() {
  const ball = useRef();

  const nudge = () => {
    ball.current.applyImpulse({
      x: Math.random() * 50,
      y: 20,
      z: Math.random() * 50,
    });
  };

  return (
    <RigidBody ref={ball} colliders={"ball"} canSleep={false}>
      <mesh onClick={nudge} position={[0, 10, 0]}>
        <sphereGeometry />
        <meshStandardMaterial color={"orange"} />
      </mesh>
    </RigidBody>
  );
}

function App() {
  return (
    <>
      <Canvas
        shadows
        camera={{ fov: 45, near: 0.1, far: 400, position: [2, 7, 20] }}
      >
        <OrbitControls />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} intensity={5} />
        <axesHelper scale={20} />
        <Physics debug>
          <Ball />
          <Terrain />
          {/* <mesh rotation-x={-Math.PI / 2}>
            <planeGeometry args={[100, 100]}  />
            <meshStandardMaterial color="gray" side={THREE.DoubleSide} />
          </mesh> */}
        </Physics>
      </Canvas>
    </>
  );
}

export default App;
