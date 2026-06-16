import * as THREE from 'three'

import { canOccupyPosition } from './collision.js'

// Reusing this object avoids allocating a new vector for every route check.
const candidatePosition = { x: 0, y: 0, z: 0 }

function getInflatedBounds(box, padding) {
  // the real box is expanded by the zombie radius and extra clearance. This
  // makes the route account for the zombie's body instead of treating it as a point.
  return {
    minX: box.position.x - box.size.x / 2 - padding,
    maxX: box.position.x + box.size.x / 2 + padding,
    minZ: box.position.z - box.size.z / 2 - padding,
    maxZ: box.position.z + box.size.z / 2 + padding,
  }
}

export function segmentIntersectsBox(start, end, box, padding = 0) {
  const bounds = getInflatedBounds(box, padding)
  const directionX = end.x - start.x
  const directionZ = end.z - start.z

  // These values describe the part of the line from start to end that is still
  // inside both the X and Z ranges. 0 is the start and 1 is the end.
  let minimumTime = 0
  let maximumTime = 1

  // The same line check is applied once for X and once for Z. If their valid
  // time ranges never overlap, the movement line does not cross the box.
  for (const [startValue, direction, minimum, maximum] of [
    [start.x, directionX, bounds.minX, bounds.maxX],
    [start.z, directionZ, bounds.minZ, bounds.maxZ],
  ]) {
    // A nearly zero direction means the line is parallel on this axis. It can
    // only touch the box if its starting coordinate is already inside the range.
    if (Math.abs(direction) < 0.00001) {
      if (startValue < minimum || startValue > maximum) return false
      continue
    }

    const firstTime = (minimum - startValue) / direction
    const secondTime = (maximum - startValue) / direction

    // min and max are used because a negative direction reaches the far side
    // of the box before the near side.
    minimumTime = Math.max(minimumTime, Math.min(firstTime, secondTime))
    maximumTime = Math.min(maximumTime, Math.max(firstTime, secondTime))
    if (minimumTime > maximumTime) return false
  }

  return maximumTime >= 0 && minimumTime <= 1
}

export function findFirstBlockingBox(
  start,
  target,
  collisionBoxes,
  padding,
) {
  let nearestBox = null
  let nearestDistance = Infinity

  // More than one wall or prop can cross the direct route. Navigation should
  // solve the closest obstruction first instead of choosing one behind it.
  collisionBoxes.forEach((box) => {
    if (!segmentIntersectsBox(start, target, box, padding)) return
    const distance = Math.hypot(
      box.position.x - start.x,
      box.position.z - start.z,
    )
    if (distance < nearestDistance) {
      nearestDistance = distance
      nearestBox = box
    }
  })

  return nearestBox
}

export function chooseNavigationWaypoint({
  position,
  target,
  body,
  collisionBoxes,
  clearance = 0.45,
  preferredSide = 0,
}) {
  // A direct path needs no waypoint, so null tells the zombie to keep chasing
  // the target normally.
  const blockingBox = findFirstBlockingBox(
    position,
    target,
    collisionBoxes,
    body.radius + 0.05,
  )
  if (!blockingBox) return null

  const bounds = getInflatedBounds(
    blockingBox,
    body.radius + clearance,
  )
  const targetDirectionX = target.x - position.x
  const targetDirectionZ = target.z - position.z

  // The four candidate points are the padded corners around the obstacle.
  const candidates = [
    { x: bounds.minX, z: bounds.minZ },
    { x: bounds.minX, z: bounds.maxZ },
    { x: bounds.maxX, z: bounds.minZ },
    { x: bounds.maxX, z: bounds.maxZ },
  ]

  // Each route contains an entry corner and an exit corner. Trying both
  // directions around every edge lets the shortest valid side win.
  const routes = [
    [candidates[0], candidates[2]],
    [candidates[2], candidates[0]],
    [candidates[1], candidates[3]],
    [candidates[3], candidates[1]],
    [candidates[0], candidates[1]],
    [candidates[1], candidates[0]],
    [candidates[2], candidates[3]],
    [candidates[3], candidates[2]],
  ]
  let best = null
  let bestScore = Infinity

  routes.forEach(([entry, exit]) => {
    // Both corners must have enough room for the zombie body. This rejects
    // routes that would place a waypoint inside another wall or prop.
    candidatePosition.x = entry.x
    candidatePosition.y = position.y
    candidatePosition.z = entry.z
    if (!canOccupyPosition(candidatePosition, body, collisionBoxes)) return
    candidatePosition.x = exit.x
    candidatePosition.z = exit.z
    if (!canOccupyPosition(candidatePosition, body, collisionBoxes)) return

    const padding = body.radius + 0.05
    // The route must reach its first corner and leave its second corner without
    // cutting through the obstacle it is supposed to avoid.
    if (segmentIntersectsBox(position, entry, blockingBox, padding)) return
    if (segmentIntersectsBox(exit, target, blockingBox, padding)) return

    // The 2D cross product labels which side of the direct target line this
    // route uses. Remembering the side reduces left-right route switching.
    const side = Math.sign(
      targetDirectionX * (entry.z - position.z) -
        targetDirectionZ * (entry.x - position.x),
    )
    // Scoring uses the complete three-part route, not only the first waypoint.
    const pathDistance =
      Math.hypot(entry.x - position.x, entry.z - position.z) +
      Math.hypot(exit.x - entry.x, exit.z - entry.z) +
      Math.hypot(target.x - exit.x, target.z - exit.z)
    const sidePenalty =
      preferredSide !== 0 && side !== preferredSide ? clearance * 2 : 0
    const score = pathDistance + sidePenalty

    if (score < bestScore) {
      bestScore = score
      best = {
        // spawning.js follows position first, then followUp, before chasing
        // the player's live position again.
        position: new THREE.Vector3(entry.x, position.y, entry.z),
        followUp: new THREE.Vector3(exit.x, position.y, exit.z),
        side: side || preferredSide || 1,
        obstacleName: blockingBox.name,
      }
    }
  })

  return best
}

