import * as THREE from 'three'

function createPointLight(name, color, intensity, distance, position) {
  const light = new THREE.PointLight(color, intensity, distance, 2)
  light.name = name
  light.position.set(position.x, position.y, position.z)
  return light
}

// Build the atmosphere light rig and return the lights that animate at runtime.
export function createLights(scene) {
  // The ambient light keeps textured surfaces readable in the dark map.
  const ambientBaseLight = new THREE.AmbientLight(0x7b89a6, 0.48)
  ambientBaseLight.name = 'AmbientBaseLight'

  const moonDirectionalLight = new THREE.DirectionalLight(0x91a8d6, 1.28)
  moonDirectionalLight.name = 'MoonDirectionalLight'
  moonDirectionalLight.position.set(-14, 26, 16)
  moonDirectionalLight.target.position.set(2, 0, -5)
  // The moving flashlight supplies the close-range shadows. A second full-map
  // shadow pass from the moon is expensive and barely visible in the dark map.
  moonDirectionalLight.castShadow = false

  const firstRoomPointLight = createPointLight(
    'FirstRoomPointLight',
    0xd88b52,
    16,
    13,
    { x: -16, y: 3.4, z: 10 },
  )
  const secondRoomPointLight = createPointLight(
    'SecondRoomPointLight',
    0xb4a078,
    20,
    16,
    { x: -4, y: 3.8, z: 10 },
  )
  const connectorPointLight = createPointLight(
    'ConnectorPointLight',
    0x778da6,
    13,
    11,
    { x: 3, y: 3.1, z: -1 },
  )
  const thirdRoomPointLight = createPointLight(
    'ThirdRoomPointLight',
    0x9eb8d8,
    24,
    20,
    { x: 16, y: 4.2, z: -4 },
  )
  const fourthRoomPointLight = createPointLight(
    'FourthRoomPointLight',
    0xa8c1aa,
    17,
    15,
    { x: 17, y: 3.6, z: -18 },
  )
  const extractionRoomPointLight = createPointLight(
    'ExtractionRoomPointLight',
    0x55d6a0,
    20,
    12,
    { x: 6, y: 3.2, z: -20 },
  )

  // The flashlight is toggled by the player during gameplay.
  const playerFlashlightPlaceholder = new THREE.SpotLight(
    0xdce8ff,
    28,
    27,
    Math.PI / 7,
    0.45,
    1.4,
  )
  playerFlashlightPlaceholder.name = 'PlayerFlashlightPlaceholder'
  playerFlashlightPlaceholder.position.set(-15, 4.5, 10)
  playerFlashlightPlaceholder.target.position.set(-5, 0.8, 8)
  playerFlashlightPlaceholder.castShadow = true
  playerFlashlightPlaceholder.shadow.mapSize.set(256, 256)
  playerFlashlightPlaceholder.shadow.camera.near = 0.5
  playerFlashlightPlaceholder.shadow.camera.far = 28
  playerFlashlightPlaceholder.shadow.bias = -0.001

  scene.add(
    ambientBaseLight,
    moonDirectionalLight,
    moonDirectionalLight.target,
    firstRoomPointLight,
    secondRoomPointLight,
    connectorPointLight,
    thirdRoomPointLight,
    fourthRoomPointLight,
    extractionRoomPointLight,
    playerFlashlightPlaceholder,
    playerFlashlightPlaceholder.target,
  )

  return {
    ambientBaseLight,
    moonDirectionalLight,
    firstRoomPointLight,
    secondRoomPointLight,
    connectorPointLight,
    thirdRoomPointLight,
    fourthRoomPointLight,
    extractionRoomPointLight,
    playerFlashlightPlaceholder,
  }
}
