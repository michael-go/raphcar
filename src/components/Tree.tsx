import { useGLTF } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import { useMemo } from "react";

const treeUrls = [
  "https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/tree-beech/model.gltf",
  "https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/tree-lime/model.gltf",
];

export function Tree({
  position = [0, 0, 0] as [number, number, number],
  scale = [1, 1, 1] as [number, number, number],
}) {
  const treeIndex = useMemo(
    () => Math.floor(Math.random() * treeUrls.length),
    [scale],
  );
  const tree = useGLTF(treeUrls[treeIndex]);

  // TODO: cloning the entire scene is expensive, should share the geometry (at least)

  return (
    <RigidBody type="fixed" colliders="trimesh" position={position}>
      <group>
        <primitive object={tree.scene.clone()} scale={scale} />
      </group>
    </RigidBody>
  );
}

treeUrls.forEach((url) => {
  useGLTF.preload(url);
});
