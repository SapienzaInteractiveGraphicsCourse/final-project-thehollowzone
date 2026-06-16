import * as THREE from 'three'

import {
  createWeapon,
  WEAPON_CONFIG,
} from '../objects/Weapon.js'
import { setZombieAnimationState } from './animation.js'
import {
  awardPoints,
  canAfford,
  spendPoints,
} from './gameState.js'

const screenCenter = new THREE.Vector2(0, 0)
const pickupPosition = new THREE.Vector3()
const muzzlePosition = new THREE.Vector3()
const impactNormal = new THREE.Vector3()
const tracerEnd = new THREE.Vector3()
const baseRayOrigin = new THREE.Vector3()
const baseRayDirection = new THREE.Vector3()
const cameraRight = new THREE.Vector3()
const cameraUp = new THREE.Vector3()
const normalMatrix = new THREE.Matrix3()
const forwardNormal = new THREE.Vector3(0, 0, 1)

function getZombieFromHitObject(hitObject, zombies) {
  return zombies.find((zombie) => {
    let current = hitObject

    while (current) {
      if (current === zombie.group) return true
      current = current.parent
    }

    return false
  })
}

function startZombieHitFlash(zombie) {
  if (!zombie.hitFeedback.materials.length) {
    const uniqueMaterials = new Set()

    zombie.group.traverse((object) => {
      if (!object.isMesh) return
      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material]

      materials.forEach((material) => {
        if (material?.emissive) uniqueMaterials.add(material)
      })
    })

    zombie.hitFeedback.materials = [...uniqueMaterials].map((material) => ({
      material,
      emissive: material.emissive.clone(),
      emissiveIntensity: material.emissiveIntensity,
    }))
  }

  zombie.hitFeedback.materials.forEach(({ material }) => {
    material.emissive.setHex(0x8f0000)
    material.emissiveIntensity = 1.4
  })
  zombie.hitFeedback.timer = 0.12
}

function createShotEffects(scene) {
  const impactPool = []
  const tracerPool = []
  const holeGeometry = new THREE.CircleGeometry(0.045, 10)
  const smokeGeometry = new THREE.SphereGeometry(0.035, 6, 5)

  // These effects are pooled so old shots get reused instead of adding
  // more and more meshes to the scene.
  for (let index = 0; index < 24; index += 1) {
    const group = new THREE.Group()
    const hole = new THREE.Mesh(
      holeGeometry,
      new THREE.MeshBasicMaterial({
        color: 0x17191b,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      }),
    )
    const smokePuffs = []

    group.add(hole)
    for (let puffIndex = 0; puffIndex < 3; puffIndex += 1) {
      const puff = new THREE.Mesh(
        smokeGeometry,
        new THREE.MeshBasicMaterial({
          color: 0x7d8285,
          transparent: true,
          opacity: 0,
          depthWrite: false,
        }),
      )
      puff.userData.offset = puffIndex * 0.035
      group.add(puff)
      smokePuffs.push(puff)
    }

    group.visible = false
    scene.add(group)
    impactPool.push({ group, hole, smokePuffs, timer: 0 })
  }

  for (let index = 0; index < 16; index += 1) {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(),
      new THREE.Vector3(),
    ])
    const line = new THREE.Line(
      geometry,
      new THREE.LineBasicMaterial({
        color: 0xffd477,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
      }),
    )
    line.frustumCulled = false
    line.visible = false
    scene.add(line)
    tracerPool.push({ line, timer: 0 })
  }

  return {
    impactPool,
    tracerPool,
    nextImpact: 0,
    nextTracer: 0,
  }
}

function showImpactEffect(effects, hit) {
  if (!effects) return
  const effect = effects.impactPool[effects.nextImpact]
  effects.nextImpact =
    (effects.nextImpact + 1) % effects.impactPool.length

  normalMatrix.getNormalMatrix(hit.object.matrixWorld)
  impactNormal
    .copy(hit.face?.normal ?? forwardNormal)
    .applyMatrix3(normalMatrix)
    .normalize()

  effect.group.position.copy(hit.point).addScaledVector(impactNormal, 0.008)
  effect.group.quaternion.setFromUnitVectors(forwardNormal, impactNormal)
  effect.group.scale.setScalar(1)
  effect.group.visible = true
  effect.timer = 3
  effect.hole.material.opacity = 0.9

  effect.smokePuffs.forEach((puff, index) => {
    puff.position.set(
      (index - 1) * 0.025,
      puff.userData.offset,
      0.025,
    )
    puff.scale.setScalar(1)
    puff.material.opacity = 0.42 - index * 0.08
  })
}

