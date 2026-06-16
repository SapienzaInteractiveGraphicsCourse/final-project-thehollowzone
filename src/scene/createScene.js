import * as THREE from 'three'
import { createArena } from '../objects/Arena.js'
import {
  createMaxAmmoPickup,
  MAX_AMMO_PICKUP_DATA,
} from '../objects/MaxAmmoPickup.js'
import { createWeaponPickup } from '../objects/Weapon.js'
import { createCamera } from './camera.js'
import { createLights } from './lights.js'

export function createScene() {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x07090d)
  scene.fog = new THREE.FogExp2(0x07090d, 0.012)

  const camera = createCamera()
  const lights = createLights(scene)

  const arena = createArena()
  scene.add(arena)

  // Shotgun goes in the second room and rifle goes in the third room.
  const weaponPickups = [
    createWeaponPickup('shotgun', { x: -7, y: 0.45, z: 12.8 }),
    createWeaponPickup('rifle', { x: 17.5, y: 0.45, z: -8.5 }),
  ]
  weaponPickups.forEach((pickup) => {
    pickup.userData.baseY = pickup.position.y
    scene.add(pickup)
  })

  const maxAmmoPickups = MAX_AMMO_PICKUP_DATA.map(createMaxAmmoPickup)
  maxAmmoPickups.forEach((pickup) => scene.add(pickup))

  return {
    scene,
    camera,
    lights,
    arena,
    weaponPickups,
    maxAmmoPickups,
  }
}
