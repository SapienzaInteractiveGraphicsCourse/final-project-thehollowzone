import { POWER_UP_CONFIG } from '../config/powerUps.js'

export function createGameState() {
  return {
    status: 'menu',
    points: 500,
    score: 0,
    elapsedTime: 0,
    doorsOpened: {},
    repairedBarricades: {},
    message: '',
    messageTimer: 0,
    messageVariant: 'default',
    doublePointsDuration: POWER_UP_CONFIG.doublePointsDuration,
    doublePointsRemaining: 0,
  }
}

export function formatElapsedTime(elapsedTime) {
  const totalSeconds = Math.max(0, Math.floor(elapsedTime))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function addPoints(gameState, amount) {
  gameState.points += Math.max(0, amount)
}

export function addScore(gameState, amount) {
  gameState.score += Math.max(0, amount)
}

export function getRewardAmount(
  gameState,
  amount,
  affectedByDoublePoints = true,
) {
  const multiplier =
    affectedByDoublePoints && gameState.doublePointsRemaining > 0 ? 2 : 1
  return Math.max(0, amount) * multiplier
}

export function awardPoints(
  gameState,
  amount,
  {
    addToScore = true,
    affectedByDoublePoints = true,
  } = {},
) {
  // Costs never pass through this API, so Double Points can only increase
  // earned rewards and cannot accidentally reduce purchase prices.
  const awardedAmount = getRewardAmount(
    gameState,
    amount,
    affectedByDoublePoints,
  )

  addPoints(gameState, awardedAmount)
  if (addToScore) addScore(gameState, awardedAmount)
  return awardedAmount
}

export function activateDoublePoints(
  gameState,
  duration = POWER_UP_CONFIG.doublePointsDuration,
) {
  gameState.doublePointsDuration = Math.max(0, duration)
  // A second pickup refreshes the effect instead of stacking beyond 2x.
  gameState.doublePointsRemaining = gameState.doublePointsDuration
  return gameState.doublePointsRemaining
}

export function deactivateDoublePoints(gameState) {
  gameState.doublePointsRemaining = 0
}

export function canAfford(gameState, cost) {
  return gameState.points >= cost
}

export function spendPoints(gameState, amount) {
  if (!canAfford(gameState, amount)) return false
  gameState.points -= amount
  return true
}

export function setGameMessage(
  gameState,
  text,
  duration = 1.8,
  variant = 'default',
) {
  gameState.message = text
  gameState.messageTimer = duration
  gameState.messageVariant = variant
}

export function updateGameState(gameState, delta) {
  if (gameState.status === 'playing') {
    gameState.elapsedTime += delta
    gameState.doublePointsRemaining = Math.max(
      0,
      gameState.doublePointsRemaining - delta,
    )
  } else if (
    gameState.status === 'gameover' ||
    gameState.status === 'won'
  ) {
    deactivateDoublePoints(gameState)
  }

  gameState.messageTimer = Math.max(0, gameState.messageTimer - delta)
  if (gameState.messageTimer === 0) {
    gameState.message = ''
    gameState.messageVariant = 'default'
  }
}
