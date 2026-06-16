const KEY_BINDINGS = {
  KeyW: 'forward',
  KeyS: 'backward',
  KeyA: 'left',
  KeyD: 'right',
  ShiftLeft: 'run',
  ShiftRight: 'run',
  KeyF: 'flashlight',
  KeyE: 'interact',
  KeyR: 'reload',
  Digit1: 'weaponSlot1',
  Digit2: 'weaponSlot2',
  KeyO: 'debugView',
  KeyQ: 'developerPoints',
  Escape: 'escape',
}

export function createInputController() {
  const keys = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    run: false,
    flashlight: false,
    interact: false,
    reload: false,
    weaponSlot1: false,
    weaponSlot2: false,
    debugView: false,
    developerPoints: false,
    escape: false,
  }

  // Both Shift keys map to one action, so their physical states are stored
  // separately before calculating the shared `run` value.
  const physicalKeys = new Set()
  const pressedActions = new Set()

  function updateKey(event, isPressed) {
    const action = KEY_BINDINGS[event.code]
    if (!action) return

    if (isPressed) {
      if (!physicalKeys.has(event.code)) {
        pressedActions.add(action)
      }
      physicalKeys.add(event.code)
    } else {
      physicalKeys.delete(event.code)
    }

    if (action === 'run') {
      keys.run =
        physicalKeys.has('ShiftLeft') ||
        physicalKeys.has('ShiftRight')
    } else {
      keys[action] = isPressed
    }

    // Stop movement keys from scrolling or triggering browser shortcuts while
    // the canvas is being used as the game view.
    if (event.code !== 'Escape') {
      event.preventDefault()
    }
  }

  function reset() {
    physicalKeys.clear()
    pressedActions.clear()
    Object.keys(keys).forEach((key) => {
      keys[key] = false
    })
  }

  const onKeyDown = (event) => updateKey(event, true)
  const onKeyUp = (event) => updateKey(event, false)

  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('blur', reset)

  return {
    keys,
    // One-shot actions such as flashlight toggling are consumed once per press.
    consumePress(action) {
      const wasPressed = pressedActions.has(action)
      pressedActions.delete(action)
      return wasPressed
    },
    reset,
    dispose() {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', reset)
    },
  }
}