function showTracer(effects, start, end) {
  if (!effects) return
  const tracer = effects.tracerPool[effects.nextTracer]
  effects.nextTracer =
    (effects.nextTracer + 1) % effects.tracerPool.length

  const positions = tracer.line.geometry.attributes.position
  positions.setXYZ(0, start.x, start.y, start.z)
  positions.setXYZ(1, end.x, end.y, end.z)
  positions.needsUpdate = true
  tracer.line.material.opacity = 0.9
  tracer.line.visible = true
  tracer.timer = 0.075
}

function updateShotEffects(effects, delta) {
  if (!effects) return
  effects.tracerPool.forEach((tracer) => {
    if (tracer.timer <= 0) return
    tracer.timer = Math.max(0, tracer.timer - delta)
    tracer.line.material.opacity = tracer.timer / 0.075
    tracer.line.visible = tracer.timer > 0
  })

  effects.impactPool.forEach((effect) => {
    if (effect.timer <= 0) return

    effect.timer = Math.max(0, effect.timer - delta)
    const age = 3 - effect.timer
    effect.hole.material.opacity = Math.min(0.9, effect.timer * 0.9)

    effect.smokePuffs.forEach((puff, index) => {
      puff.position.y += delta * (0.09 + index * 0.025)
      puff.position.x += delta * (index - 1) * 0.018
      puff.scale.addScalar(delta * 0.28)
      puff.material.opacity =
        Math.max(0, 0.42 - age * 0.38) * (1 - index * 0.14)
    })

    effect.group.visible = effect.timer > 0
  })
}

function collectEnvironmentMeshes(environmentRoot) {
  const meshes = []

  environmentRoot.traverse((object) => {
    if (object.isMesh && object.userData.bulletImpactSurface) {
      meshes.push(object)
    }
  })

  return meshes
}

function isVisibleInHierarchy(object) {
  let current = object
  while (current) {
    if (!current.visible) return false
    current = current.parent
  }
  return true
}

export function updateZombieHitFeedback(zombies, delta) {
  zombies.forEach((zombie) => {
    if (zombie.hitFeedback.timer <= 0) return

    zombie.hitFeedback.timer = Math.max(
      0,
      zombie.hitFeedback.timer - delta,
    )

    if (zombie.hitFeedback.timer === 0) {
      zombie.hitFeedback.materials.forEach(
        ({ material, emissive, emissiveIntensity }) => {
          material.emissive.copy(emissive)
          material.emissiveIntensity = emissiveIntensity
        },
      )
    }
  })
}

export function startWeaponReload(weapon, onReloadStarted = () => {}) {
  if (
    !weapon ||
    weapon.isReloading ||
    weapon.ammoInMagazine >= weapon.magazineSize ||
    weapon.reserveAmmo <= 0
  ) {
    return false
  }

  weapon.isReloading = true
  weapon.reloadTimer = weapon.reloadDuration
  weapon.recoilTimer = 0
  // The callback only runs after validation, so failed reload attempts stay
  // silent and one reload produces one sound.
  onReloadStarted(weapon.type)
  return true
}

function finishWeaponReload(weapon) {
  const neededAmmo = weapon.magazineSize - weapon.ammoInMagazine
  const loadedAmmo = Math.min(neededAmmo, weapon.reserveAmmo)

  // Reserve ammo is only removed when the new magazine is ready.
  weapon.ammoInMagazine += loadedAmmo
  weapon.reserveAmmo -= loadedAmmo
  weapon.isReloading = false
  weapon.reloadTimer = 0
}

function resetReloadPart(weapon) {
  if (!weapon.parts.reloadPart) return
  weapon.parts.reloadPart.position.copy(weapon.reloadPartBasePosition)
  weapon.parts.reloadPart.rotation.copy(weapon.reloadPartBaseRotation)
}

function resetWeaponTransform(weapon) {
  weapon.group.position.copy(weapon.basePosition)
  weapon.group.rotation.copy(weapon.baseRotation)
  resetReloadPart(weapon)
}

