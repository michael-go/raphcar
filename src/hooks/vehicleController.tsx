// This is based on https://github.com/grndctrl/vehicle-canary

import { DynamicRayCastVehicleController } from "@dimforge/rapier3d-compat";
import { RefObject, useEffect, useState } from "react";
import { Box3, Object3D, Vector3 } from "three";
import {
  RapierRigidBody,
  useAfterPhysicsStep,
  useRapier,
} from "@react-three/rapier";

export type WheelInfo = {
  axleCs: Vector3;
  suspensionRestLength: number;
  suspensionStiffness: number;
  maxSuspensionTravel: number;
};

export function useVehicleController(
  chassisRef: RefObject<RapierRigidBody | null>,
  wheelsRef: RefObject<(Object3D | null)[]>,
  wheelsInfo: WheelInfo[],
) {
  const { world } = useRapier();
  const [vehicleController, setVehicleController] =
    useState<DynamicRayCastVehicleController>();

  useEffect(() => {
    const { current: chassis } = chassisRef;
    const { current: wheels } = wheelsRef;

    if (!chassis || !wheels) return;

    const vehicle = world.createVehicleController(chassis);

    wheels.forEach((wheel, i) => {
      if (!wheel) return;
      const boundingBox = new Box3().setFromObject(wheel);
      const radius = (boundingBox.max.y - boundingBox.min.y) * 0.5;

      vehicle.addWheel(
        wheel.position,
        new Vector3(0, -1, 0),
        wheelsInfo[i].axleCs,
        wheelsInfo[i].suspensionRestLength,
        radius,
      );
    });

    wheels.forEach((_wheel, index) => {
      vehicle.setWheelSuspensionStiffness(
        index,
        wheelsInfo[index].suspensionStiffness,
      );
      vehicle.setWheelMaxSuspensionTravel(
        index,
        wheelsInfo[index].maxSuspensionTravel,
      );
    });

    setVehicleController(vehicle);

    return () => {
      world.removeVehicleController(vehicle);
    };
  }, []);

  useAfterPhysicsStep((world) => {
    if (!vehicleController) return;

    vehicleController.updateVehicle(world.timestep);

    const { current: wheels } = wheelsRef;

    wheels?.forEach((wheel, index) => {
      if (!wheel) return;
      const connection =
        vehicleController.wheelChassisConnectionPointCs(index)?.y || 0;
      const suspension = vehicleController.wheelSuspensionLength(index) || 0;
      const steering = vehicleController.wheelSteering(index) || 0;

      wheel.position.setY(connection - suspension);
      wheel.rotation.y = steering;
      // TODO: this worked in https://github.com/grndctrl/vehicle-canary, but wobbles here.
      //   maybe because how keyboard events are handled?
      //   but anyway, there should be better way to compute rotation in the current wheel direction.
      //
      // const rotation = vehicleController.wheelRotation(index) || 0;
      // wheel.rotation.z = -rotation;
    });
  });

  return {
    vehicleController,
    wheels: [],
  };
}
