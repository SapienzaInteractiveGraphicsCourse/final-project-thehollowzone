const nextPosition = {
  x: 0,
  y: 0,
  z: 0,
}

function rangesOverlap(firstMin, firstMax, secondMin, secondMax) {
  return firstMax > secondMin && firstMin < secondMax
}

export function bodyIntersectsBox(position, body, box) {
  const bodyBottom = position.y
  const bodyTop = position.y + body.height
  const boxBottom = box.position.y - box.size.y / 2
  const boxTop = box.position.y + box.size.y / 2

  // Ignore geometry above or below the player's standing body.
  if (!rangesOverlap(bodyBottom, bodyTop, boxBottom, boxTop)) {
    return false
  }

  const boxMinX = box.position.x - box.size.x / 2
  const boxMaxX = box.position.x + box.size.x / 2
  const boxMinZ = box.position.z - box.size.z / 2
  const boxMaxZ = box.position.z + box.size.z / 2

  // Find the nearest point on the box to the player's circular footprint.
  const closestX = Math.max(boxMinX, Math.min(position.x, boxMaxX))
  const closestZ = Math.max(boxMinZ, Math.min(position.z, boxMaxZ))
  const distanceX = position.x - closestX
  const distanceZ = position.z - closestZ

  return distanceX * distanceX + distanceZ * distanceZ < body.radius * body.radius
}

export function canOccupyPosition(position, body, collisionBoxes) {
  return !collisionBoxes.some((box) =>
    bodyIntersectsBox(position, body, box),
  )
}

export function moveBodyWithCollisions(
  body,
  movement,
  collisionBoxes,
) {
  nextPosition.x = body.position.x
  nextPosition.y = body.position.y
  nextPosition.z = body.position.z

  nextPosition.x += movement.x
  if (!canOccupyPosition(nextPosition, body, collisionBoxes)) {
    nextPosition.x = body.position.x
  }

  nextPosition.z += movement.z
  if (!canOccupyPosition(nextPosition, body, collisionBoxes)) {
    nextPosition.z = body.position.z
  }

  body.position.set(nextPosition.x, nextPosition.y, nextPosition.z)
}

// Resolve one horizontal axis at a time. If X is blocked but Z is clear (or the
// reverse), the accepted axis still moves and creates simple wall sliding.
export function movePlayerWithCollisions(
  player,
  movement,
  collisionBoxes,
) {
  moveBodyWithCollisions(player, movement, collisionBoxes)
}
