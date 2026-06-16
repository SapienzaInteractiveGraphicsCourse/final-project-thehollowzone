import * as THREE from 'three'

export const WEAPON_CONFIG = {
  pistol: {
    name: 'PEW-PEW',
    price: 0,
    damage: 20,
    pelletCount: 1,
    horizontalSpread: 0,
    verticalSpread: 0,
    fireCooldown: 0.35,
    range: 45,
    recoilAmount: 0.09,
    automatic: false,
    magazineSize: 8,
    // Starting reserve is lower than the Max Ammo cap so the pickup has value.
    reserveAmmo: 64,
    maxReserveAmmo: 80,
    reloadDuration: 1.35,
    color: 0x34383d,
    accent: 0x151719,
  },
  shotgun: {
    name: 'Prototype SHELL',
    price: 1500,
    damagePerPellet: 14,
    pelletCount: 8,
    horizontalSpread: 0.105,
    verticalSpread: 0.075,
    fireCooldown: 0.8,
    range: 25,
    recoilAmount: 0.16,
    automatic: false,
    magazineSize: 5,
    reserveAmmo: 30,
    maxReserveAmmo: 50,
    reloadDuration: 2.2,
    color: 0x5b3a24,
    accent: 0x24282c,
  },
  rifle: {
    name: 'AR-7~',
    price: 2000,
    damage: 30,
    pelletCount: 1,
    horizontalSpread: 0,
    verticalSpread: 0,
    fireCooldown: 0.18,
    range: 60,
    recoilAmount: 0.07,
    automatic: true,
    magazineSize: 25,
    reserveAmmo: 150,
    maxReserveAmmo: 250,
    reloadDuration: 1.8,
    color: 0x33433b,
    accent: 0x171d1a,
  },
}

