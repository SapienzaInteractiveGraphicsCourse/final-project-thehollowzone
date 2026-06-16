import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js'

// PointerLockControls turns mouse movement into first-person camera rotation.
// Calling `lock()` must follow a user click because browsers protect pointer lock.
export function createFirstPersonControls(camera, renderer) {
  const controls = new PointerLockControls(camera, renderer.domElement)
  // Mouse sensitivity for first-person camera movement.
  controls.pointerSpeed = 1.6
  return controls
}

// OrbitControls remain available for map inspection, but they stay disabled
// during gameplay because both camera control systems would conflict.
export function createOrbitControls(camera, renderer, enabled = true) {
  const controls = new OrbitControls(camera, renderer.domElement)

  controls.target.set(2, 0, -5)
  controls.enabled = enabled
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.minDistance = 8
  controls.maxDistance = 100
  // OrbitControls only handle input when debug view enables them.
  if (enabled) {
    controls.update()
  }

  return controls
}
