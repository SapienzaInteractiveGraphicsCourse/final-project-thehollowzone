import * as THREE from 'three'

export const PLAYER_START_POSITION = new THREE.Vector3(-16, 0, 10)
export const PLAYER_HEALTH_CONFIG = Object.freeze({
  maxHealth: 200,
  regenerationDelay: 5,
  regenerationRate: 10,
})

export function createPlayer(healthConfig = {}) {
  const resolvedHealthConfig = {
    ...PLAYER_HEALTH_CONFIG,
    ...healthConfig,
  }

  return {
    position: PLAYER_START_POSITION.clone(),
    velocity: new THREE.Vector3(),
    movementDirection: new THREE.Vector3(),
    walkSpeed: 4,
    runSpeed: 7,
    currentSpeed: 4,
    height: 1.7,
    // The camera uses this height for the first-person viewpoint.
    eyeHeight: 1.7,
    radius: 0.35,
    movementState: {
      isMoving: false,
      isRunning: false,
    },
    health: resolvedHealthConfig.maxHealth,
    maxHealth: resolvedHealthConfig.maxHealth,
    isDead: false,
    healthConfig: resolvedHealthConfig,
  }
}

export function createPlayerHealthSystem(
  player,
  {
    onDeath = () => {},
    onDamage = () => {},
  } = {},
) {
  const listeners = new Set()
  let timeSinceDamage = Infinity
  let deathTriggered = false

  function notify() {
    listeners.forEach((listener) => {
      listener(player.health, player.maxHealth, player.isDead)
    })
  }

  function takeDamage(amount) {
    if (player.isDead || amount <= 0) return false

    player.health = Math.max(0, player.health - amount)
    timeSinceDamage = 0
    // Only valid damage triggers the red feedback flash.
    onDamage(amount, player.health)

    if (player.health === 0) {
      player.isDead = true
      notify()
      if (!deathTriggered) {
        deathTriggered = true
        onDeath()
      }
      return true
    }

    notify()
    return true
  }

  function heal(amount) {
    if (player.isDead || amount <= 0 || player.health >= player.maxHealth) {
      return false
    }

    player.health = Math.min(player.maxHealth, player.health + amount)
    notify()
    return true
  }

  function update(delta, isGameActive) {
    if (!isGameActive || player.isDead || player.health >= player.maxHealth) {
      return
    }

    timeSinceDamage += delta
    if (timeSinceDamage < player.healthConfig.regenerationDelay) return

    heal(player.healthConfig.regenerationRate * delta)
  }

  function reset() {
    player.health = player.maxHealth
    player.isDead = false
    timeSinceDamage = Infinity
    deathTriggered = false
    notify()
  }

  return {
    takeDamage,
    heal,
    update,
    reset,
    subscribe(listener) {
      listeners.add(listener)
      listener(player.health, player.maxHealth, player.isDead)
      return () => listeners.delete(listener)
    },
    getTimeSinceDamage() {
      return timeSinceDamage
    },
  }
}

// Keep the first-person camera aligned with the player's current position.
export function syncCameraToPlayer(camera, player) {
  camera.position.set(
    player.position.x,
    player.position.y + player.eyeHeight,
    player.position.z,
  )
}
