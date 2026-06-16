import * as THREE from 'three'

import { createZombie } from '../objects/Zombie.js'
import { zombieTexturePaths } from '../objects/zombieParts/zombieTexturePaths.js'
import { setZombieAnimationState } from './animation.js'
import { moveBodyWithCollisions } from './collision.js'
import {
  chooseNavigationWaypoint,
  chooseSeparatedSpawnPosition,
  findFirstBlockingBox,
} from './navigation.js'

export const zombieConfig = {
  walkSpeed: 1.2,
  // After five minutes every moving zombie uses this speed and run animation.
  runSpeed: 2.2,
  runStartTime: 300,
  attackDistance: 1.3,
  attackCooldown: 1.7,
  attackDamage: 50,
  turnSpeed: 6,
  maxActiveZombies: 8,
  spawnInterval: 4,
  minimumSpawnInterval: 1.5,
  spawnAccelerationPerMinute: 0.35,
  deathCleanupDelay: 2.5,
  spawnSlotCount: 5,
  spawnSlotSpacing: 0.72,
  spawnDepthSlotCount: 2,
  spawnDepthSlotSpacing: 0.55,
  spawnJitter: 0.1,
  minimumSpawnSeparation: 0.9,
  blockedSpawnRetryDelay: 0.5,
  stuckDetectionDuration: 0.75,
  minimumProgress: 0.025,
  obstacleClearance: 0.45,
  waypointTimeout: 3,
  targetRepathDistance: 0.35,
}

// Weighted type data keeps zombie spawning separate from the procedural model.
export const ZOMBIE_TYPES = Object.freeze({
  basic: Object.freeze({
    id: 'basic',
    weight: 1,
    scale: 0.9,
    healthMultiplier: 1,
    speedMultiplier: 1,
  }),
})

export function getZombieMaxHealth(elapsedTime = 0) {
  const fiveMinuteBlocks = Math.floor(elapsedTime / 300)
  return 100 + fiveMinuteBlocks * 15
}

const moveDirection = new THREE.Vector3()
const targetDirection = new THREE.Vector3()
const barricadePosition = new THREE.Vector3()
const zombieMovement = new THREE.Vector3()

function turnZombieTowards(zombie, direction, delta) {
  // The model faces negative Z, so both direction values are flipped here.
  const targetRotation = Math.atan2(-direction.x, -direction.z)
  const rotationDifference = Math.atan2(
    Math.sin(targetRotation - zombie.group.rotation.y),
    Math.cos(targetRotation - zombie.group.rotation.y),
  )
  const turnAmount = Math.min(1, zombie.behavior.turnSpeed * delta)

  zombie.group.rotation.y += rotationDifference * turnAmount
}

function moveZombieTowards(
  zombie,
  target,
  delta,
  stopDistance = 0,
  collisionBoxes = [],
) {
  targetDirection.set(
    target.x - zombie.group.position.x,
    0,
    target.z - zombie.group.position.z,
  )

  const distance = targetDirection.length()
  if (distance <= stopDistance || distance <= 0.0001) return true

  targetDirection.normalize()
  turnZombieTowards(zombie, targetDirection, delta)

  const movementStep = Math.min(
    (zombie.behavior.currentSpeed ?? zombie.behavior.walkSpeed) * delta,
    distance - stopDistance,
  )
  zombieMovement.copy(targetDirection).multiplyScalar(movementStep)
  moveBodyWithCollisions(
    zombie.collisionBody,
    zombieMovement,
    collisionBoxes,
  )
  zombie.group.position.y = 0

  const remainingX = target.x - zombie.group.position.x
  const remainingZ = target.z - zombie.group.position.z
  return Math.hypot(remainingX, remainingZ) <= stopDistance + 0.001
}

function createNavigationState(position) {
  return {
    waypoint: null,
    waypointQueue: [],
    waypointTimer: 0,
    stuckTimer: 0,
    preferredSide: 0,
    lastPosition: position.clone(),
    routeTarget: null,
  }
}

