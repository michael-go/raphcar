import { HeightfieldCollider, RigidBody } from "@react-three/rapier";
import { useMemo } from "react";
import * as THREE from "three";

export function Terrain() {
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
