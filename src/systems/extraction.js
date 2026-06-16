import { canAfford, spendPoints } from './gameState.js'

export function isPlayerNearExtraction(
  player,
  marker,
  interactionRange = 1.8,
) {
  if (!player || !marker) return false

  const deltaX = player.position.x - marker.position.x
  const deltaZ = player.position.z - marker.position.z
  return deltaX * deltaX + deltaZ * deltaZ <= interactionRange ** 2
}

export function purchaseExtraction(gameState, objective) {
  const cost = objective.requiredPointsToWin

  // The completed flag makes the objective idempotent even if multiple
  // interaction checks happen before the victory screen finishes opening.
  if (objective.isCompleted || gameState.status === 'won') {
    return { success: false, reason: 'completed', cost }
  }
  if (!canAfford(gameState, cost)) {
    return { success: false, reason: 'insufficient-points', cost }
  }
  if (!spendPoints(gameState, cost)) {
    return { success: false, reason: 'purchase-failed', cost }
  }

  objective.isCompleted = true
  gameState.status = 'won'
  return { success: true, cost }
}
