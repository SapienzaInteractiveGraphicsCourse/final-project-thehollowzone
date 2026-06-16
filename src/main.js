import * as THREE from 'three'
import './style.css'
import {
  createPlayer,
  createPlayerHealthSystem,
  syncCameraToPlayer,
} from './objects/Player.js'
import { createScene } from './scene/createScene.js'
import {
  createFirstPersonControls,
  createOrbitControls,
} from './scene/controls.js'
import {
  updateLightingEffects,
  updateZombieAnimation,
} from './systems/animation.js'
import { movePlayerWithCollisions } from './systems/collision.js'
import { createInputController } from './systems/input.js'
import {
  createZombieSpawner,
  updateZombies,
} from './systems/spawning.js'
import { createBarricadeRepairSystem } from './systems/barricades.js'
import {
  createShootingSystem,
  findNearbyWeaponPickup,
  getAmmoPurchasePrice,
  getWeaponDisplayName,
  getWeaponPrice,
  purchaseWeaponPickup,
  updateWeaponPickups,
  updateZombieHitFeedback,
} from './systems/shooting.js'
import {
  addPoints,
  activateDoublePoints,
  createGameState,
  deactivateDoublePoints,
  formatElapsedTime,
  getRewardAmount,
  setGameMessage,
  updateGameState,
} from './systems/gameState.js'
import {
  isPlayerNearExtraction,
  purchaseExtraction,
} from './systems/extraction.js'
import { createPowerUpSystem } from './systems/powerUps.js'
import { createDoorSystem } from './systems/doors.js'
import { createGameAudioSystem } from './systems/audio.js'
import {
  clearDamageFeedback,
  createDamageFeedback,
  createHUD,
  hideInteractionPrompt,
  showDamageFeedback,
  showInteractionPrompt,
  updateHealthHUD,
  updateHUD,
} from './systems/ui.js'

const {
  scene,
  camera,
  lights,
  arena,
  weaponPickups,
  maxAmmoPickups,
} = createScene()
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance',
})
const clock = new THREE.Clock()
const player = createPlayer()
const input = createInputController()
const gameState = createGameState()
const gameAudio = createGameAudioSystem()
const powerUpSystem = createPowerUpSystem({
  scene,
  permanentPickups: maxAmmoPickups,
})
const shootingSystem = createShootingSystem(
  camera,
  scene,
  arena,
  gameState,
  {
    onWeaponShot: gameAudio.playWeaponShot,
    onReloadStarted: gameAudio.playWeaponReload,
    onZombieKilled(zombie) {
      // Death audio and power-up drops share the guarded kill event, so both
      // happen exactly once even when several shotgun pellets land together.
      gameAudio.playZombieDeath()
      powerUpSystem.handleZombieKilled(zombie)
    },
  },
)
const zombieSpawner = createZombieSpawner({
  scene,
  spawnZones: arena.userData.zombieSpawnZones,
  doors: arena.userData.doors,
  rooms: arena.userData.rooms,
  collisionBoxes: arena.userData.collisionBoxes,
})
const barricadeRepairSystem = createBarricadeRepairSystem(scene)
const doorSystem = createDoorSystem({
  scene,
  doors: arena.userData.doors,
  collisionBoxes: arena.userData.collisionBoxes,
  gameState,
})

const activeZombies = zombieSpawner.getActiveZombies()
const extractionMarker = arena.getObjectByName('EndGameMarker')
const extractionObjective = extractionMarker?.userData.endGame
let currentElapsedTime = 0

const MAX_PIXEL_RATIO = Math.min(window.devicePixelRatio, 1.5)
const MIN_PIXEL_RATIO = Math.min(window.devicePixelRatio, 0.75)
let renderPixelRatio = MAX_PIXEL_RATIO
let performanceSampleTime = 0
let performanceSampleFrames = 0

