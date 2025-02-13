import { useKeyboardControls, useGLTF, PositionalAudio } from "@react-three/drei";
import { useFrame, RootState } from "@react-three/fiber";
import { RefObject, useEffect, useRef, useState } from "react";
import { MathUtils } from "three";
import * as THREE from "three";

import { ControlKeys } from "../common/controls.ts";
import {
  MeshCollider,
  RapierRigidBody,
  RigidBody,
  useRapier,
} from "@react-three/rapier";
import {
  WheelInfo,
  useVehicleController,
} from "../hooks/vehicleController.tsx";
import { Collider } from "@dimforge/rapier3d-compat";

export function Car() {
  const [smoothedCameraPosition] = useState(new THREE.Vector3(10, 10, 10));
  const [smoothedCameraTarget] = useState(new THREE.Vector3());

  const chasisMeshRef: RefObject<THREE.Group> = useRef(null);
  const chasisBodyRef: RefObject<RapierRigidBody> = useRef(null);
  const wheelsRef: RefObject<(THREE.Object3D | null)[]> = useRef([]);
  const engineSoundRef: RefObject<THREE.PositionalAudio> = useRef(null);
  const accelerateSoundRef: RefObject<THREE.PositionalAudio> = useRef(null);
  const crashSoundRef: RefObject<THREE.PositionalAudio> = useRef(null);

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

  const [sub, get] = useKeyboardControls<ControlKeys>();
  const { rapier, world } = useRapier();

  useFrame((_, delta) => {
    if (!vehicleController) return;

    const accelerateForce = 48;
    const brakeForce = 12;
    const steerAngle = Math.PI / 18;

    const speed = vehicleController.currentVehicleSpeed();

    const controls = get();

    engineSoundRef.current?.setVolume(0.7 - Math.abs(speed) / 20);
    if (controls.forward || controls.back) {
      if (engineSoundRef.current?.isPlaying === false) {
        engineSoundRef.current?.play();
      }
      accelerateSoundRef.current?.setVolume(Math.abs(speed) / 30);
      accelerateSoundRef.current?.setPlaybackRate(1 + Math.abs(speed) / 30);
      if (accelerateSoundRef.current?.isPlaying === false) {
        accelerateSoundRef.current?.play();
      }
    } else {
      const accelerateVolume = accelerateSoundRef.current?.getVolume();
      if (accelerateVolume && accelerateVolume > 0) {
        accelerateSoundRef.current?.setVolume(accelerateVolume - delta * 1.2)
      } else {
        accelerateSoundRef.current?.stop();
      }
    }

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

  const jumproll = () => {
    if (!chasisBodyRef.current) return;

    const origin = chasisBodyRef.current.translation();
    const direction = { x: 0, y: -1, z: 0 };
    const ray = new rapier.Ray(origin, direction);
    const hit = world.castRay(
      ray,
      2,
      true,
      undefined,
      undefined,
      undefined,
      undefined,
      (collider: Collider) => {
        return collider.shape.type == rapier.ShapeType.HeightField;
      }
    );

    console.log(hit)
    // TODO: check also rotation of the car, otherwise it can jump during jumps
    if (hit && hit.timeOfImpact > 0.15 && hit.timeOfImpact < 1.5) {
      chasisBodyRef.current.applyImpulse({ x: 5, y: 30, z: 5 }, true);
      chasisBodyRef.current.applyTorqueImpulse(
        { x: Math.random() * 5, y: Math.random() * 5, z: Math.random() * 5 },
        true
      );
    }
  };

  useFrame((state: RootState, delta: number) => {
    if (!chasisMeshRef.current) return;

    // TODO: make the camera less jerky, it gives me motion sickness

    // camera position
    const bodyWorldMatrix = chasisMeshRef.current.matrixWorld;

    const relativeCameraOffset = new THREE.Vector3(0, 3, 7);
    relativeCameraOffset.applyMatrix4(bodyWorldMatrix);

    const cameraPosition = new THREE.Vector3();
    cameraPosition.copy(relativeCameraOffset);
    cameraPosition.y = Math.max(3, relativeCameraOffset.y);

    smoothedCameraPosition.lerp(cameraPosition, 3 * delta);
    state.camera.position.copy(smoothedCameraPosition);

    // camera target
    const bodyPosition = chasisMeshRef.current.getWorldPosition(
      new THREE.Vector3()
    );
    const cameraTarget = new THREE.Vector3();
    cameraTarget.copy(bodyPosition);
    cameraTarget.y += 0.25;
    smoothedCameraTarget.lerp(cameraTarget, 5 * delta);

    state.camera.lookAt(smoothedCameraTarget);
  });

  useEffect(() => {
    const unsubscribeJump = sub(
      (state) => state.jumproll,
      (value) => {
        if (value) jumproll();
      }
    );

    return () => {
      unsubscribeJump();
    };
  }, []);

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
      onCollisionEnter={(event) => {
        if ((event.other.rigidBodyObject as any)?.colliders) {
          console.log("real collision", event);
          if (crashSoundRef.current?.isPlaying === false) {
            crashSoundRef.current?.play();
          }
        }
      }}
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
      <PositionalAudio ref={engineSoundRef} url="/assets/sounds/engine.mp3" loop distance={5} />
      <PositionalAudio ref={accelerateSoundRef} url="/assets/sounds/accelerate.mp3" loop distance={5} />
      <PositionalAudio ref={crashSoundRef} url="/assets/sounds/crash.mp3" loop={false} distance={5} />

    </RigidBody>
  );
}

useGLTF.preload(
  "https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/truck/model.gltf"
);