export function createSpawnSlots(
  spawnZone,
  {
    slotCount = 5,
    slotSpacing = 0.72,
    depthCount = 1,
    depthSpacing = 0.55,
  } = {},
) {
  // exteriorDirection points away from the barricade. The tangent is a
  // perpendicular direction used to spread zombies across the window width.
  const direction = spawnZone.exteriorDirection ?? { x: 0, z: 1 }
  const tangentX = -direction.z
  const tangentZ = direction.x
  const middle = (slotCount - 1) / 2

  // depthCount creates extra rows behind the first row. Each row receives the
  // same number of evenly spaced lateral slots.
  return Array.from({ length: depthCount }, (_, depthIndex) =>
    Array.from({ length: slotCount }, (_, index) => {
      const lateralOffset = (index - middle) * slotSpacing
      const depthOffset = depthIndex * depthSpacing
      return {
        x:
          spawnZone.position.x +
          tangentX * lateralOffset +
          direction.x * depthOffset,
        y: spawnZone.position.y ?? 0,
        z:
          spawnZone.position.z +
          tangentZ * lateralOffset +
          direction.z * depthOffset,
      }
    }),
  ).flat()
}

export function chooseSeparatedSpawnPosition({
  spawnZone,
  livingZombies,
  minimumSeparation = 0.9,
  slotCount = 5,
  slotSpacing = 0.72,
  depthCount = 1,
  depthSpacing = 0.55,
  jitter = 0.1,
  collisionBoxes = [],
  body = { radius: 0.3, height: 1.8 },
  random = Math.random,
}) {
  const slots = createSpawnSlots(spawnZone, {
    slotCount,
    slotSpacing,
    depthCount,
    depthSpacing,
  })

  // Starting at a random slot stops every spawn zone from always filling from
  // the same side while still checking every slot before giving up.
  const startIndex = Math.floor(random() * slots.length)

  for (let offset = 0; offset < slots.length; offset += 1) {
    const slot = slots[(startIndex + offset) % slots.length]
    // A slot is occupied when another living zombie is closer than the
    // configured separation distance.
    const isOccupied = livingZombies.some((zombie) => {
      const position = zombie.group?.position ?? zombie.position
      return (
        position &&
        Math.hypot(position.x - slot.x, position.z - slot.z) <
          minimumSeparation
      )
    })
    if (isOccupied) continue

    // This first check rejects slots already inside walls before random
    // variation is added.
    if (!canOccupyPosition(slot, body, collisionBoxes)) continue

    const direction = spawnZone.exteriorDirection ?? { x: 0, z: 1 }
    const tangentX = -direction.z
    const tangentZ = direction.x
    const tangentJitter = (random() * 2 - 1) * jitter
    const depthJitter = (random() * 2 - 1) * jitter * 0.5

    // Small sideways and depth offsets stop zombies from appearing on a
    // perfectly visible grid. Depth jitter is smaller to keep them near the zone.
    const position = {
      x: slot.x + tangentX * tangentJitter + direction.x * depthJitter,
      y: slot.y,
      z: slot.z + tangentZ * tangentJitter + direction.z * depthJitter,
    }

    // Jitter can move a valid slot into nearby geometry, so the final position
    // is checked again before it is returned.
    if (!canOccupyPosition(position, body, collisionBoxes)) continue
    return position
  }

  // Returning null tells the spawner to wait and retry instead of stacking
  // another zombie into an occupied or blocked location.
  return null
}