function navigateZombieTowards(
  zombie,
  target,
  delta,
  collisionBoxes,
) {
  const navigation = zombie.navigation
  const settings = zombie.behavior
  navigation.waypointQueue ??= []

  function applyRoute(route) {
    navigation.waypoint = route?.position ?? null
    navigation.waypointQueue = route?.followUp ? [route.followUp] : []
    navigation.waypointTimer = route ? settings.waypointTimeout : 0
    navigation.routeTarget = route ? target.clone() : null
    if (route) navigation.preferredSide = route.side
  }

  const directBlockingBox = findFirstBlockingBox(
    zombie.group.position,
    target,
    collisionBoxes,
    zombie.collisionBody.radius + 0.05,
  )
  const targetMovedSinceRoute =
    navigation.routeTarget &&
    navigation.routeTarget.distanceToSquared(target) >=
      (settings.targetRepathDistance ??
        zombieConfig.targetRepathDistance) ** 2

  // A route is only a temporary obstacle detour. As soon as the player moves
  // or a direct line opens, replace it using the player's current position.
  if (
    navigation.waypoint &&
    (targetMovedSinceRoute || !directBlockingBox)
  ) {
    const refreshedRoute = directBlockingBox
      ? chooseNavigationWaypoint({
          position: zombie.group.position,
          target,
          body: zombie.collisionBody,
          collisionBoxes,
          clearance: settings.obstacleClearance,
          preferredSide: navigation.preferredSide,
        })
      : null
    applyRoute(refreshedRoute)
  }

  if (navigation.waypoint) {
    navigation.waypointTimer -= delta
    const reachedWaypoint = moveZombieTowards(
      zombie,
      navigation.waypoint,
      delta,
      0.08,
      collisionBoxes,
    )
    if (reachedWaypoint || navigation.waypointTimer <= 0) {
      navigation.waypoint = navigation.waypointQueue.shift() ?? null
      navigation.waypointTimer = navigation.waypoint
        ? settings.waypointTimeout
        : 0
    }
  } else {
    const blockingBox = directBlockingBox
    if (!blockingBox) {
      moveZombieTowards(zombie, target, delta, 0, collisionBoxes)
    } else {
      const route = chooseNavigationWaypoint({
        position: zombie.group.position,
        target,
        body: zombie.collisionBody,
        collisionBoxes,
        clearance: settings.obstacleClearance,
        preferredSide: navigation.preferredSide,
      })
      if (route) {
        applyRoute(route)
      } else {
        moveZombieTowards(zombie, target, delta, 0, collisionBoxes)
      }
    }
  }

  const frameProgress = navigation.lastPosition.distanceTo(
    zombie.group.position,
  )
  navigation.lastPosition.copy(zombie.group.position)
  if (frameProgress < settings.minimumProgress * delta) {
    navigation.stuckTimer += delta
  } else {
    navigation.stuckTimer = 0
  }

  if (navigation.stuckTimer >= settings.stuckDetectionDuration) {
    const route = chooseNavigationWaypoint({
      position: zombie.group.position,
      target,
      body: zombie.collisionBody,
      collisionBoxes,
      clearance: settings.obstacleClearance,
      preferredSide: navigation.preferredSide,
    })
    applyRoute(route)
    if (!route) navigation.preferredSide = -navigation.preferredSide
    navigation.stuckTimer = 0
  }
}

function createBarricadeBehavior(spawnZone, scene) {
  const barricade = scene.getObjectByName(spawnZone.linkedBarricade)
  if (!barricade) return null

  barricade.getWorldPosition(barricadePosition)
  const outsideDirection = new THREE.Vector3(
    spawnZone.position.x - barricadePosition.x,
    0,
    spawnZone.position.z - barricadePosition.z,
  ).normalize()

  return {
    group: barricade,
    planks: barricade.userData.planks ?? [],
    approachPosition: barricadePosition.clone().addScaledVector(
      outsideDirection,
      0.85,
    ),
    insidePosition: barricadePosition.clone().addScaledVector(
      outsideDirection,
      -0.95,
    ),
  }
}

function removeNextBarricadePlank(barricadeBehavior) {
  const nextPlank = barricadeBehavior.planks.find(
    (plank) => plank.parent === barricadeBehavior.group,
  )
  if (!nextPlank) return false

  // Removing the mesh keeps its shared material and texture untouched.
  barricadeBehavior.group.remove(nextPlank)
  return true
}

function hasBarricadePlanks(barricadeBehavior) {
  return barricadeBehavior.planks.some(
    (plank) => plank.parent === barricadeBehavior.group,
  )
}

function enterThroughBrokenBarricade(zombie) {
  zombie.barricade.group.userData.isBroken = true
  zombie.behavior.stage = 'entering-window'
  zombie.behavior.attackCooldownRemaining = 0
  zombie.animationTime = 0
  setZombieMovementAnimation(zombie)
}

