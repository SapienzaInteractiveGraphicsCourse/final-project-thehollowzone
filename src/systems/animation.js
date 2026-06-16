const ZOMBIE_ANIMATION_STATES = new Set([
  'idle',
  'walking',
  'running',
  'attacking',
  'hit',
  'dead',
])

function addRotation(part, x = 0, y = 0, z = 0) {
  if (!part) return
  part.rotation.x += x
  part.rotation.y += y
  part.rotation.z += z
}

function addPosition(part, x = 0, y = 0, z = 0) {
  if (!part) return
  part.position.x += x
  part.position.y += y
  part.position.z += z
}

function curlHand(parts, side, amount) {
  addRotation(parts[`${side}FingerA`], amount)
  addRotation(parts[`${side}FingerB`], amount * 1.08)
  addRotation(parts[`${side}FingerC`], amount * 0.95)
  addRotation(parts[`${side}Thumb`], amount * 0.35)
}

// Resetting first stops one state from stacking its rotations on another state.
export function resetZombiePose(zombie) {
  if (!zombie?.basePose) return

  Object.values(zombie.basePose).forEach(({ part, position, rotation }) => {
    part.position.copy(position)
    part.rotation.copy(rotation)
  })
}

export function animateZombieIdle(zombie, elapsedTime) {
  const { parts } = zombie
  const breath = Math.sin(elapsedTime * 1.8)
  const slowSway = Math.sin(elapsedTime * 0.9)
  const headTwitch = Math.sin(elapsedTime * 0.75 + 0.7)
  const jawChatter = Math.max(0, Math.sin(elapsedTime * 3.2))

  // The small vertical movement and chest tilt make the zombie look like it is breathing.
  addPosition(parts.body, 0, breath * 0.012, 0)
  addRotation(parts.torso, breath * 0.012, 0, slowSway * 0.018)
  addRotation(parts.head, breath * 0.01, headTwitch * 0.025, headTwitch * 0.02)
  addRotation(parts.jaw, jawChatter * 0.04)
  addRotation(parts.leftArm, breath * 0.025, 0, slowSway * 0.012)
  addRotation(parts.rightArm, -breath * 0.03, 0, -slowSway * 0.012)
}

function animateZombieMovement(zombie, elapsedTime, running = false) {
  const { parts } = zombie
  const speed = running ? 8.5 : 5.2
  const strength = running ? 0.68 : 0.42
  const cycle = Math.sin(elapsedTime * speed)
  const oppositeCycle = Math.sin(elapsedTime * speed + Math.PI)
  const stepBounce = Math.abs(Math.sin(elapsedTime * speed))

  // Arms and legs use opposite sine waves so the walk reads clearly in place.
  addRotation(parts.leftArm, oppositeCycle * strength - 0.12)
  addRotation(parts.rightArm, cycle * strength - 0.2)
  addRotation(parts.leftLeg, cycle * strength)
  addRotation(parts.rightLeg, oppositeCycle * strength)

  addRotation(parts.leftElbow, running ? 0.32 : 0.16)
  addRotation(parts.rightElbow, running ? 0.4 : 0.24)
  addRotation(parts.leftHand, -oppositeCycle * (running ? 0.16 : 0.08), 0, cycle * 0.04)
  addRotation(parts.rightHand, -cycle * (running ? 0.16 : 0.08), 0, -cycle * 0.04)
  curlHand(parts, 'left', running ? 0.18 : 0.08)
  curlHand(parts, 'right', running ? 0.18 : 0.08)
  addRotation(parts.leftKnee, Math.max(0, -cycle) * (running ? 0.42 : 0.25))
  addRotation(parts.rightKnee, Math.max(0, cycle) * (running ? 0.42 : 0.25))

  addPosition(parts.body, 0, stepBounce * (running ? 0.035 : 0.022), 0)
  addRotation(parts.torso, running ? -0.1 : -0.045, 0, cycle * 0.025)
  addRotation(parts.head, stepBounce * 0.018, cycle * 0.025, -cycle * 0.018)
}

