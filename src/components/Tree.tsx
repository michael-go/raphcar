import { useGLTF } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import { useMemo } from "react";
import * as THREE from "three";

const treeUrls = [
  "https://raw.githubusercontent.com/pmndrs/market-assets/main/files/models/tree-big/model.gltf",
  "https://raw.githubusercontent.com/pmndrs/market-assets/main/files/models/tree-small/model.gltf",
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

  const clonedScene = useMemo(() => {
    const clone = tree.scene.clone();
    clone.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
        mat.metalness = 0;
        if (mat.name.startsWith("roof")) {
          mat.color.set("#3a6b35");
        } else if (mat.name.startsWith("wood")) {
          mat.color.set("#5c3a1e");
        }
        mesh.material = mat;
      }
    });
    return clone;
  }, [tree.scene]);

  return (
    <RigidBody type="fixed" colliders="trimesh" position={position}>
      <group>
        <primitive object={clonedScene} scale={scale} />
      </group>
    </RigidBody>
  );
}

treeUrls.forEach((url) => {
  useGLTF.preload(url);
});