export function updateZombieRunState(
  zombie,
  elapsedTime,
  config = zombieConfig,
) {
  if (!zombie?.behavior) return false

  const runStartTime =
    zombie.behavior.runStartTime ?? config.runStartTime
  const isRunning = elapsedTime >= runStartTime

  // Keeping both speeds on the zombie means the five minute change updates
  // zombies that are already alive without rebuilding their behavior data.
  zombie.behavior.isRunning = isRunning
  zombie.behavior.currentSpeed = isRunning
    ? zombie.behavior.runSpeed ?? config.runSpeed
    : zombie.behavior.walkSpeed
  return isRunning
}

function setZombieMovementAnimation(zombie) {
  setZombieAnimationState(
    zombie,
    zombie.behavior.isRunning ? 'running' : 'walking',
  )
}

export function createZombieBehavior(
  config,
  type,
  elapsedTime,
  hasBarricade = false,
) {
  const behavior = {
    walkSpeed: config.walkSpeed * type.speedMultiplier,
    runSpeed: config.runSpeed * type.speedMultiplier,
    runStartTime: config.runStartTime,
    currentSpeed: config.walkSpeed * type.speedMultiplier,
    isRunning: false,
    attackDistance: config.attackDistance,
    attackCooldown: config.attackCooldown,
    attackDamage: config.attackDamage,
    attackCooldownRemaining: 0,
    turnSpeed: config.turnSpeed,
    stuckDetectionDuration: config.stuckDetectionDuration,
    minimumProgress: config.minimumProgress,
    obstacleClearance: config.obstacleClearance,
    waypointTimeout: config.waypointTimeout,
    targetRepathDistance: config.targetRepathDistance,
    stage: hasBarricade ? 'approaching-barricade' : 'chasing-player',
  }

  // New zombies use the current run time immediately instead of walking for
  // one frame and waiting for the normal zombie update to correct their speed.
  updateZombieRunState({ behavior }, elapsedTime, config)
  return behavior
}

export function spawnZombie(
  spawnZone,
  scene,
  config = zombieConfig,
  elapsedTime = 0,
  type = ZOMBIE_TYPES.basic,
  spawnIndex = 0,
  spawnPosition = spawnZone?.position,
) {
  if (!spawnPosition || !scene) return null

  const zombie = createZombie({
    name: `Zombie_${type.id}_${spawnZone.id}_${spawnIndex}`,
    position: spawnPosition,
    scale: type.scale,
    texturePaths: zombieTexturePaths,
  })

  zombie.spawnZoneId = spawnZone.id
  zombie.type = type.id
  zombie.maxHealth =
    getZombieMaxHealth(elapsedTime) * type.healthMultiplier
  zombie.health = zombie.maxHealth
  zombie.deathTimer = 0
  zombie.collisionBody = {
    position: zombie.group.position,
    radius: 0.3,
    height: 1.8,
  }
  zombie.barricade = createBarricadeBehavior(spawnZone, scene)
  zombie.behavior = createZombieBehavior(
    config,
    type,
    elapsedTime,
    Boolean(zombie.barricade),
  )
  zombie.navigation = createNavigationState(zombie.group.position)
  zombie.metadata.isActive = true
  zombie.metadata.canMove = true
  zombie.metadata.canAttack = true
  zombie.metadata.type = type.id

  scene.add(zombie.group)
  return zombie
}

