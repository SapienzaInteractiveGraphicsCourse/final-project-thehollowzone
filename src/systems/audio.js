// Audio paths are immutable so gameplay systems cannot rewrite sound assets.
export const GAME_AUDIO_PATHS = Object.freeze({
  pistol: Object.freeze({
    shot: '/audio/pistol-shot.mp3',
    reload: '/audio/pistol-reload.mp3',
  }),
  shotgun: Object.freeze({
    shot: '/audio/shotgun-shot.mp3',
    reload: '/audio/shotgun-reload.mp3',
  }),
  rifle: Object.freeze({
    shot: '/audio/rifle-shot.mp3',
    reload: '/audio/rifle-reload.mp3',
  }),
  zombieDeath: '/audio/zombie-death.mp3',
  doorOpen: '/audio/door-open.mp3',
  maxAmmo: '/audio/max-ammo.mp3',
  doublePoints: '/audio/double-points.mp3',
  victory: '/audio/teddy-bear.mp3',
  playerDeath: '/audio/player-death.mp3',
})

const DEFAULT_AUDIO_VOLUMES = Object.freeze({
  shot: 0.55,
  reload: 0.65,
  zombieDeath: 0.7,
  doorOpen: 0.65,
  powerUp: 0.75,
  victory: 0.8,
  playerDeath: 0.8,
})

function createAudioTemplate(path) {
  // Some non-browser environments do not have the Audio class.
  // Returning null keeps the module safe to import without changing browser behavior.
  if (typeof Audio === 'undefined') return null

  const audio = new Audio(path)
  audio.preload = 'auto'
  return audio
}

function playAudio(template, volume) {
  if (!template) return false

  // cloneNode gives every shot its own audio channel. This matters for the
  // automatic rifle because a new shot can start before the old sound ends.
  const sound = template.cloneNode()
  sound.volume = volume

  // Missing files or browser autoplay rules should never stop the game.
  // The rejected promise is handled quietly.
  const playResult = sound.play()
  playResult?.catch(() => {})
  return true
}

export function createGameAudioSystem({
  paths = GAME_AUDIO_PATHS,
  volumes = DEFAULT_AUDIO_VOLUMES,
} = {}) {
  // Only weapon entries contain shot and reload paths. Listing the weapon
  // names here keeps the single gameplay sounds separate and easy to extend.
  const weaponTypes = ['pistol', 'shotgun', 'rifle']
  const weaponAudio = Object.fromEntries(
    weaponTypes.map((type) => {
      const sounds = paths[type]
      return [
        type,
        {
          shot: createAudioTemplate(sounds.shot),
          reload: createAudioTemplate(sounds.reload),
        },
      ]
    }),
  )
  const gameplayAudio = {
    zombieDeath: createAudioTemplate(paths.zombieDeath),
    doorOpen: createAudioTemplate(paths.doorOpen),
    maxAmmo: createAudioTemplate(paths.maxAmmo),
    doublePoints: createAudioTemplate(paths.doublePoints),
    victory: createAudioTemplate(paths.victory),
    playerDeath: createAudioTemplate(paths.playerDeath),
  }

  return {
    playWeaponShot(type) {
      return playAudio(weaponAudio[type]?.shot, volumes.shot)
    },
    playWeaponReload(type) {
      return playAudio(weaponAudio[type]?.reload, volumes.reload)
    },
    playZombieDeath() {
      return playAudio(gameplayAudio.zombieDeath, volumes.zombieDeath)
    },
    playDoorOpen() {
      return playAudio(gameplayAudio.doorOpen, volumes.doorOpen)
    },
    playPowerUp(type) {
      // The collected type already uses these same names in powerUps.js, so
      // there is no extra conversion or duplicated condition in this module.
      const template =
        type === 'max-ammo'
          ? gameplayAudio.maxAmmo
          : type === 'double-points'
            ? gameplayAudio.doublePoints
            : null
      return playAudio(template, volumes.powerUp)
    },
    playVictory() {
      return playAudio(gameplayAudio.victory, volumes.victory)
    },
    playPlayerDeath() {
      return playAudio(gameplayAudio.playerDeath, volumes.playerDeath)
    },
  }
}
