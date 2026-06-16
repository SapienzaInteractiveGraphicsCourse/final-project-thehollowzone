import * as THREE from 'three'

import { POWER_UP_CONFIG } from '../config/powerUps.js'
import { createDoublePointsPickup } from '../objects/DoublePointsPickup.js'
import { createMaxAmmoPickup } from '../objects/MaxAmmoPickup.js'

export { POWER_UP_CONFIG } from '../config/powerUps.js'

const pickupPosition = new THREE.Vector3()

export function rollPowerUpDrops(
  zombie,
  random = Math.random,
  config = POWER_UP_CONFIG,
) {
  if (!zombie || zombie.powerUpDropRolled) return []

  // The flag is set before either independent roll so repeated death
  // callbacks can never create another set of drops.
  zombie.powerUpDropRolled = true
  const drops = []
  if (random() < config.maxAmmoDropChance) drops.push('max-ammo')
  if (random() < config.doublePointsDropChance) drops.push('double-points')
  return drops
}

export function createPowerUpSystem({
  scene,
  permanentPickups = [],
  random = Math.random,
  config = {},
} = {}) {
  const settings = { ...POWER_UP_CONFIG, ...config }
  const activePickups = [...permanentPickups]
  let nextDropId = 1

  function addDroppedPickup(type, position, offsetX = 0) {
    const data = {
      id: `zombie-drop-${nextDropId}`,
      position: {
        x: position.x + offsetX,
        y: Math.max(0.48, position.y + 0.48),
        z: position.z,
      },
      isPermanent: false,
      lifetime: settings.droppedPickupLifetime,
    }
    nextDropId += 1
    const pickup =
      type === 'max-ammo'
        ? createMaxAmmoPickup(data)
        : createDoublePointsPickup(data)
    pickup.scale.setScalar(0.82)
    scene.add(pickup)
    activePickups.push(pickup)
    return pickup
  }

  function handleZombieKilled(zombie) {
    const dropTypes = rollPowerUpDrops(zombie, random, settings)
    const deathPosition = zombie?.group?.position
    if (!deathPosition || dropTypes.length === 0) return []

    return dropTypes.map((type, index) => {
      const offsetX =
        dropTypes.length > 1 ? (index === 0 ? -0.3 : 0.3) : 0
      return addDroppedPickup(type, deathPosition, offsetX)
    })
  }

  function findNearby(player) {
    let nearest = null
    let nearestDistance = settings.interactionRange

    activePickups.forEach((pickup) => {
      const state = pickup.userData.powerUpPickup
      if (!state || state.isCollected) return
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

  function collect(pickup) {
    const state = pickup?.userData.powerUpPickup
    if (!state || state.isCollected) return null

    // This shared guard protects both room supplies and zombie drops from
    // repeated E presses in the same frame.
    state.isCollected = true
    if (pickup.userData.maxAmmoPickup) {
      pickup.userData.maxAmmoPickup.isCollected = true
    }
    pickup.visible = false
    return state.type
  }

  function removeDroppedPickup(pickup, index) {
    scene.remove(pickup)
    activePickups.splice(index, 1)
    pickup.traverse((object) => {
      object.geometry?.dispose()
      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material]
      materials.forEach((material) => {
        material?.map?.dispose()
        material?.dispose()
      })
    })
  }

  function update(delta, elapsedTime, isGameActive) {
    for (let index = activePickups.length - 1; index >= 0; index -= 1) {
      const pickup = activePickups[index]
      const state = pickup.userData.powerUpPickup
      if (!state) continue

      if (state.isCollected) {
        if (!state.isPermanent) {
          removeDroppedPickup(pickup, index)
        }
        continue
      }
      if (!isGameActive) continue

      pickup.rotation.y += delta * 0.65
      pickup.position.y =
        pickup.userData.baseY +
        Math.sin(elapsedTime * 2.3 + index * 0.7) * 0.08
      const pulse = 0.9 + Math.sin(elapsedTime * 4 + index) * 0.28
      pickup.userData.accentMaterial.emissiveIntensity = pulse
      pickup.userData.marker.scale.setScalar(1 + (pulse - 0.9) * 0.12)

      if (state.isPermanent) continue
      state.lifetimeRemaining = Math.max(
        0,
        state.lifetimeRemaining - delta,
      )
      const isFlashing =
        state.lifetimeRemaining <= settings.pickupFlashDuration
      pickup.visible =
        !isFlashing ||
        Math.floor(state.lifetimeRemaining * 8) % 2 === 0

      if (state.lifetimeRemaining === 0) {
        removeDroppedPickup(pickup, index)
      }
    }
  }

  return {
    config: settings,
    collect,
    findNearby,
    handleZombieKilled,
    update,
    getActivePickups() {
      return [...activePickups]
    },
  }
}