export function createZombieSpawner({
  scene,
  spawnZones = [],
  doors = [],
  rooms = [],
  collisionBoxes = [],
  config = {},
  random = Math.random,
} = {}) {
  const settings = { ...zombieConfig, ...config }
  const activeZombies = []
  const visitedRooms = new Set()
  const zombieTypes = Object.values(ZOMBIE_TYPES)
  let spawnTimer = 0
  let spawnCount = 0

  spawnZones.forEach((zone) => {
    const barricade = scene.getObjectByName(zone.linkedBarricade)
    if (!barricade) return
    barricade.getWorldPosition(barricadePosition)
    const directionX = zone.position.x - barricadePosition.x
    const directionZ = zone.position.z - barricadePosition.z
    const length = Math.hypot(directionX, directionZ) || 1
    zone.exteriorDirection = {
      x: directionX / length,
      z: directionZ / length,
    }
  })

  function chooseZombieType() {
    const totalWeight = zombieTypes.reduce(
      (total, type) => total + type.weight,
      0,
    )
    let roll = random() * totalWeight

    for (const type of zombieTypes) {
      roll -= type.weight
      if (roll <= 0) return type
    }
    return zombieTypes[0]
  }

  function updateSpawnAccess(player) {
    rooms.forEach((room) => {
      const bounds = room.bounds
      if (
        bounds &&
        player.position.x >= bounds.minX &&
        player.position.x <= bounds.maxX &&
        player.position.z >= bounds.minZ &&
        player.position.z <= bounds.maxZ
      ) {
        visitedRooms.add(room.sceneName)
      }
    })

    spawnZones.forEach((zone) => {
      if (!zone.requiredDoorId) {
        zone.isActive = true
        return
      }

      const requiredDoor = doors.find(
        (door) => door.id === zone.requiredDoorId,
      )
      const doorGroup = requiredDoor
        ? scene.getObjectByName(requiredDoor.name)
        : null
      const isDoorOpen =
        doorGroup?.userData.door?.isOpen === true ||
        requiredDoor?.isOpen === true

      if (requiredDoor && isDoorOpen) {
        requiredDoor.isOpen = true
      }
      zone.isActive =
        isDoorOpen &&
        visitedRooms.has(zone.roomTarget)
    })
  }

  function getLivingZombieCount() {
    return activeZombies.filter((zombie) => !zombie.isDead).length
  }

  function spawn(spawnZone, elapsedTime = 0, type = chooseZombieType()) {
    if (getLivingZombieCount() >= settings.maxActiveZombies) return null
    if (!spawnZone?.isActive) return null

    const spawnPosition = chooseSeparatedSpawnPosition({
      spawnZone,
      livingZombies: activeZombies.filter((zombie) => !zombie.isDead),
      minimumSeparation: settings.minimumSpawnSeparation,
      slotCount: settings.spawnSlotCount,
      slotSpacing: settings.spawnSlotSpacing,
      depthCount: settings.spawnDepthSlotCount,
      depthSpacing: settings.spawnDepthSlotSpacing,
      jitter: settings.spawnJitter,
      collisionBoxes,
      random,
    })
    if (!spawnPosition) return null

    spawnCount += 1
    const zombie = spawnZombie(
      spawnZone,
      scene,
      settings,
      elapsedTime,
      type,
      spawnCount,
      spawnPosition,
    )
    if (zombie) activeZombies.push(zombie)
    return zombie
  }

  function spawnFirstActiveZombie(elapsedTime = 0) {
    const firstActiveZone = spawnZones.find((zone) => zone.isActive)
    return firstActiveZone ? spawn(firstActiveZone, elapsedTime) : null
  }

  function update(delta, elapsedTime) {
    for (let index = activeZombies.length - 1; index >= 0; index -= 1) {
      const zombie = activeZombies[index]
      if (!zombie.isDead) continue

      zombie.deathTimer += delta
      if (zombie.deathTimer >= settings.deathCleanupDelay) {
        scene.remove(zombie.group)
        activeZombies.splice(index, 1)
      }
    }

    const availableZones = spawnZones.filter((zone) => zone.isActive)
    if (
      availableZones.length === 0 ||
      getLivingZombieCount() >= settings.maxActiveZombies
    ) {
      return null
    }

    spawnTimer -= delta
    if (spawnTimer > 0) return null

    const zone =
      availableZones[Math.floor(random() * availableZones.length)]
    const zombie = spawn(zone, elapsedTime)
    if (!zombie) {
      spawnTimer = settings.blockedSpawnRetryDelay
      return null
    }
    const elapsedMinutes = elapsedTime / 60
    spawnTimer = Math.max(
      settings.minimumSpawnInterval,
      settings.spawnInterval -
        elapsedMinutes * settings.spawnAccelerationPerMinute,
    )
    return zombie
  }

  return {
    config: settings,
    collisionBoxes,
    spawn,
    spawnFirstActiveZombie,
    update,
    updateSpawnAccess,
    getAvailableSpawnZones() {
      return spawnZones.filter((zone) => zone.isActive)
    },
    getActiveZombies() {
      return activeZombies
    },
  }
}

