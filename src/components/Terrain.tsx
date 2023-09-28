import { HeightfieldCollider, RigidBody } from "@react-three/rapier";
import { useMemo } from "react";
import * as THREE from "three";
import { Tree } from "./Tree.tsx";

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
      (geometry.attributes.position.array as any)[index * 3 + 2] = v - 0.2;
    });
    geometry.scale(-1, 1, 1);
    geometry.rotateX(Math.PI / 2);
    geometry.rotateY(Math.PI / 2);
    geometry.rotateZ(-Math.PI);
    geometry.computeVertexNormals();

    return geometry;
  }, [heightField]);

  const geometry2 = new THREE.PlaneGeometry(100, 100);
  geometry2.rotateX(-Math.PI / 2);

  return (
    <>
      {Array.from({ length: 100 }, (_, i) => (
        <Tree
          key={i}
          position={[
            (Math.random() - 0.5) * height,
            0,
            (Math.random() - 0.5) * width,
          ]}
          scale={[
            Math.max(0.8, Math.random()),
            Math.max(0.7, Math.random()),
            Math.max(0.8, Math.random()),
          ]}
        />
      ))}
      <RigidBody colliders={false} position={[0, 0, 0]}>
        <mesh geometry={geometry} castShadow receiveShadow>
          <meshStandardMaterial
            color="limegreen"
            side={THREE.DoubleSide}
            shadowSide={THREE.DoubleSide}
          />
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
    </>
  );
}