function createWeaponMaterials(config) {
  return {
    body: new THREE.MeshStandardMaterial({
      color: config.color,
      metalness: 0.55,
      roughness: 0.48,
    }),
    accent: new THREE.MeshStandardMaterial({
      color: config.accent,
      metalness: 0.35,
      roughness: 0.7,
    }),
    sight: new THREE.MeshStandardMaterial({
      color: 0xb04a36,
      emissive: 0x3a0904,
      emissiveIntensity: 0.45,
    }),
    flash: new THREE.MeshBasicMaterial({
      color: 0xffb23e,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  }
}

function addWeaponPart(group, name, geometry, material, position) {
  const mesh = new THREE.Mesh(geometry, material)
  mesh.name = name
  mesh.position.set(position.x, position.y, position.z)
  group.add(mesh)
  return mesh
}

export function createWeapon(type = 'pistol') {
  const config = WEAPON_CONFIG[type]
  if (!config) throw new Error(`Unknown weapon type: ${type}`)

  const materials = createWeaponMaterials(config)
  const group = new THREE.Group()
  group.name = `${config.name}WeaponGroup`

  const bodyLength =
    type === 'pistol' ? 0.34 : type === 'shotgun' ? 0.72 : 0.64
  const barrelLength =
    type === 'pistol' ? 0.3 : type === 'shotgun' ? 0.68 : 0.58

  const body = addWeaponPart(
    group,
    `${config.name}Body`,
    new THREE.BoxGeometry(
      type === 'pistol' ? 0.18 : 0.2,
      type === 'pistol' ? 0.16 : 0.15,
      bodyLength,
    ),
    materials.body,
    { x: 0, y: 0, z: -bodyLength / 2 },
  )

  const barrel = addWeaponPart(
    group,
    `${config.name}Barrel`,
    new THREE.CylinderGeometry(
      type === 'shotgun' ? 0.045 : 0.032,
      type === 'shotgun' ? 0.05 : 0.036,
      barrelLength,
      10,
    ),
    materials.accent,
    { x: 0, y: 0.025, z: -bodyLength - barrelLength / 2 + 0.04 },
  )
  barrel.rotation.x = Math.PI / 2

  const handle = addWeaponPart(
    group,
    `${config.name}Handle`,
    new THREE.BoxGeometry(0.13, 0.27, 0.13),
    materials.accent,
    { x: 0, y: -0.18, z: type === 'pistol' ? -0.08 : -0.2 },
  )
  handle.rotation.x = type === 'pistol' ? -0.22 : -0.08

  const trigger = addWeaponPart(
    group,
    `${config.name}Trigger`,
    new THREE.TorusGeometry(0.04, 0.009, 5, 10, Math.PI),
    materials.accent,
    { x: 0, y: -0.1, z: type === 'pistol' ? -0.14 : -0.27 },
  )
  trigger.rotation.y = Math.PI / 2

  const sight = addWeaponPart(
    group,
    `${config.name}Sight`,
    new THREE.BoxGeometry(0.035, 0.045, 0.07),
    materials.sight,
    { x: 0, y: 0.11, z: -bodyLength * 0.48 },
  )

  if (type !== 'pistol') {
    addWeaponPart(
      group,
      `${config.name}Stock`,
      new THREE.BoxGeometry(0.18, 0.17, 0.32),
      materials.accent,
      { x: 0, y: -0.035, z: 0.12 },
    )
  }

  let reloadPart = null

  if (type === 'pistol') {
    reloadPart = addWeaponPart(
      group,
      'PistolMagazine',
      new THREE.BoxGeometry(0.09, 0.2, 0.08),
      materials.body,
      { x: 0, y: -0.22, z: -0.075 },
    )
    reloadPart.rotation.x = -0.22
  }

  if (type === 'shotgun') {
    reloadPart = addWeaponPart(
      group,
      'ShotgunPump',
      new THREE.BoxGeometry(0.19, 0.13, 0.25),
      materials.body,
      { x: 0, y: -0.035, z: -0.56 },
    )
  }

  if (type === 'rifle') {
    reloadPart = addWeaponPart(
      group,
      'RifleMagazine',
      new THREE.BoxGeometry(0.13, 0.25, 0.18),
      materials.accent,
      { x: 0, y: -0.18, z: -0.35 },
    )
    reloadPart.rotation.x = 0.15
  }

  const muzzle = new THREE.Group()
  muzzle.name = `${config.name}Muzzle`
  muzzle.position.set(0, 0.025, -bodyLength - barrelLength + 0.03)

  // The muzzle flash is created once, then shooting only shows it briefly.
  const muzzleFlash = new THREE.Mesh(
    new THREE.ConeGeometry(
      type === 'shotgun' ? 0.13 : 0.09,
      type === 'shotgun' ? 0.32 : 0.24,
      7,
    ),
    materials.flash,
  )
  muzzleFlash.name = `${config.name}MuzzleFlash`
  muzzleFlash.rotation.x = -Math.PI / 2
  muzzleFlash.position.z = -0.13
  muzzleFlash.visible = false
  muzzle.add(muzzleFlash)
  group.add(muzzle)

  group.position.set(0.32, -0.28, -0.58)
  group.rotation.set(-0.04, -0.04, -0.015)

  return {
    group,
    type,
    name: config.name,
    damage: config.damagePerPellet ?? config.damage,
    pelletCount: config.pelletCount,
    horizontalSpread: config.horizontalSpread,
    verticalSpread: config.verticalSpread,
    fireCooldown: config.fireCooldown,
    lastShotTime: -Infinity,
    range: config.range,
    recoilAmount: config.recoilAmount,
    automatic: config.automatic,
    recoilTimer: 0,
    muzzleFlash,
    muzzleFlashTimer: 0,
    magazineSize: config.magazineSize,
    ammoInMagazine: config.magazineSize,
    reserveAmmo: config.reserveAmmo,
    maxReserveAmmo: config.maxReserveAmmo,
    reloadDuration: config.reloadDuration,
    reloadTimer: 0,
    isReloading: false,
    basePosition: group.position.clone(),
    baseRotation: group.rotation.clone(),
    reloadPartBasePosition: reloadPart?.position.clone() ?? null,
    reloadPartBaseRotation: reloadPart?.rotation.clone() ?? null,
    parts: {
      body,
      barrel,
      handle,
      trigger,
      sight,
      muzzle,
      reloadPart,
    },
  }
}

export function createWeaponPickup(type, position) {
  const weapon = createWeapon(type)
  const config = WEAPON_CONFIG[type]
  const pickup = weapon.group
  pickup.name =
    type === 'shotgun' ? 'ShotgunPickup' : 'RiflePickup'
  pickup.position.set(position.x, position.y, position.z)
  pickup.rotation.set(0, Math.PI / 2, 0)
  pickup.scale.setScalar(1.35)
  pickup.userData.weaponType = type
  pickup.userData.price = config.price
  pickup.userData.isWeaponPickup = true

  const marker = new THREE.Mesh(
    new THREE.TorusGeometry(0.38, 0.025, 6, 24),
    new THREE.MeshBasicMaterial({
      color: type === 'shotgun' ? 0xffa33a : 0x67d7a5,
      transparent: true,
      opacity: 0.8,
    }),
  )
  marker.name = `${weapon.name}PickupMarker`
  marker.position.y = -0.34
  marker.rotation.x = Math.PI / 2
  pickup.add(marker)
  pickup.userData.marker = marker

  pickup.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = true
      object.receiveShadow = true
    }
  })

  // Pickups do not need to flash while they are sitting in the arena.
  weapon.muzzleFlash.visible = false
  return pickup
}