export function updateZombies(
  zombies,
  player,
  delta,
  collisionBoxes = [],
  openDoors = [],
  damagePlayer = () => false,
  elapsedTime = 0,
) {
  if (!player || player.isDead) return

  const openDoorNames = new Set(
    openDoors.filter((door) => door.isOpen).map((door) => door.name),
  )
  const solidCollisionBoxes = collisionBoxes.filter((box) => {
    if (openDoorNames.has(box.name)) return false
    return !box.name.endsWith('BarricadeCollision')
  })

  zombies.forEach((zombie) => {
    if (!zombie?.group || zombie.isDead) {
      if (zombie?.isDead) setZombieAnimationState(zombie, 'dead')
      return
    }

    // The run timer is the one source for this difficulty change. main.js only
    // calls this update during active gameplay, so pausing cannot advance it.
    updateZombieRunState(zombie, elapsedTime)

    if (
      zombie.barricade &&
      (
        zombie.behavior.stage === 'approaching-barricade' ||
        zombie.behavior.stage === 'breaking-barricade'
      ) &&
      !hasBarricadePlanks(zombie.barricade)
    ) {
      enterThroughBrokenBarricade(zombie)
      return
    }

    // The short hit reaction gets to finish before chasing starts again.
    if (zombie.animationState === 'hit') return

    if (zombie.behavior.stage === 'approaching-barricade') {
      const reachedBarricade = moveZombieTowards(
        zombie,
        zombie.barricade.approachPosition,
        delta,
        0.08,
        solidCollisionBoxes,
      )
      setZombieMovementAnimation(zombie)

      if (reachedBarricade) {
        if (hasBarricadePlanks(zombie.barricade)) {
          zombie.behavior.stage = 'breaking-barricade'
          zombie.behavior.attackCooldownRemaining =
            zombie.behavior.attackCooldown
          setZombieAnimationState(zombie, 'attacking')
        } else {
          enterThroughBrokenBarricade(zombie)
        }
      }
      return
    }

    if (zombie.behavior.stage === 'breaking-barricade') {
      moveDirection.set(
        zombie.barricade.group.position.x - zombie.group.position.x,
        0,
        zombie.barricade.group.position.z - zombie.group.position.z,
      )
      if (moveDirection.lengthSq() > 0.0001) {
        moveDirection.normalize()
        turnZombieTowards(zombie, moveDirection, delta)
      }

      setZombieAnimationState(zombie, 'attacking')
      zombie.behavior.attackCooldownRemaining -= delta

      if (zombie.behavior.attackCooldownRemaining <= 0) {
        // One full attack removes one board instead of deleting them together.
        const removedPlank = removeNextBarricadePlank(zombie.barricade)
        zombie.animationTime = 0
        if (!removedPlank || !hasBarricadePlanks(zombie.barricade)) {
          enterThroughBrokenBarricade(zombie)
        } else {
          zombie.behavior.attackCooldownRemaining =
            zombie.behavior.attackCooldown
        }
      }
      return
    }

    if (zombie.behavior.stage === 'entering-window') {
      const enteredRoom = moveZombieTowards(
        zombie,
        zombie.barricade.insidePosition,
        delta,
        0.05,
      )
      setZombieMovementAnimation(zombie)

      if (enteredRoom) {
        zombie.behavior.stage = 'chasing-player'
      }
      return
    }

    moveDirection.set(
      player.position.x - zombie.group.position.x,
      0,
      player.position.z - zombie.group.position.z,
    )

    const distanceToPlayer = moveDirection.length()
    if (distanceToPlayer > 0.0001) {
      moveDirection.normalize()
      turnZombieTowards(zombie, moveDirection, delta)
    }

    zombie.behavior.attackCooldownRemaining = Math.max(
      0,
      zombie.behavior.attackCooldownRemaining - delta,
    )

    if (distanceToPlayer > zombie.behavior.attackDistance) {
      navigateZombieTowards(
        zombie,
        player.position,
        delta,
        solidCollisionBoxes,
      )
      zombie.group.position.y = 0
      setZombieMovementAnimation(zombie)
      return
    }

    // Close zombies stop moving and use the manual attack animation.
    setZombieAnimationState(zombie, 'attacking')

    if (zombie.behavior.attackCooldownRemaining <= 0) {
      zombie.animationTime = 0
      zombie.behavior.attackCooldownRemaining =
        zombie.behavior.attackCooldown

      damagePlayer(zombie.behavior.attackDamage, zombie)
    }
  })
}

export function getActiveZombies(spawner) {
  return spawner?.getActiveZombies() ?? []
}