export function refillWeapons(weapons, equippedWeapon = null) {
  const ownedWeapons = weapons.filter(Boolean)
  const refilledWeaponTypes = []

  ownedWeapons.forEach((weapon) => {
    weapon.reserveAmmo = Math.max(0, weapon.maxReserveAmmo ?? 0)
    refilledWeaponTypes.push(weapon.type)
  })

  let equippedWeaponReloaded = false
  if (equippedWeapon) {
    equippedWeapon.isReloading = false
    equippedWeapon.reloadTimer = 0
    equippedWeapon.recoilTimer = 0
    resetWeaponTransform(equippedWeapon)

    // Only an empty equipped weapon receives an emergency instant reload.
    if (equippedWeapon.ammoInMagazine === 0) {
      const loadedAmmo = Math.min(
        equippedWeapon.magazineSize,
        equippedWeapon.reserveAmmo,
      )
      equippedWeapon.ammoInMagazine = loadedAmmo
      equippedWeapon.reserveAmmo -= loadedAmmo
      equippedWeaponReloaded = loadedAmmo > 0
    }
  }

  return {
    refilledWeaponTypes,
    equippedWeaponReloaded,
  }
}

function updateReloadAnimation(weapon, delta) {
  weapon.reloadTimer = Math.max(0, weapon.reloadTimer - delta)
  const progress = 1 - weapon.reloadTimer / weapon.reloadDuration
  const motion = Math.sin(progress * Math.PI)

  weapon.group.position.copy(weapon.basePosition)
  weapon.group.rotation.copy(weapon.baseRotation)
  resetReloadPart(weapon)

  if (weapon.type === 'pistol') {
    weapon.group.position.y -= motion * 0.1
    weapon.group.rotation.z -= motion * 0.62
    weapon.group.rotation.x += motion * 0.18
    weapon.parts.reloadPart.position.y -= motion * 0.18
  } else if (weapon.type === 'shotgun') {
    weapon.group.position.y -= motion * 0.08
    weapon.group.rotation.z += motion * 0.42
    weapon.group.rotation.x -= motion * 0.16
    weapon.parts.reloadPart.position.z +=
      Math.sin(progress * Math.PI * 5) * 0.085 * motion
  } else {
    weapon.group.position.y -= motion * 0.08
    weapon.group.rotation.z -= motion * 0.5
    weapon.group.rotation.y += motion * 0.16
    weapon.parts.reloadPart.position.y -= motion * 0.2
    weapon.parts.reloadPart.rotation.x += motion * 0.65
  }

  if (weapon.reloadTimer === 0) {
    finishWeaponReload(weapon)
    weapon.group.position.copy(weapon.basePosition)
    weapon.group.rotation.copy(weapon.baseRotation)
    resetReloadPart(weapon)
  }
}

export function generatePelletDirections({
  forward,
  right,
  up,
  pelletCount = 1,
  horizontalSpread = 0,
  verticalSpread = 0,
  random = Math.random,
}) {
  if (pelletCount <= 1) return [forward.clone().normalize()]

  return Array.from({ length: pelletCount }, () => {
    // Square-root radius distributes pellets naturally across the spread cone.
    const radius = Math.sqrt(random())
    const angle = random() * Math.PI * 2
    const horizontalOffset =
      Math.cos(angle) * radius * Math.tan(horizontalSpread)
    const verticalOffset =
      Math.sin(angle) * radius * Math.tan(verticalSpread)

    return forward
      .clone()
      .addScaledVector(right, horizontalOffset)
      .addScaledVector(up, verticalOffset)
      .normalize()
  })
}

function damageZombie(
  zombie,
  weapon,
  gameState,
  elapsedTime,
  onZombieKilled = () => {},
) {
  if (!zombie || zombie.isDead) return false

  awardPoints(gameState, 10)
  zombie.health = Math.max(0, zombie.health - weapon.damage)
  zombie.lastHitTime = elapsedTime
  startZombieHitFlash(zombie)

  if (zombie.health <= 0) {
    if (!zombie.killRewardGiven) {
      awardPoints(gameState, 60)
      zombie.killRewardGiven = true
      // The same guard that protects the kill reward also guarantees one
      // power-up drop roll even when several pellets land in one blast.
      onZombieKilled(zombie)
    }
    zombie.isDead = true
    zombie.metadata.isActive = false
    zombie.metadata.canMove = false
    zombie.metadata.canAttack = false
    setZombieAnimationState(zombie, 'dead')
  } else {
    setZombieAnimationState(zombie, 'hit')
  }
  return true
}