renderer.setPixelRatio(renderPixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
document.querySelector('#app').appendChild(renderer.domElement)

const crosshair = document.createElement('div')
crosshair.className = 'crosshair'
crosshair.setAttribute('aria-hidden', 'true')
document.querySelector('#app').appendChild(crosshair)

const gameHud = createHUD()
const damageFeedback = createDamageFeedback()
const playerHealthSystem = createPlayerHealthSystem(player, {
  onDeath: handlePlayerDeath,
  onDamage: () => showDamageFeedback(damageFeedback),
})
playerHealthSystem.subscribe((health, maxHealth, isDead) => {
  updateHealthHUD(gameHud, health, maxHealth, isDead)
})

const ammoHud = document.createElement('section')
ammoHud.className = 'ammo-hud'
ammoHud.setAttribute('aria-label', 'Current weapon ammunition')
ammoHud.innerHTML = `
  <div class="ammo-hud__topline">
    <span class="ammo-hud__weapon">PEW-PEW</span>
    <span class="ammo-hud__key">R // RELOAD</span>
  </div>
  <div class="ammo-hud__counter">
    <strong class="ammo-hud__loaded">8</strong>
    <span class="ammo-hud__divider">/</span>
    <span class="ammo-hud__magazine">8</span>
  </div>
  <div class="ammo-hud__reserve">
    RESERVE <strong>64</strong>
  </div>
  <div class="ammo-hud__status">WEAPON READY</div>
`
document.querySelector('#app').appendChild(ammoHud)

const ammoHudWeapon = ammoHud.querySelector('.ammo-hud__weapon')
const ammoHudLoaded = ammoHud.querySelector('.ammo-hud__loaded')
const ammoHudMagazine = ammoHud.querySelector('.ammo-hud__magazine')
const ammoHudReserve = ammoHud.querySelector('.ammo-hud__reserve strong')
const ammoHudStatus = ammoHud.querySelector('.ammo-hud__status')

syncCameraToPlayer(camera, player)
// Face the locked door into the Second Room when the game first loads.
camera.lookAt(-11, player.eyeHeight, 10)

const controls = createFirstPersonControls(camera, renderer)
// OrbitControls are created once but stay disabled until debug view is enabled.
const orbitControls = createOrbitControls(camera, renderer, false)
let isDebugView = false
let isPrimaryFireHeld = false
let flashlightWasVisible = true
let hasStartedRun = false
const savedPlayerView = new THREE.Quaternion()

// The flashlight and its target are camera children, so the beam automatically follows first-person mouse look without position calculations each frame.


const flashlight = lights.playerFlashlightPlaceholder
scene.add(camera)
camera.add(flashlight)
camera.add(flashlight.target)
flashlight.position.set(0, -0.12, 0)
flashlight.target.position.set(0, -0.08, -1)

const instructions = document.createElement('div')
instructions.className = 'control-instructions'
document.querySelector('#app').appendChild(instructions)

function showMainMenu() {
  const playLabel = hasStartedRun ? 'Continue run' : 'Enter facility'
  const restartButton = hasStartedRun
    ? `
      <button class="menu-button main-menu-restart" data-menu-action="restart" type="button">
        Restart run
      </button>
    `
    : ''
  instructions.innerHTML = `
    <div class="menu-backdrop-details" aria-hidden="true"></div>
    <section class="control-panel control-panel--player">
      <div class="control-panel__topline">
        <span class="mode-badge">Main menu</span>
        <span class="menu-readout">Facility access // Ready</span>
      </div>

      <header class="menu-hero">
        <p class="menu-hero__eyebrow">Survival protocol</p>
        <h1 class="control-panel__title">Dead Circuit</h1>
        <p class="control-panel__subtitle">
          Enter the facility, survive the outbreak, and earn enough points
          to reach extraction.
        </p>
      </header>

      <div class="mission-strip">
        <span>
          <small>Objective</small>
          <strong>Reach extraction</strong>
        </span>
        <span>
          <small>Extraction cost</small>
          <strong>${extractionObjective.requiredPointsToWin} points</strong>
        </span>
        <span>
          <small>Threat</small>
          <strong>Escalating</strong>
        </span>
      </div>

      <div class="control-section-heading">
        <span>Field controls</span>
        <small>Everything needed to survive</small>
      </div>

      <div class="control-grid">
        <div class="control-card">
          <div class="control-card__keys wasd-keys" aria-label="W A S D keys">
            <kbd class="keycap">W</kbd>
            <kbd class="keycap">A</kbd>
            <kbd class="keycap">S</kbd>
            <kbd class="keycap">D</kbd>
          </div>
          <div class="control-card__copy">
            <strong>Movement</strong>
            <span>Navigate the arena</span>
          </div>
        </div>

        <div class="control-card">
          <div class="control-card__keys">
            <kbd class="keycap keycap--wide">Mouse</kbd>
          </div>
          <div class="control-card__copy">
            <strong>Look around</strong>
            <span>Left click to fire</span>
          </div>
        </div>

        <div class="control-card">
          <div class="control-card__keys">
            <kbd class="keycap keycap--wide">Shift</kbd>
          </div>
          <div class="control-card__copy">
            <strong>Sprint</strong>
            <span>Move at full speed</span>
          </div>
        </div>

        <div class="control-card">
          <div class="control-card__keys">
            <kbd class="keycap">E</kbd>
          </div>
          <div class="control-card__copy">
            <strong>Interact</strong>
            <span>Doors, repairs, and pickups</span>
          </div>
        </div>
      </div>

      <button class="enter-button" type="button">
        <span>${playLabel}</span>
        <span class="enter-button__hint">Click to deploy</span>
      </button>
      ${restartButton}

      <div class="control-panel__footer">
        <span>F flashlight</span>
        <span class="footer-divider"></span>
        <span>R reload</span>
        <span class="footer-divider"></span>
        <span>1 / 2 weapons</span>
        <span class="footer-divider"></span>
        <span>O developer view</span>
      </div>
    </section>
  `
}

function showPauseMenu() {
  const equippedWeapon = shootingSystem.getEquippedWeapon()

  instructions.innerHTML = `
    <div class="menu-backdrop-details" aria-hidden="true"></div>
    <section class="control-panel pause-panel">
      <div class="control-panel__topline">
        <span class="mode-badge">Run paused</span>
        <span class="menu-readout">${formatElapsedTime(gameState.elapsedTime)}</span>
      </div>

      <header>
        <p class="menu-hero__eyebrow">Facility link suspended</p>
        <h2 class="pause-panel__title">Stay Focused</h2>
        <p class="control-panel__subtitle">
          The outbreak is waiting. Continue the run when you are ready.
        </p>
      </header>

      <div class="pause-readouts">
        <span>
          <small>Points</small>
          <strong>${gameState.points}</strong>
        </span>
        <span>
          <small>Current weapon</small>
          <strong>${equippedWeapon?.name ?? 'Unarmed'}</strong>
        </span>
        <span>
          <small>Run time</small>
          <strong>${formatElapsedTime(gameState.elapsedTime)}</strong>
        </span>
      </div>

      <div class="menu-actions">
        <button class="menu-button menu-button--primary" data-menu-action="resume" type="button">
          <span>Resume run</span>
          <small>Return to the facility</small>
        </button>
        <button class="menu-button" data-menu-action="restart" type="button">
          <span>Restart run</span>
          <small>Begin again from 0:00</small>
        </button>
        <button class="menu-button" data-menu-action="main-menu" type="button">
          <span>Main menu</span>
          <small>Leave the current run paused</small>
        </button>
      </div>

      <div class="control-panel__footer">
        <span>Esc pauses the run</span>
        <span class="footer-divider"></span>
        <span>Progress is kept until restart</span>
      </div>
    </section>
  `
}

function showGameOver() {
  instructions.innerHTML = `
    <div class="menu-backdrop-details" aria-hidden="true"></div>
    <section class="control-panel pause-panel">
      <div class="control-panel__topline">
        <span class="mode-badge">Run terminated</span>
        <span class="menu-readout">${formatElapsedTime(gameState.elapsedTime)}</span>
      </div>
      <header>
        <h2 class="pause-panel__title">Operator Down</h2>
        <p class="control-panel__subtitle">
          The facility has been overrun. Restart to begin a new run at 0:00.
        </p>
      </header>
      <div class="menu-actions">
        <button class="menu-button menu-button--primary" data-menu-action="restart" type="button">
          Restart run
        </button>
      </div>
    </section>
  `
}

function showVictory() {
  instructions.innerHTML = `
    <div class="menu-backdrop-details" aria-hidden="true"></div>
    <section class="control-panel pause-panel victory-panel">
      <div class="control-panel__topline">
        <span class="mode-badge mode-badge--victory">Extraction complete</span>
        <span class="menu-readout">${formatElapsedTime(gameState.elapsedTime)}</span>
      </div>
      <header>
        <p class="victory-panel__eyebrow">Facility cleared</p>
        <h2 class="pause-panel__title">You Beat The Game</h2>
        <p class="control-panel__subtitle">
          Good job, soldier. You reached the extraction room and secured
          evacuation with ${extractionObjective.requiredPointsToWin} points.
        </p>
      </header>
      <div class="victory-panel__summary">
        <span>Final score</span>
        <strong>${gameState.score}</strong>
      </div>
      <div class="menu-actions">
        <button class="menu-button menu-button--primary" data-menu-action="restart" type="button">
          Restart run
        </button>
        <button class="menu-button" data-menu-action="victory-main-menu" type="button">
          Main menu
        </button>
      </div>
    </section>
  `
}

function handlePlayerDeath() {
  // The health system guards this callback so the death sound only starts
  // once, even if several zombies attack during the player's final frame.
  gameAudio.playPlayerDeath()
  gameState.status = 'gameover'
  isPrimaryFireHeld = false
  shootingSystem.setWeaponVisible(false)
  clearDamageFeedback(damageFeedback)
  deactivateDoublePoints(gameState)
  barricadeRepairSystem.cancelRepair()
  input.reset()
  player.velocity.set(0, 0, 0)
  player.movementState.isMoving = false
  player.movementState.isRunning = false

  if (controls.isLocked) {
    controls.unlock()
  } else {
    showGameOver()
    instructions.classList.remove('is-hidden')
  }
}

function showDebugInstructions() {
  instructions.innerHTML = `
    <section class="debug-panel">
      <div class="debug-panel__heading">
        <span class="mode-badge mode-badge--debug">
          Developer view
        </span>
        <span class="debug-panel__index">Arena inspection</span>
      </div>

      <div class="debug-panel__intro">
        <div>
          <h2>Arena Overview</h2>
          <p>The run is paused while the free camera is active.</p>
        </div>
        <div class="debug-panel__readouts">
          <span class="debug-panel__status">Tools active</span>
          <span class="debug-panel__points">
            Points <strong data-debug-points>${gameState.points}</strong>
          </span>
        </div>
      </div>

      <div class="debug-panel__controls">
        <div class="debug-control">
          <i class="debug-control__icon">M1</i>
          <span>
            <strong>Orbit camera</strong>
            <small>Drag to inspect the entire map</small>
          </span>
        </div>
        <div class="debug-control">
          <i class="debug-control__icon">Q</i>
          <span>
            <strong>Add 500 points</strong>
            <small>Prepare purchases for a demonstration</small>
          </span>
        </div>
        <div class="debug-control">
          <i class="debug-control__icon">SC</i>
          <span>
            <strong>Camera distance</strong>
            <small>Scroll to move closer or farther away</small>
          </span>
        </div>
        <div class="debug-control debug-control--return">
          <i class="debug-control__icon">O</i>
          <span>
            <strong>Close developer view</strong>
            <small>Return to the paused run menu</small>
          </span>
        </div>
      </div>
    </section>
  `
}

showMainMenu()

function requestPointerLock() {
  if (!isDebugView && !controls.isLocked) {
    controls.lock()
  }
}

renderer.domElement.addEventListener('click', requestPointerLock)
instructions.addEventListener('click', (event) => {
  const action = event.target.closest('[data-menu-action]')?.dataset.menuAction

  if (action === 'restart') {
    window.location.reload()
    return
  }

  if (action === 'victory-main-menu') {
    // Reloading is the existing full-run cleanup path. The fresh page opens
    // on the main menu without carrying completed objective or weapon state.
    window.location.reload()
    return
  }

  if (action === 'main-menu') {
    clearDamageFeedback(damageFeedback)
    gameState.status = 'menu'
    showMainMenu()
    return
  }

  if (
    action === 'resume' ||
    event.target.closest('.enter-button')
  ) {
    requestPointerLock()
  }
})

controls.addEventListener('lock', () => {
  if (player.isDead || gameState.status === 'won') {
    controls.unlock()
    return
  }
  hasStartedRun = true
  gameState.status = 'playing'
  shootingSystem.setWeaponVisible(true)
  instructions.classList.add('is-hidden')
  crosshair.classList.add('is-visible')
  ammoHud.classList.add('is-visible')
  gameHud.root.classList.add('is-visible')
})

controls.addEventListener('unlock', () => {
  isPrimaryFireHeld = false
  instructions.classList.remove('is-hidden')
  crosshair.classList.remove('is-visible')
  ammoHud.classList.remove('is-visible')
  gameHud.root.classList.remove('is-visible')
  hideInteractionPrompt(gameHud)
  if (!isDebugView) {
    if (gameState.status === 'won') {
      showVictory()
    } else if (player.isDead || gameState.status === 'gameover') {
      gameState.status = 'gameover'
      showGameOver()
    } else {
      gameState.status = hasStartedRun ? 'paused' : 'menu'
    }
    if (gameState.status === 'paused') {
      showPauseMenu()
    } else if (gameState.status === 'menu') {
      showMainMenu()
    }
  }
  input.reset()
  player.velocity.set(0, 0, 0)
  player.movementState.isMoving = false
  player.movementState.isRunning = false
})

// Reused vectors avoid allocating new objects during every animation frame.
const cameraForward = new THREE.Vector3()
const cameraRight = new THREE.Vector3()
const frameMovement = new THREE.Vector3()

renderer.domElement.addEventListener('mousedown', (event) => {
  if (
    event.button !== 0 ||
    !controls.isLocked ||
    isDebugView ||
    player.isDead ||
    gameState.status !== 'playing'
  ) {
    return
  }

  isPrimaryFireHeld =
    shootingSystem.getEquippedWeapon()?.automatic === true
  shootingSystem.shoot(activeZombies, currentElapsedTime)
})

window.addEventListener('mouseup', (event) => {
  if (event.button === 0) {
    isPrimaryFireHeld = false
  }
})

window.addEventListener('blur', () => {
  isPrimaryFireHeld = false
})

function updateAdaptiveResolution(delta) {
  if (delta > 0.25) {
    performanceSampleTime = 0
    performanceSampleFrames = 0
    return
  }

  performanceSampleTime += delta
  performanceSampleFrames += 1

  if (performanceSampleTime < 1) return

  const averageFps = performanceSampleFrames / performanceSampleTime
  let nextPixelRatio = renderPixelRatio

  if (averageFps < 54) {
    nextPixelRatio = Math.max(MIN_PIXEL_RATIO, renderPixelRatio - 0.15)
  } else if (averageFps > 59) {
    nextPixelRatio = Math.min(MAX_PIXEL_RATIO, renderPixelRatio + 0.1)
  }

  if (Math.abs(nextPixelRatio - renderPixelRatio) > 0.001) {
    renderPixelRatio = nextPixelRatio
    renderer.setPixelRatio(renderPixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight, false)
  }

  performanceSampleTime = 0
  performanceSampleFrames = 0
}

function enterDebugView() {
  isDebugView = true
  isPrimaryFireHeld = false
  gameState.status = 'paused'
  savedPlayerView.copy(camera.quaternion)
  flashlightWasVisible = flashlight.visible

  if (controls.isLocked) {
    controls.unlock()
  }

  controls.enabled = false
  orbitControls.enabled = true
  flashlight.visible = false
  // Keep the owned weapon intact while removing it from the overhead camera.
  // It becomes visible again only when gameplay is actually resumed.
  shootingSystem.setWeaponVisible(false)
  input.reset()
  player.velocity.set(0, 0, 0)

  // Reset to the original overhead inspection position for the full arena.
  camera.position.set(2, 48, 48)
  orbitControls.target.set(2, 0, -5)
  orbitControls.update()

  showDebugInstructions()
  instructions.classList.add('is-debug')
  instructions.classList.remove('is-hidden')
}

function exitDebugView() {
  isDebugView = false
  orbitControls.enabled = false
  controls.enabled = true

  syncCameraToPlayer(camera, player)
  camera.quaternion.copy(savedPlayerView)
  flashlight.visible = flashlightWasVisible

  instructions.classList.remove('is-debug')
  gameState.status = 'paused'
  showPauseMenu()
  instructions.classList.remove('is-hidden')
}

function updateControlMode() {
  if (!input.consumePress('debugView')) return

  if (isDebugView) {
    exitDebugView()
  } else {
    enterDebugView()
  }
}

function updateDeveloperPoints() {
  if (!isDebugView || !input.consumePress('developerPoints')) return

  // This bypasses score and Double Points on purpose: it is a presentation
  // shortcut for reaching purchases, not a gameplay reward.
  addPoints(gameState, 500)
  setGameMessage(gameState, 'DEV POINTS +500')
  const debugPoints = instructions.querySelector('[data-debug-points]')
  if (debugPoints) {
    debugPoints.textContent = gameState.points
  }
}

function updatePlayer(delta) {
  if (isDebugView || !controls.isLocked || player.isDead) return

  if (input.consumePress('flashlight')) {
    flashlight.visible = !flashlight.visible
  }

  const forwardInput =
    Number(input.keys.forward) - Number(input.keys.backward)
  const rightInput =
    Number(input.keys.right) - Number(input.keys.left)

  camera.getWorldDirection(cameraForward)
  cameraForward.y = 0
  cameraForward.normalize()

  // Forward crossed with world-up produces the camera's horizontal right axis.
  cameraRight.crossVectors(cameraForward, camera.up).normalize()

  player.movementDirection
    .set(0, 0, 0)
    .addScaledVector(cameraForward, forwardInput)
    .addScaledVector(cameraRight, rightInput)

  player.movementState.isMoving =
  player.movementDirection.lengthSq() > 0
  player.movementState.isRunning =
  player.movementState.isMoving && input.keys.run
  player.currentSpeed = player.movementState.isRunning
    ? player.runSpeed
    : player.walkSpeed

  if (player.movementState.isMoving) {
    // Normalization prevents diagonal WASD movement from being faster.
    player.movementDirection.normalize()
    player.velocity
      .copy(player.movementDirection)
      .multiplyScalar(player.currentSpeed)
  } else {
    player.velocity.set(0, 0, 0)
  }

  frameMovement.copy(player.velocity).multiplyScalar(delta)
  movePlayerWithCollisions(
    player,
    frameMovement,
    doorSystem.getCollisionBoxes(),
  )
  syncCameraToPlayer(camera, player)
}

function updateInteraction(delta) {
  if (isDebugView || !controls.isLocked || player.isDead) {
    barricadeRepairSystem.cancelRepair()
    hideInteractionPrompt(gameHud)
    return
  }

  // One interaction prompt keeps the screen clear. Progression and repairs
  // keep priority, followed by temporary supplies and weapon purchases.
  const nearbyExtraction =
    extractionObjective &&
    !extractionObjective.isCompleted &&
    isPlayerNearExtraction(player, extractionMarker)
  const nearbyDoor = nearbyExtraction
    ? null
    : doorSystem.findNearbyLockedDoor(player)
  const nearbyBarricade =
    nearbyExtraction || nearbyDoor
      ? null
      : barricadeRepairSystem.findNearestDamagedBarricade(player)
  const nearbyPowerUp =
    nearbyExtraction || nearbyDoor || nearbyBarricade
      ? null
      : powerUpSystem.findNearby(player)
  const nearbyPickup =
    nearbyExtraction || nearbyDoor || nearbyBarricade || nearbyPowerUp
      ? null
      : findNearbyWeaponPickup(player, weaponPickups)

  if (nearbyExtraction) {
    const extractionCost = extractionObjective.requiredPointsToWin
    showInteractionPrompt(
      gameHud,
      gameState.points >= extractionCost
        ? `Press E to extract - ${extractionCost} points`
        : `Extraction requires ${extractionCost} points - ${extractionCost - gameState.points} more needed`,
    )
  } else if (nearbyDoor) {
    showInteractionPrompt(
      gameHud,
      `Press E to open ${nearbyDoor.data.leadsToRoom} - ${nearbyDoor.data.requiredPoints} points`,
    )
  } else if (nearbyBarricade) {
    const progress = Math.round(
      barricadeRepairSystem.getRepairProgress() * 100,
    )
    showInteractionPrompt(
      gameHud,
      input.keys.interact
        ? `Repairing plank... ${progress}%`
        : `Hold E to repair one plank - +${getRewardAmount(gameState, barricadeRepairSystem.pointsPerPlank)} points`,
    )
  } else if (nearbyPowerUp) {
    const powerUpType =
      nearbyPowerUp.userData.powerUpPickup.type
    showInteractionPrompt(
      gameHud,
      powerUpType === 'max-ammo'
        ? 'Press E to collect MAX AMMO'
        : 'Press E to collect DOUBLE POINTS',
    )
  } else if (nearbyPickup) {
    const pickupType = nearbyPickup.userData.weaponType
    const price = getWeaponPrice(pickupType)
    const stationState =
      shootingSystem.getWeaponStationState(pickupType)
    const ammoPrice = getAmmoPurchasePrice(pickupType)
    const willReplaceWeapon =
      !shootingSystem.hasFreeSlot() &&
      !shootingSystem.ownsWeapon(pickupType)
    showInteractionPrompt(
      gameHud,
      stationState === 'ammo-purchase-available'
        ? `Press E to buy ${pickupType === 'shotgun' ? 'Shotgun' : 'Rifle'} Ammo - ${ammoPrice} points`
        : stationState === 'owned-ammo-available'
          ? `${getWeaponDisplayName(pickupType)} ammo available when completely empty`
        : willReplaceWeapon
          ? `Press E to buy ${getWeaponDisplayName(pickupType)} for ${price} points and replace current weapon`
          : `Press E to buy ${getWeaponDisplayName(pickupType)} - ${price} points`,
    )
  } else {
    hideInteractionPrompt(gameHud)
  }

  barricadeRepairSystem.update(
    nearbyBarricade,
    Boolean(nearbyBarricade && input.keys.interact),
    delta,
    gameState,
  )

  if (!input.consumePress('interact')) return

  if (nearbyExtraction) {
    const extraction = purchaseExtraction(
      gameState,
      extractionObjective,
    )
    if (extraction.success) {
      // The sound starts from the successful purchase event before pointer lock
      // is released and the victory menu replaces the gameplay interface.
      gameAudio.playVictory()
      handleVictory()
    } else if (extraction.reason === 'insufficient-points') {
      setGameMessage(gameState, 'Not enough points to extract')
    }
    return
  }

  if (nearbyDoor) {
    // buyDoor returns true only after the points are paid and the door starts
    // opening, so failed purchases never play the opening sound.
    if (doorSystem.buyDoor(nearbyDoor)) {
      gameAudio.playDoorOpen()
    }
    return
  }

  if (nearbyBarricade) return

  if (nearbyPowerUp) {
    const collectedType = powerUpSystem.collect(nearbyPowerUp)
    // collect returns null when the pickup was already used. Playing after
    // this check keeps every Max Ammo or Double Points sound to one use.
    if (collectedType) {
      gameAudio.playPowerUp(collectedType)
    }
    if (collectedType === 'max-ammo') {
      const refillResult = shootingSystem.refillOwnedWeapons()
      setGameMessage(
        gameState,
        refillResult.equippedWeaponReloaded
          ? 'MAX AMMO\nALL WEAPONS REFILLED // WEAPON LOADED'
          : 'MAX AMMO\nALL WEAPONS REFILLED',
        3,
        'max-ammo',
      )
      updateAmmoHud()
    } else if (collectedType === 'double-points') {
      activateDoublePoints(
        gameState,
        powerUpSystem.config.doublePointsDuration,
      )
      setGameMessage(
        gameState,
        'DOUBLE POINTS\n2X SCORE FOR 30 SECONDS',
        3,
        'double-points',
      )
    }
    return
  }

  if (nearbyPickup) {
    const pickupType = nearbyPickup.userData.weaponType
    if (
      shootingSystem.getWeaponStationState(pickupType) ===
      'ammo-purchase-available'
    ) {
      const ammoPurchase = shootingSystem.purchaseAmmo(pickupType)
      if (ammoPurchase.success) {
        setGameMessage(
          gameState,
          `${pickupType === 'shotgun' ? 'Shotgun' : 'Rifle'} ammo purchased for ${ammoPurchase.price}`,
        )
        updateAmmoHud()
      } else if (ammoPurchase.reason === 'insufficient-points') {
        setGameMessage(gameState, 'Not enough points')
      }
      return
    }

    const purchase = purchaseWeaponPickup({
      pickup: nearbyPickup,
      gameState,
      addWeapon: shootingSystem.addWeapon,
      ownsWeapon: shootingSystem.ownsWeapon,
    })
    if (purchase.success) {
      setGameMessage(
        gameState,
        purchase.replacedType
          ? `${getWeaponDisplayName(purchase.replacedType)} replaced by ${purchase.weapon.name}`
          : `${purchase.weapon.name} purchased for ${purchase.price}`,
      )
    } else if (purchase.reason === 'insufficient-points') {
      setGameMessage(gameState, 'Not enough points')
    } else if (purchase.reason === 'owned') {
      setGameMessage(gameState, 'Weapon already owned')
    }
  }
}

function updateWeaponSwitching() {
  if (
    isDebugView ||
    !controls.isLocked ||
    player.isDead ||
    gameState.status !== 'playing'
  ) return

  if (input.consumePress('weaponSlot1')) {
    isPrimaryFireHeld = false
    shootingSystem.switchWeaponSlot(0)
  }
  if (input.consumePress('weaponSlot2')) {
    isPrimaryFireHeld = false
    shootingSystem.switchWeaponSlot(1)
  }
}

function updateWeaponReload() {
  if (
    isDebugView ||
    !controls.isLocked ||
    player.isDead ||
    gameState.status !== 'playing'
  ) return
  if (input.consumePress('reload')) {
    shootingSystem.reload()
  }
}

function updateAmmoHud() {
  const weapon = shootingSystem.getEquippedWeapon()
  if (!weapon) return

  ammoHudWeapon.textContent = weapon.name
  ammoHudLoaded.textContent = weapon.ammoInMagazine
  ammoHudMagazine.textContent = weapon.magazineSize
  ammoHudReserve.textContent = weapon.reserveAmmo
  ammoHudStatus.textContent = weapon.isReloading
    ? 'RELOADING...'
    : weapon.reserveAmmo === 0 && weapon.ammoInMagazine === 0
      ? 'NO AMMO'
      : 'WEAPON READY'
  ammoHud.classList.toggle('is-reloading', weapon.isReloading)
}

function updateAutomaticFire() {
  const weapon = shootingSystem.getEquippedWeapon()
  if (
    !isPrimaryFireHeld ||
    !weapon?.automatic ||
    isDebugView ||
    !controls.isLocked ||
    player.isDead ||
    gameState.status !== 'playing'
  ) {
    return
  }

  // shoot() owns cooldown, ammunition, reload, recoil, hit, and sound rules.
  // Calling it every frame only asks the rifle to fire when its rate permits.
  shootingSystem.shoot(activeZombies, currentElapsedTime)
}

function handleVictory() {
  isPrimaryFireHeld = false
  deactivateDoublePoints(gameState)
  barricadeRepairSystem.cancelRepair()
  shootingSystem.setWeaponVisible(false)
  clearDamageFeedback(damageFeedback)
  input.reset()
  player.velocity.set(0, 0, 0)
  player.movementState.isMoving = false
  player.movementState.isRunning = false

  if (controls.isLocked) {
    controls.unlock()
  } else {
    showVictory()
    instructions.classList.remove('is-hidden')
  }
}

function animate() {
  requestAnimationFrame(animate)

  // Capping delta avoids a large movement jump after switching browser tabs.
  const rawDelta = clock.getDelta()
  const delta = Math.min(rawDelta, 0.05)
  updateGameState(gameState, delta)
  updateControlMode()
  updateDeveloperPoints()
  updatePlayer(delta)
  updateInteraction(delta)
  updateWeaponSwitching()
  updateWeaponReload()
  updateAutomaticFire()
  const isGameActive =
    gameState.status === 'playing' &&
    controls.isLocked &&
    !isDebugView

  playerHealthSystem.update(delta, isGameActive)

  if (isGameActive) {
    doorSystem.update(delta)
    zombieSpawner.updateSpawnAccess(player)
    zombieSpawner.update(delta, gameState.elapsedTime)
    updateZombies(
      activeZombies,
      player,
      delta,
      doorSystem.getCollisionBoxes(),
      arena.userData.doors,
      (damage) => playerHealthSystem.takeDamage(damage),
      gameState.elapsedTime,
    )
  }
  updateAdaptiveResolution(rawDelta)
  if (isDebugView) {
    orbitControls.update()
  }
  currentElapsedTime = gameState.elapsedTime
  updateLightingEffects(clock.elapsedTime, lights)
  if (isGameActive) {
    shootingSystem.update(delta)
  }
  updateAmmoHud()
  updateHUD(
    gameHud,
    gameState,
    shootingSystem.getEquippedWeapon(),
    shootingSystem.getWeaponSlots(),
    shootingSystem.getActiveSlotIndex(),
  )
  if (isGameActive) {
    updateWeaponPickups(
      weaponPickups,
      currentElapsedTime,
      delta,
      shootingSystem.getWeaponStationState,
    )
    powerUpSystem.update(delta, currentElapsedTime, isGameActive)
    updateZombieHitFeedback(activeZombies, delta)
    activeZombies.forEach((zombie) => {
      updateZombieAnimation(zombie, delta, currentElapsedTime)
    })
  } else {
    powerUpSystem.update(delta, currentElapsedTime, false)
  }
  renderer.render(scene, camera)
}

animate()

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()

  renderer.setPixelRatio(renderPixelRatio)
  renderer.setSize(window.innerWidth, window.innerHeight)
})
