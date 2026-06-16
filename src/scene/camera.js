import * as THREE from 'three'

// The camera becomes the player's first-person view. Its position is assigned
// from the player spawn after both objects have been created.
export function createCamera() {
  const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    120,
  )

  return camera
}