export function shootWeapon({
  weapon,
  camera,
  zombies,
  elapsedTime,
  raycaster,
  environmentMeshes,
  effects,
  gameState,
  random = Math.random,
  onPelletCast = () => {},
  onWeaponShot = () => {},
  onReloadStarted = () => {},
  onZombieKilled = () => {},
}) {
  if (!weapon || weapon.isReloading) return false

  if (weapon.ammoInMagazine <= 0) {
    startWeaponReload(weapon, onReloadStarted)
    return false
  }

  if (elapsedTime - weapon.lastShotTime < weapon.fireCooldown) {
    return false
  }

  weapon.lastShotTime = elapsedTime
  weapon.ammoInMagazine -= 1
  weapon.recoilTimer = 0.14
  weapon.muzzleFlashTimer = 0.055
  weapon.muzzleFlash.visible = true
  // This is placed after every firing check so cooldown or empty clicks cannot
  // produce a gunshot sound without actually using ammunition.
  onWeaponShot(weapon.type)

  // Pushing the gun back a little when it fires, then easing it home.
  weapon.group.position.z += weapon.recoilAmount
  weapon.group.rotation.x += weapon.recoilAmount * 0.65

  const zombieMeshes = []
  zombies.forEach((zombie) => {
    if (zombie.isDead) return
    zombie.group.traverse((object) => {
      if (object.isMesh) zombieMeshes.push(object)
    })
  })

  camera.updateMatrixWorld(true)
  weapon.parts.muzzle.getWorldPosition(muzzlePosition)

  // Build one camera-space spread, then raycast each pellet independently.
  raycaster.far = weapon.range
  raycaster.setFromCamera(screenCenter, camera)
  baseRayOrigin.copy(raycaster.ray.origin)
  baseRayDirection.copy(raycaster.ray.direction)
  cameraRight.set(1, 0, 0).applyQuaternion(camera.quaternion).normalize()
  cameraUp.set(0, 1, 0).applyQuaternion(camera.quaternion).normalize()
  const pelletDirections = generatePelletDirections({
    forward: baseRayDirection,
    right: cameraRight,
    up: cameraUp,
    pelletCount: weapon.pelletCount,
    horizontalSpread: weapon.horizontalSpread,
    verticalSpread: weapon.verticalSpread,
    random,
  })
  const activeEnvironmentMeshes = environmentMeshes.filter(
    (object) => object.parent && isVisibleInHierarchy(object),
  )
  const raycastTargets = [...zombieMeshes, ...activeEnvironmentMeshes]

  pelletDirections.forEach((direction, pelletIndex) => {
    raycaster.set(baseRayOrigin, direction)
    raycaster.far = weapon.range
    onPelletCast(direction, pelletIndex)
    const firstHit = raycaster.intersectObjects(raycastTargets, false)[0]

    if (firstHit) {
      tracerEnd.copy(firstHit.point)
    } else {
      tracerEnd
        .copy(baseRayOrigin)
        .addScaledVector(direction, weapon.range)
    }
    showTracer(effects, muzzlePosition, tracerEnd)

    if (!firstHit) return

    const zombie = getZombieFromHitObject(firstHit.object, zombies)
    if (zombie) {
      damageZombie(
        zombie,
        weapon,
        gameState,
        elapsedTime,
        onZombieKilled,
      )
    } else if (firstHit.object.userData.bulletImpactSurface) {
      showImpactEffect(effects, firstHit)
    }
  })

  // Reaching zero starts the reload without needing another empty click.
  if (weapon.ammoInMagazine === 0) {
    startWeaponReload(weapon, onReloadStarted)
  }

  return true
}

