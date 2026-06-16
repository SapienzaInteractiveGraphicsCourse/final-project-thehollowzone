import * as THREE from 'three'

// Shared helper so every zombie mesh receives the same shadow setup.
export function createPartMesh(name, geometry, material, position) {
  const mesh = new THREE.Mesh(geometry, material)
  mesh.name = name
  mesh.position.set(position.x, position.y, position.z)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}
