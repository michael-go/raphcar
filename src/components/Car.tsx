import { useKeyboardControls, useGLTF } from "@react-three/drei";
import { useFrame, RootState } from "@react-three/fiber";
import { RefObject, useRef, useState } from "react";
import { MathUtils } from "three";
import * as THREE from "three";

import { ControlKeys } from "../common/controls.ts";
import { MeshCollider, RapierRigidBody, RigidBody } from "@react-three/rapier";
import {
  WheelInfo,
  useVehicleController,
} from "../hooks/vehicleController.tsx";

export function Car() {
  const [smoothedCameraPositon] = useState(new THREE.Vector3(10, 10, 10));
  const [smoothedCameraTarget] = useState(new THREE.Vector3());

  const chasisMeshRef: RefObject<THREE.Group> = useRef(null);
  const chasisBodyRef: RefObject<RapierRigidBody> = useRef(null);
  const wheelsRef: RefObject<(THREE.Object3D | null)[]> = useRef([]);

  const wheelInfo: WheelInfo = {
    axleCs: new THREE.Vector3(1, 0, 0),
    suspensionRestLength: 0.125,
    suspensionStiffness: 24,
    maxSuspensionTravel: 0.125,
  };
  const wheelsInfo = [wheelInfo, wheelInfo, wheelInfo, wheelInfo];

  const { vehicleController } = useVehicleController(
    chasisBodyRef,
    wheelsRef as RefObject<THREE.Object3D[]>,
    wheelsInfo
  );

  const [_, get] = useKeyboardControls<ControlKeys>();

  useFrame(() => {
    if (!vehicleController) return;

    const accelerateForce = 48;
    const brakeForce = 12;
    const steerAngle = Math.PI / 12;

    const controls = get();

    const engineForce =
      Number(controls.forward) * accelerateForce -
      Number(controls.back) * brakeForce;

    vehicleController.setWheelEngineForce(0, engineForce);
    vehicleController.setWheelEngineForce(1, engineForce);

    const currentSteering = vehicleController.wheelSteering(0) || 0;
    const steerDirection = Number(controls.left) + Number(controls.right) * -1;

    const steering = MathUtils.lerp(
      currentSteering,
      steerAngle * steerDirection,
      0.5
    );

    vehicleController.setWheelSteering(0, steering);
    vehicleController.setWheelSteering(1, steering);
  });

  useFrame((state: RootState, delta: number) => {
    if (!chasisMeshRef.current) return;
    const bodyPosition = chasisMeshRef.current.getWorldPosition(
      new THREE.Vector3()
    );

    const cameraPosition = new THREE.Vector3();
    cameraPosition.copy(bodyPosition);
    // TODO: make distance based on speed
    cameraPosition.z += 10;
    cameraPosition.y += 4;

    const cameraTarget = new THREE.Vector3();
    cameraTarget.copy(bodyPosition);
    cameraTarget.y += 0.25;

    smoothedCameraPositon.lerp(cameraPosition, 7 * delta);
    smoothedCameraTarget.lerp(cameraTarget, 7 * delta);

    // TODO: rotate camera in the direction of the car

    state.camera.position.copy(smoothedCameraPositon);
    state.camera.lookAt(smoothedCameraTarget);
  });

  const { nodes, materials } = useGLTF(
    "https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/truck/model.gltf"
  ) as any;
  return (
    <RigidBody
      linearDamping={0.5}
      canSleep={false}
      ref={chasisBodyRef}
      colliders={false}
      position={[0, 1, 0]}
      type="dynamic"
    >
      <group castShadow receiveShadow dispose={null}>
        <MeshCollider type="hull">
          <group ref={chasisMeshRef}>
            <mesh
              castShadow
              geometry={nodes.Mesh_body002.geometry}
              material={materials.plastic}
            />
            <mesh
              geometry={nodes.Mesh_body002_1.geometry}
              // original: material={materials.paintGreen}
            >
              <meshStandardMaterial color="DodgerBlue" />
            </mesh>
            <mesh
              geometry={nodes.Mesh_body002_2.geometry}
              material={materials.lightFront}
            />
            <mesh
              geometry={nodes.Mesh_body002_3.geometry}
              material={materials._defaultMat}
            />
            <mesh
              geometry={nodes.Mesh_body002_4.geometry}
              material={materials.window}
            />
            <mesh
              geometry={nodes.Mesh_body002_5.geometry}
              material={materials.lightBack}
            />
          </group>
        </MeshCollider>
        <group
          ref={(ref) => ((wheelsRef.current as any)[2] = ref)}
          position={[-0.35, 0.3, 0.76]}
          scale={[-1, 1, 1]}
        >
          <mesh
            geometry={nodes.Mesh_wheel_frontLeft002.geometry}
            material={nodes.Mesh_wheel_frontLeft002.material}
          />
          <mesh
            geometry={nodes.Mesh_wheel_frontLeft002_1.geometry}
            material={nodes.Mesh_wheel_frontLeft002_1.material}
          />
        </group>
        <group
          ref={(ref) => ((wheelsRef.current as any)[3] = ref)}
          position={[0.35, 0.3, 0.76]}
        >
          <mesh
            geometry={nodes.Mesh_wheel_frontLeft002.geometry}
            material={nodes.Mesh_wheel_frontLeft002.material}
          />
          <mesh
            geometry={nodes.Mesh_wheel_frontLeft002_1.geometry}
            material={nodes.Mesh_wheel_frontLeft002_1.material}
          />
        </group>
        <group
          ref={(ref) => ((wheelsRef.current as any)[0] = ref)}
          position={[-0.35, 0.3, -0.86]}
          scale={[-1, 1, 1]}
        >
          <mesh
            geometry={nodes.Mesh_wheel_frontLeft002.geometry}
            material={nodes.Mesh_wheel_frontLeft002.material}
          />
          <mesh
            geometry={nodes.Mesh_wheel_frontLeft002_1.geometry}
            material={nodes.Mesh_wheel_frontLeft002_1.material}
          />
        </group>
        <group
          ref={(ref) => ((wheelsRef.current as any)[1] = ref)}
          position={[0.35, 0.3, -0.86]}
        >
          <mesh
            geometry={nodes.Mesh_wheel_frontLeft002.geometry}
            material={nodes.Mesh_wheel_frontLeft002.material}
          />
          <mesh
            geometry={nodes.Mesh_wheel_frontLeft002_1.geometry}
            material={nodes.Mesh_wheel_frontLeft002_1.material}
          />
        </group>
      </group>
    </RigidBody>
  );
}

useGLTF.preload(
  "https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/truck/model.gltf"
);