export function animateZombieWalk(zombie, elapsedTime) {
  // Movement is handled by the zombie behavior system while this updates the pose.
  animateZombieMovement(zombie, elapsedTime, false)
}

export function animateZombieRun(zombie, elapsedTime) {
  animateZombieMovement(zombie, elapsedTime, true)
}

export function animateZombieAttack(zombie) {
  const { parts } = zombie
  const attackDuration = 1.70
  const cycleTime = zombie.animationTime % attackDuration
  let windUp = 0
  let strike = 0
  let recovery = 0

  if (cycleTime < 0.42) {
    windUp = cycleTime / 0.42
  } else if (cycleTime < 0.62) {
    windUp = 1
    strike = (cycleTime - 0.42) / 0.2
  } else {
    recovery = (cycleTime - 0.62) / (attackDuration - 0.62)
  }

  // Smooth values stop the arm from snapping between the three attack stages.
  windUp = windUp * windUp * (3 - 2 * windUp)
  strike = strike * strike * (3 - 2 * strike)
  recovery = recovery * recovery * (3 - 2 * recovery)

  const raisedAmount = windUp * (1 - strike)
  const hitAmount = strike * (1 - recovery)

  // The right hand lifts first, then the shoulder and torso drive it forward.
  addRotation(parts.rightArm, raisedAmount * 2.25 + hitAmount * 1.18, 0, raisedAmount * 0.38)
  addRotation(parts.rightElbow, raisedAmount * 0.95 - hitAmount * 0.28)
  addRotation(parts.rightHand, -raisedAmount * 0.32 + hitAmount * 0.18, hitAmount * 0.12, raisedAmount * 0.08 + hitAmount * 0.16)
  curlHand(parts, 'right', raisedAmount * 0.35 + hitAmount * 0.95)

  // The other arm stays forward for balance instead of copying the striking arm.
  addRotation(parts.leftArm, 0.35 + hitAmount * 0.28, 0, -0.12)
  addRotation(parts.leftElbow, 0.2)
  addRotation(parts.leftHand, -0.1 + hitAmount * 0.08)
  curlHand(parts, 'left', 0.2 + hitAmount * 0.18)

  addRotation(parts.torso, -raisedAmount * 0.08 - hitAmount * 0.24, -raisedAmount * 0.2 + hitAmount * 0.24, raisedAmount * 0.08)
  addRotation(parts.body, -hitAmount * 0.08)
  addRotation(parts.head, hitAmount * 0.14, -raisedAmount * 0.08, -hitAmount * 0.04)
  addPosition(parts.body, 0, raisedAmount * 0.025, -hitAmount * 0.055)
}

export function animateZombieHit(zombie) {
  const { parts } = zombie
  const duration = 0.6
  const progress = Math.min(zombie.animationTime / duration, 1)
  const impact = Math.sin(progress * Math.PI)
  const shake = Math.sin(progress * Math.PI * 6) * (1 - progress)

  // The reaction is short and returns to idle after the stagger finishes.
  addRotation(parts.body, impact * 0.12, 0, -impact * 0.16)
  addRotation(parts.torso, impact * 0.22, 0, -impact * 0.2 + shake * 0.04)
  addRotation(parts.head, -impact * 0.12, impact * 0.2, impact * 0.18)
  addRotation(parts.leftArm, -impact * 0.3, 0, -impact * 0.15)
  addRotation(parts.rightArm, impact * 0.22, 0, impact * 0.18)

  if (progress >= 1) {
    setZombieAnimationState(zombie, 'idle')
  }
}

