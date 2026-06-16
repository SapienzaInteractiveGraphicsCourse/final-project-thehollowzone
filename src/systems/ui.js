import { formatElapsedTime } from './gameState.js'

// This function builds the gameplay HUD once when the page starts. The game
// loop updates the existing elements later instead of rebuilding this HTML
// every frame, which keeps the interface responsive and avoids extra DOM work.
export function createHUD(parent = document.querySelector('#app')) {
  const hud = document.createElement('section')
  hud.className = 'game-hud'
  hud.setAttribute('aria-label', 'Game status')

  // These elements are referenced by style.css and updated by the game loop.
  hud.innerHTML = `
    <div class="game-hud__brand">DEAD CIRCUIT</div>
    <div class="game-hud__row">
      <span>POINTS</span>
      <strong data-hud="points">500</strong>
    </div>
    <div class="game-hud__row">
      <span>SCORE</span>
      <strong data-hud="score">0</strong>
    </div>
    <div class="game-hud__row">
      <span>RUN TIME</span>
      <strong data-hud="timer">0:00</strong>
    </div>
    <div class="health-hud" data-health-state="healthy">
      <div class="health-hud__label">
        <span>HEALTH</span>
        <strong data-hud="health-text">200 / 200</strong>
      </div>
      <div
        class="health-hud__track"
        role="progressbar"
        aria-label="Player health"
        aria-valuemin="0"
        aria-valuemax="200"
        aria-valuenow="200"
      >
        <div class="health-hud__fill" data-hud="health-fill"></div>
      </div>
    </div>
    <div class="double-points-hud" aria-hidden="true">
      <div class="double-points-hud__label">
        <strong>2X POINTS</strong>
        <span data-hud="double-points-time">30</span>
      </div>
      <div class="double-points-hud__track">
        <div
          class="double-points-hud__fill"
          data-hud="double-points-fill"
        ></div>
      </div>
    </div>
    <div class="game-hud__weapon">
      <span>WEAPON</span>
      <strong data-hud="weapon">PEW-PEW</strong>
    </div>
    <div class="weapon-slots">
      <div class="weapon-slot is-active" data-slot="0">
        <kbd>1</kbd>
        <span data-slot-name="0">PEW-PEW</span>
      </div>
      <div class="weapon-slot" data-slot="1">
        <kbd>2</kbd>
        <span data-slot-name="1">EMPTY</span>
      </div>
    </div>
  `

  // The interaction prompt shows the current E-key action.
  const interactionPrompt = document.createElement('div')
  interactionPrompt.className = 'interaction-prompt'


  const message = document.createElement('div')
  message.className = 'game-message'

  parent.append(hud, interactionPrompt, message)

  // Cache every element that changes during gameplay. main.js keeps this
  // returned object and passes it into the update functions below, meaning
  // querySelector does not need to search the document on every animation.
  return {
    root: hud,
    interactionPrompt,
    message,
    points: hud.querySelector('[data-hud="points"]'),
    score: hud.querySelector('[data-hud="score"]'),
    timer: hud.querySelector('[data-hud="timer"]'),
    health: hud.querySelector('.health-hud'),
    healthTrack: hud.querySelector('.health-hud__track'),
    healthText: hud.querySelector('[data-hud="health-text"]'),
    healthFill: hud.querySelector('[data-hud="health-fill"]'),
    doublePoints: hud.querySelector('.double-points-hud'),
    doublePointsTime: hud.querySelector(
      '[data-hud="double-points-time"]',
    ),
    doublePointsFill: hud.querySelector(
      '[data-hud="double-points-fill"]',
    ),
    weapon: hud.querySelector('[data-hud="weapon"]'),
    weaponSlots: [...hud.querySelectorAll('.weapon-slot')],
    weaponSlotNames: [...hud.querySelectorAll('[data-slot-name]')],
  }
}

// this creates one red overlay that can be reused every time the player gets hit
export function createDamageFeedback(
  parent = document.querySelector('#app'),
) {
  const overlay = document.createElement('div')
  overlay.className = 'damage-feedback'
  overlay.setAttribute('aria-hidden', 'true')
  parent.appendChild(overlay)
  return overlay
}

export function showDamageFeedback(overlay) {
  if (!overlay) return

  // removing the class first restarts the flash when hits happen close together
  overlay.classList.remove('is-visible')
  void overlay.offsetWidth
  overlay.classList.add('is-visible')
}

