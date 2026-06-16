import * as THREE from 'three'

import {
  canAfford,
  setGameMessage,
  spendPoints,
} from './gameState.js'

const doorPosition = new THREE.Vector3()

export function createDoorSystem({
  scene,
  doors,
  collisionBoxes,
  gameState,
  interactionRange = 2.2,
}) {
  const doorStates = doors.map((door) => {
    const group = scene.getObjectByName(door.name)
    const panel = group?.getObjectByName(`${door.name}Panel`)

    return {
      data: door,
      group,
      panel,
      opening: false,
      openProgress: 0,
      closedY: group?.position.y ?? 0,
      openY: (group?.position.y ?? 0) - 3.2,
    }
  })
  let activeCollisionBoxes = [...collisionBoxes]

  function refreshCollisionBoxes() {
    const openDoorNames = new Set(
      doorStates
        .filter((door) => door.data.isOpen)
        .map((door) => door.data.name),
    )
    activeCollisionBoxes = collisionBoxes.filter(
      (box) => !openDoorNames.has(box.name),
    )
  }

  function findNearbyLockedDoor(player) {
    let nearestDoor = null
    let nearestDistance = interactionRange

    doorStates.forEach((door) => {
      if (door.data.isOpen || !door.panel) return

      door.panel.getWorldPosition(doorPosition)
      const distance = Math.hypot(
        player.position.x - doorPosition.x,
        player.position.z - doorPosition.z,
      )

      if (distance <= nearestDistance) {
        nearestDoor = door
        nearestDistance = distance
      }
    })

    return nearestDoor
  }

  function buyDoor(door) {
    if (!door || door.data.isOpen) return false

    if (!canAfford(gameState, door.data.requiredPoints)) {
      setGameMessage(gameState, 'Not enough points')
      return false
    }

    spendPoints(gameState, door.data.requiredPoints)
    door.data.isOpen = true
    door.opening = true
    door.openProgress = 0
    gameState.doorsOpened[door.data.id] = true

    if (door.group?.userData.door) {
      door.group.userData.door.isOpen = true
    }

    // Opened doors should not block the player or zombies anymore.
    refreshCollisionBoxes()
    setGameMessage(gameState, `${door.data.leadsToRoom} unlocked`)
    return true
  }

  function update(delta) {
    doorStates.forEach((door) => {
      if (!door.opening || !door.group) return

      door.openProgress = Math.min(
        1,
        door.openProgress + delta * 1.25,
      )
      const eased =
        door.openProgress *
        door.openProgress *
        (3 - 2 * door.openProgress)

      // Sliding the door down makes it feel like it is leaving the map.
      door.group.position.y = THREE.MathUtils.lerp(
        door.closedY,
        door.openY,
        eased,
      )

      if (door.openProgress === 1) {
        door.opening = false
        door.group.visible = false
      }
    })
  }

  refreshCollisionBoxes()

  return {
    buyDoor,
    findNearbyLockedDoor,
    update,
    getCollisionBoxes() {
      return activeCollisionBoxes
    },
  }
}