export function updateWeaponEffects(weapon, delta) {
  if (!weapon) return

  weapon.muzzleFlashTimer = Math.max(
    0,
    weapon.muzzleFlashTimer - delta,
  )
  weapon.muzzleFlash.visible = weapon.muzzleFlashTimer > 0

  if (weapon.isReloading) {
    updateReloadAnimation(weapon, delta)
    return
  }

  weapon.recoilTimer = Math.max(0, weapon.recoilTimer - delta)
  resetReloadPart(weapon)

  const returnAmount = 1 - Math.exp(-18 * delta)
  weapon.group.position.lerp(weapon.basePosition, returnAmount)
  weapon.group.rotation.x = THREE.MathUtils.lerp(
    weapon.group.rotation.x,
    weapon.baseRotation.x,
    returnAmount,
  )
  weapon.group.rotation.y = THREE.MathUtils.lerp(
    weapon.group.rotation.y,
    weapon.baseRotation.y,
    returnAmount,
  )
  weapon.group.rotation.z = THREE.MathUtils.lerp(
    weapon.group.rotation.z,
    weapon.baseRotation.z,
    returnAmount,
  )
}

export function updateWeaponPickups(
  pickups,
  elapsedTime,
  delta = 1 / 60,
  getStationState = () => 'available-for-purchase',
) {
  pickups.forEach((pickup, index) => {
    pickup.rotation.y += delta * 0.48
    pickup.position.y =
      pickup.userData.baseY +
      Math.sin(elapsedTime * 2 + index) * 0.06

    const marker = pickup.userData.marker
    if (!marker?.material?.color) return
    const state = getStationState(pickup.userData.weaponType)
    marker.material.color.setHex(
      state === 'ammo-purchase-available'
        ? 0xffc247
        : state === 'owned-ammo-available'
          ? 0x53646a
          : pickup.userData.weaponType === 'shotgun'
            ? 0xffa33a
            : 0x67d7a5,
    )
  })
}

export function checkWeaponPickups(
  player,
  pickups,
  wasInteractPressed,
) {
  if (!wasInteractPressed) return null

  const pickup = findNearbyWeaponPickup(player, pickups)
  if (pickup) return collectWeaponPickup(pickup)

  return null
}

export function findNearbyWeaponPickup(player, pickups, range = 1.7) {
  let nearestPickup = null
  let nearestDistance = range

  pickups.forEach((pickup) => {
    pickup.getWorldPosition(pickupPosition)
    const distance = Math.hypot(
      player.position.x - pickupPosition.x,
      player.position.z - pickupPosition.z,
    )

    if (distance <= nearestDistance) {
      nearestPickup = pickup
      nearestDistance = distance
    }
  })

  return nearestPickup
}

export function collectWeaponPickup(pickup) {
  if (!pickup || pickup.userData.isCollected) return null
  pickup.userData.isCollected = true
  pickup.visible = false
  return pickup.userData.weaponType
}

export function getWeaponDisplayName(type) {
  return WEAPON_CONFIG[type]?.name ?? type
}

export function getWeaponPrice(type) {
  return WEAPON_CONFIG[type]?.price ?? 0
}

export function purchaseWeaponPickup({
  pickup,
  gameState,
  addWeapon,
  ownsWeapon = () => false,
}) {
  if (!pickup) {
    return { success: false, reason: 'unavailable' }
  }

  const type = pickup.userData.weaponType
  const price = getWeaponPrice(type)
  if (ownsWeapon(type)) {
    return { success: false, reason: 'owned', type, price }
  }
  if (!canAfford(gameState, price)) {
    return { success: false, reason: 'insufficient-points', type, price }
  }

  const result = addWeapon(type)
  if (!result?.weapon || !spendPoints(gameState, price)) {
    return { success: false, reason: 'purchase-failed', type, price }
  }

  return { success: true, type, price, ...result }
}

export function getAmmoPurchasePrice(type) {
  if (type === 'pistol' || !WEAPON_CONFIG[type]) return null
  return Math.floor(WEAPON_CONFIG[type].price / 2)
}

