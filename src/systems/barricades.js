import * as THREE from 'three'

import {
  awardPoints,
  setGameMessage,
} from './gameState.js'

const barricadePosition = new THREE.Vector3()

function getMissingPlanks(barricade) {
  return barricade.userData.planks.filter(
    (plank) => plank.parent !== barricade,
  )
}

export function createBarricadeRepairSystem(
  scene,
  {
    repairRange = 2.2,
    repairDuration = 1,
    pointsPerPlank = 10,
  } = {},
) {
  const barricades = []
  let activeBarricade = null
  let repairProgress = 0

  scene.traverse((object) => {
    if (!object.userData.planks) return

    object.userData.maxPlanks = object.userData.planks.length
    barricades.push(object)
  })

  function findNearestDamagedBarricade(player) {
    let nearest = null
    let nearestDistance = repairRange

    barricades.forEach((barricade) => {
      if (getMissingPlanks(barricade).length === 0) return

      barricade.getWorldPosition(barricadePosition)
      const distance = Math.hypot(
        player.position.x - barricadePosition.x,
        player.position.z - barricadePosition.z,
      )

      if (distance <= nearestDistance) {
        nearest = barricade
        nearestDistance = distance
      }
    })

    return nearest
  }

  function repairOnePlank(barricade, gameState) {
    const missingPlanks = getMissingPlanks(barricade)
    if (missingPlanks.length === 0) return false

    // Reattaching one stored mesh preserves its original local transform.
    barricade.add(missingPlanks[0])
    barricade.userData.isBroken = getMissingPlanks(barricade).length > 0
    gameState.repairedBarricades[barricade.name] =
      (gameState.repairedBarricades[barricade.name] ?? 0) + 1
    const awardedPoints = awardPoints(gameState, pointsPerPlank, {
      addToScore: false,
    })
    setGameMessage(gameState, `Plank repaired +${awardedPoints}`)
    return true
  }

  function cancelRepair() {
    activeBarricade = null
    repairProgress = 0
  }

  function update(barricade, isRepairing, delta, gameState) {
    if (!barricade || !isRepairing || getMissingPlanks(barricade).length === 0) {
      cancelRepair()
      return false
    }

    if (activeBarricade !== barricade) {
      activeBarricade = barricade
      repairProgress = 0
    }

    repairProgress = Math.min(repairDuration, repairProgress + delta)
    if (repairProgress < repairDuration) return false

    const repaired = repairOnePlank(activeBarricade, gameState)
    repairProgress = 0
    if (!repaired || getMissingPlanks(activeBarricade).length === 0) {
      activeBarricade = null
    }
    return repaired
  }

  return {
    findNearestDamagedBarricade,
    update,
    cancelRepair,
    repairDuration,
    pointsPerPlank,
    getRepairProgress() {
      return repairDuration > 0 ? repairProgress / repairDuration : 0
    },
    getBarricades() {
      return barricades
    },
  }
}