export function animateZombieDeath(zombie) {
  const { parts } = zombie
  const duration = 1.25
  const progress = Math.min(zombie.animationTime / duration, 1)
  const easedFall = 1 - Math.pow(1 - progress, 3)

  // The last frame stays in this pose because dead zombies stop updating behavior.
  addPosition(parts.body, 0, -easedFall * 0.72, 0)
  addRotation(parts.body, easedFall * 1.28, 0, easedFall * 0.42)
  addRotation(parts.torso, easedFall * 0.25, 0, -easedFall * 0.18)
  addRotation(parts.head, -easedFall * 0.28, easedFall * 0.18, easedFall * 0.35)
  addRotation(parts.leftArm, -easedFall * 0.48, 0, -easedFall * 0.3)
  addRotation(parts.rightArm, -easedFall * 0.58, 0, easedFall * 0.34)
  addRotation(parts.leftLeg, easedFall * 0.25, 0, -easedFall * 0.16)
  addRotation(parts.rightLeg, -easedFall * 0.2, 0, easedFall * 0.2)
  addRotation(parts.leftKnee, easedFall * 0.45)
  addRotation(parts.rightKnee, easedFall * 0.58)
}

export function setZombieAnimationState(zombie, state) {
  if (!zombie || !ZOMBIE_ANIMATION_STATES.has(state)) return false
  if (zombie.animationState === state && state !== 'hit') return true

  zombie.animationState = state
  zombie.animationTime = 0
  zombie.isDead = state === 'dead'
  return true
}

export function updateZombieAnimation(zombie, delta, elapsedTime) {
  if (!zombie?.parts || !zombie.basePose) return

  zombie.animationTime += delta
  resetZombiePose(zombie)

  switch (zombie.animationState) {
    case 'walking':
      animateZombieWalk(zombie, elapsedTime)
      break
    case 'running':
      animateZombieRun(zombie, elapsedTime)
      break
    case 'attacking':
      animateZombieAttack(zombie)
      break
    case 'hit':
      animateZombieHit(zombie)
      break
    case 'dead':
      animateZombieDeath(zombie)
      break
    case 'idle':
    default:
      animateZombieIdle(zombie, elapsedTime)
      break
  }
}

export function updateWeaponRecoilPlaceholder() {}

function getBlackoutLightIntensity(
  elapsedTime,
  {
    baseIntensity,
    cycleLength,
    timeOffset,
    stableTime,
    warningTime,
    offTime,
    restartTime,
  },
) {
  const cycleTime = (elapsedTime + timeOffset) % cycleLength

  if (cycleTime < stableTime) {
    // A small pulse keeps the powered light from looking perfectly constant.
    return baseIntensity + Math.sin(elapsedTime * 8.5) * 1.2
  }

  if (cycleTime < stableTime + warningTime) {
    // Fast flashes warn that the room is about to lose power.
    const warningProgress = (cycleTime - stableTime) / warningTime
    const warningFlash = Math.sin(warningProgress * Math.PI * 12) > 0
    return warningFlash ? baseIntensity * (1 - warningProgress * 0.55) : 0
  }

  if (cycleTime < stableTime + warningTime + offTime) {
    // Holding at zero creates the longer delay before the light comes back.
    return 0
  }

  if (cycleTime < stableTime + warningTime + offTime + restartTime) {
    const restartProgress =
      (cycleTime - stableTime - warningTime - offTime) / restartTime
    const restartFlash = Math.sin(restartProgress * Math.PI * 9) > 0
    return restartFlash ? baseIntensity * restartProgress : 0
  }

  return baseIntensity
}

export function updateLightingEffects(elapsedTime, lights) {
  lights.firstRoomPointLight.intensity = getBlackoutLightIntensity(
    elapsedTime,
    {
      baseIntensity: 18,
      cycleLength: 11,
      timeOffset: 0,
      stableTime: 6,
      warningTime: 0.7,
      offTime: 2.3,
      restartTime: 1,
    },
  )

  lights.fourthRoomPointLight.intensity = getBlackoutLightIntensity(
    elapsedTime,
    {
      baseIntensity: 19,
      cycleLength: 13,
      timeOffset: 3.5,
      stableTime: 7.2,
      warningTime: 0.8,
      offTime: 2.6,
      restartTime: 1.1,
    },
  )
}