export function createShootingSystem(
  camera,
  scene,
  environmentRoot,
  gameState,
  {
    random = Math.random,
    onZombieKilled = () => {},
    onWeaponShot = () => {},
    onReloadStarted = () => {},
  } = {},
) {
  const raycaster = new THREE.Raycaster()
  const effects = createShotEffects(scene)
  const environmentMeshes = collectEnvironmentMeshes(environmentRoot)
  const weaponSlots = [createWeapon('pistol'), null]
  let activeSlotIndex = 0
  let equippedWeapon = weaponSlots[activeSlotIndex]
  let weaponsVisible = true

  function showWeapon(weapon) {
    if (equippedWeapon) {
      camera.remove(equippedWeapon.group)
    }

    equippedWeapon = weapon
    equippedWeapon.group.visible = weaponsVisible
    camera.add(equippedWeapon.group)
    return equippedWeapon
  }

  function switchWeaponSlot(slotIndex) {
    const weapon = weaponSlots[slotIndex]
    if (!weapon || slotIndex === activeSlotIndex) return false

    activeSlotIndex = slotIndex
    showWeapon(weapon)
    return true
  }

  function addWeapon(type) {
    const existingSlot = weaponSlots.findIndex(
      (weapon) => weapon?.type === type,
    )

    if (existingSlot >= 0) {
      switchWeaponSlot(existingSlot)
      return {
        weapon: weaponSlots[existingSlot],
        slotIndex: existingSlot,
        replacedType: null,
        alreadyOwned: true,
      }
    }

    let targetSlot = weaponSlots.findIndex((weapon) => weapon === null)
    if (targetSlot < 0) targetSlot = activeSlotIndex

    const replacedType = weaponSlots[targetSlot]?.type ?? null
    const newWeapon = createWeapon(type)
    weaponSlots[targetSlot] = newWeapon
    activeSlotIndex = targetSlot
    showWeapon(newWeapon)

    return {
      weapon: newWeapon,
      slotIndex: targetSlot,
      replacedType,
      alreadyOwned: false,
    }
  }

  function refillOwnedWeapons() {
    return refillWeapons(weaponSlots, equippedWeapon)
  }

  function getWeapon(type) {
    return weaponSlots.find((weapon) => weapon?.type === type) ?? null
  }

  function getWeaponStationState(type) {
    const weapon = getWeapon(type)
    if (!weapon) return 'available-for-purchase'
    return weapon.ammoInMagazine === 0 && weapon.reserveAmmo === 0
      ? 'ammo-purchase-available'
      : 'owned-ammo-available'
  }

  function purchaseAmmo(type) {
    const weapon = getWeapon(type)
    const price = getAmmoPurchasePrice(type)
    if (!weapon || price === null) {
      return { success: false, reason: 'not-owned', type, price }
    }
    if (weapon.ammoInMagazine > 0 || weapon.reserveAmmo > 0) {
      return { success: false, reason: 'ammo-remaining', type, price }
    }
    if (!canAfford(gameState, price)) {
      return { success: false, reason: 'insufficient-points', type, price }
    }

    // Validation happens before spending, preventing repeated input from
    // deducting points once the first purchase has already restored ammo.
    if (!spendPoints(gameState, price)) {
      return { success: false, reason: 'purchase-failed', type, price }
    }

    weapon.reserveAmmo = weapon.maxReserveAmmo
    weapon.isReloading = false
    weapon.reloadTimer = 0
    weapon.recoilTimer = 0
    resetWeaponTransform(weapon)
    const loadedAmmo = Math.min(weapon.magazineSize, weapon.reserveAmmo)
    weapon.ammoInMagazine = loadedAmmo
    weapon.reserveAmmo -= loadedAmmo
    return { success: true, type, price, loadedAmmo }
  }

  // The pistol starts in slot one and is attached before the first frame.
  camera.add(equippedWeapon.group)

  return {
    addWeapon,
    getWeapon,
    getWeaponStationState,
    purchaseAmmo,
    refillOwnedWeapons,
    switchWeaponSlot,
    hasFreeSlot() {
      return weaponSlots.some((weapon) => weapon === null)
    },
    ownsWeapon(type) {
      return weaponSlots.some((weapon) => weapon?.type === type)
    },
    reload() {
      return startWeaponReload(equippedWeapon, onReloadStarted)
    },
    shoot(zombies, elapsedTime) {
      return shootWeapon({
        weapon: equippedWeapon,
        camera,
        zombies,
        elapsedTime,
        raycaster,
        environmentMeshes,
        effects,
        gameState,
        random,
        onWeaponShot,
        onReloadStarted,
        onZombieKilled,
      })
    },
    update(delta) {
      updateWeaponEffects(equippedWeapon, delta)
      updateShotEffects(effects, delta)
    },
    getEquippedWeapon() {
      return equippedWeapon
    },
    setWeaponVisible(isVisible) {
      weaponsVisible = isVisible
      if (equippedWeapon) {
        equippedWeapon.group.visible = weaponsVisible
      }
    },
    getWeaponSlots() {
      return [...weaponSlots]
    },
    getActiveSlotIndex() {
      return activeSlotIndex
    },
  }
}
