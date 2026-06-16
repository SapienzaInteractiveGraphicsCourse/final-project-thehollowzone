import * as THREE from 'three'

export const MAX_AMMO_PICKUP_DATA = Object.freeze([
  Object.freeze({
    id: 'max-ammo-second-room',
    room: 'SecondRoomSection',
    position: Object.freeze({ x: -8.8, y: 0.48, z: 14.1 }),
  }),
  Object.freeze({
    id: 'max-ammo-fourth-room',
    room: 'FourthRoomSection',
    position: Object.freeze({ x: 21.2, y: 0.48, z: -22 }),
  }),
])

const pickupPosition = new THREE.Vector3()

function createLabel() {
  if (typeof document === 'undefined') {
    const label = new THREE.Sprite(new THREE.SpriteMaterial())
    label.name = 'MaxAmmoLabel'
    label.position.y = 1.05
    label.scale.set(1.7, 0.43, 1)
    return label
  }

  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 128
  const context = canvas.getContext('2d')
  context.fillStyle = 'rgba(5, 10, 12, 0.88)'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.strokeStyle = '#6de4d3'
  context.lineWidth = 7
  context.strokeRect(5, 5, canvas.width - 10, canvas.height - 10)
  context.fillStyle = '#eefcf9'
  context.font = '700 58px monospace'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText('MAX AMMO', canvas.width / 2, canvas.height / 2)

  const label = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(canvas),
      transparent: true,
      depthWrite: false,
    }),
  )
  label.name = 'MaxAmmoLabel'
  label.position.y = 1.05
  label.scale.set(1.7, 0.43, 1)
  return label
}

export function createMaxAmmoPickup(data) {
  const group = new THREE.Group()
  group.name = `MaxAmmoPickup_${data.id}`
  group.position.set(data.position.x, data.position.y, data.position.z)

  const crateMaterial = new THREE.MeshStandardMaterial({
    color: 0x172326,
    metalness: 0.65,
    roughness: 0.48,
  })
  const accentMaterial = new THREE.MeshStandardMaterial({
    color: 0x6de4d3,
    emissive: 0x16645c,
    emissiveIntensity: 1.1,
    metalness: 0.35,
    roughness: 0.3,
  })
  const cartridgeMaterial = new THREE.MeshStandardMaterial({
    color: 0xd6a955,
    metalness: 0.8,
    roughness: 0.25,
  })

  const crate = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.55, 0.65),
    crateMaterial,
  )
  crate.name = 'MaxAmmoSupplyCrate'

  const band = new THREE.Mesh(
    new THREE.BoxGeometry(0.96, 0.16, 0.7),
    accentMaterial,
  )
  band.name = 'MaxAmmoCrateBand'

  const marker = new THREE.Mesh(
    new THREE.TorusGeometry(0.58, 0.035, 8, 32),
    accentMaterial,
  )
  marker.name = 'MaxAmmoGlowMarker'
  marker.position.y = -0.32
  marker.rotation.x = Math.PI / 2

  const cartridges = new THREE.Group()
  cartridges.name = 'MaxAmmoCartridges'
  for (let index = 0; index < 5; index += 1) {
    const cartridge = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 0.34, 8),
      cartridgeMaterial,
    )
    cartridge.rotation.z = Math.PI / 2
    cartridge.position.set(-0.25 + index * 0.125, 0.36, 0)
    cartridges.add(cartridge)
  }

  group.add(crate, band, marker, cartridges, createLabel())
  group.traverse((object) => {
    if (!object.isMesh) return
    object.castShadow = object !== marker
    object.receiveShadow = true
  })

  group.userData.maxAmmoPickup = {
    id: data.id,
    room: data.room,
    isCollected: false,
  }
  group.userData.powerUpPickup = {
    id: data.id,
    type: 'max-ammo',
    room: data.room ?? null,
    isPermanent: data.isPermanent !== false,
    isCollected: false,
    lifetimeRemaining: data.lifetime ?? null,
  }
  group.userData.baseY = group.position.y
  group.userData.marker = marker
  group.userData.accentMaterial = accentMaterial
  return group
}

export function findNearbyMaxAmmoPickup(
  player,
  pickups,
  interactionRange = 1.8,
) {
  let nearest = null
  let nearestDistance = interactionRange

  pickups.forEach((pickup) => {
    if (pickup.userData.maxAmmoPickup?.isCollected) return
    pickup.getWorldPosition(pickupPosition)
    const distance = Math.hypot(
      player.position.x - pickupPosition.x,
      player.position.z - pickupPosition.z,
    )
    if (distance <= nearestDistance) {
      nearest = pickup
      nearestDistance = distance
    }
  })

  return nearest
}

export function collectMaxAmmoPickup(pickup) {
  const state = pickup?.userData.maxAmmoPickup
  if (!state || state.isCollected) return false

  // The state guard prevents repeated E presses from applying Max Ammo twice.
  state.isCollected = true
  if (pickup.userData.powerUpPickup) {
    pickup.userData.powerUpPickup.isCollected = true
  }
  pickup.visible = false
  return true
}

export function updateMaxAmmoPickups(pickups, delta, elapsedTime) {
  pickups.forEach((pickup, index) => {
    if (pickup.userData.maxAmmoPickup?.isCollected) return

    pickup.rotation.y += delta * 0.55
    pickup.position.y =
      pickup.userData.baseY +
      Math.sin(elapsedTime * 2 + index * 0.8) * 0.08

    const pulse = 0.85 + Math.sin(elapsedTime * 3.5 + index) * 0.25
    pickup.userData.accentMaterial.emissiveIntensity = pulse
    pickup.userData.marker.scale.setScalar(1 + (pulse - 0.85) * 0.12)
  })
}
