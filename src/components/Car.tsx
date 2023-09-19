import { useKeyboardControls, useGLTF } from "@react-three/drei";
import { useFrame, RootState } from "@react-three/fiber";
import { useRef, useState, useEffect } from "react";
import * as THREE from "three";

import { ControlKeys } from "../common/controls.ts";
import { RigidBody } from "@react-three/rapier";

export function Car() {
  const body = useRef();
  const modelRef = useRef();

  const [sub, _] = useKeyboardControls<ControlKeys>();

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