export function clearDamageFeedback(overlay) {
  overlay?.classList.remove('is-visible')
}

// main.js calls this when HUD values need to change.
export function updateHUD(
  hud,
  gameState,
  weapon,
  weaponSlots = [],
  activeSlotIndex = 0,
) {
  hud.points.textContent = gameState.points
  hud.score.textContent = gameState.score
  hud.timer.textContent = formatElapsedTime(gameState.elapsedTime)

  // Optional chaining keeps the HUD stable when no weapon is equipped.
  hud.weapon.textContent = weapon?.name ?? 'NONE'

  // Weapon slot classes highlight the equipped weapon.
  hud.weaponSlotNames.forEach((element, index) => {
    element.textContent = weaponSlots[index]?.name ?? 'EMPTY'
  })

  // classList.toggle with a second argument adds the class when the condition
  // is true and removes it when false. CSS uses these classes for highlighting.
  hud.weaponSlots.forEach((element, index) => {
    element.classList.toggle('is-active', index === activeSlotIndex)
    element.classList.toggle('is-empty', !weaponSlots[index])
  })

  // Messages stay in the DOM but become visible only while their timer is
  // active. Variants let Max Ammo and Double Points use special CSS designs.
  hud.message.textContent = gameState.message
  hud.message.classList.toggle(
    'is-visible',
    gameState.messageTimer > 0 && Boolean(gameState.message),
  )
  hud.message.classList.toggle(
    'game-message--max-ammo',
    gameState.messageVariant === 'max-ammo',
  )
  hud.message.classList.toggle(
    'game-message--double-points',
    gameState.messageVariant === 'double-points',
  )

  // Never send a negative countdown to the interface. The ratio converts the
  // remaining duration into a value from 0 to 1 for the progress-bar width.
  const doublePointsRemaining = Math.max(
    0,
    gameState.doublePointsRemaining,
  )
  const doublePointsRatio =
    gameState.doublePointsDuration > 0
      ? doublePointsRemaining / gameState.doublePointsDuration
      : 0

  // The final five seconds use the urgent animation. aria-hidden also tells
  // assistive technology to ignore this section while the power-up is inactive.
  hud.doublePoints.classList.toggle(
    'is-active',
    doublePointsRemaining > 0,
  )
  hud.doublePoints.classList.toggle(
    'is-urgent',
    doublePointsRemaining > 0 && doublePointsRemaining <= 5,
  )
  hud.doublePoints.setAttribute(
    'aria-hidden',
    String(doublePointsRemaining <= 0),
  )
  hud.doublePointsTime.textContent = Math.ceil(doublePointsRemaining)

  // Clamp the calculated width between 0% and 100% so unexpected state values
  // cannot make the progress bar overflow its track.
  hud.doublePointsFill.style.width =
    `${Math.max(0, Math.min(100, doublePointsRatio * 100))}%`
}

// Health updates are event-driven from the player health system rather than
// being recalculated by updateHUD every frame.
export function updateHealthHUD(hud, health, maxHealth, isDead = false) {
  // Avoid division by zero if an invalid max-health value is ever provided.
  const percentage = maxHealth > 0 ? (health / maxHealth) * 100 : 0
  hud.healthText.textContent = `${Math.ceil(health)} / ${maxHealth}`
  hud.healthFill.style.width = `${Math.max(0, Math.min(100, percentage))}%`

  // Keep the progressbar's accessibility values synchronized with the visual
  // bar so screen readers receive the same health information as the player.
  hud.healthTrack.setAttribute('aria-valuemax', String(maxHealth))
  hud.healthTrack.setAttribute('aria-valuenow', String(Math.ceil(health)))

  // CSS reads data-health-state to choose the normal, low-health, or dead
  // appearance. Death takes priority over the percentage check.
  hud.health.dataset.healthState =
    isDead ? 'dead' : percentage <= 25 ? 'critical' : 'healthy'
}

// Showing a prompt sets its current instruction before applying the class that
// fades it into view.
export function showInteractionPrompt(hud, text) {
  hud.interactionPrompt.textContent = text
  hud.interactionPrompt.classList.add('is-visible')
}

// Clear old text as well as hiding the element so a previous interaction does
// not briefly reappear when the player approaches something else.
export function hideInteractionPrompt(hud) {
  hud.interactionPrompt.textContent = ''
  hud.interactionPrompt.classList.remove('is-visible')
}
