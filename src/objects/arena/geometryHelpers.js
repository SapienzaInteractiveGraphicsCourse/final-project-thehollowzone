import * as THREE from 'three'

// Shared geometry helpers keep naming, positioning, material, and shadow setup consistent.

import {
  BARRICADE_HEIGHT,
  BARRICADE_WIDTH,
  BARRICADE_Y,
  DEFAULT_BARRICADE_PLANK_SETTINGS,
  DOOR_WIDTH,
  EXTERIOR_FLOOR_SIZE,
  WALL_HEIGHT,
  WALL_THICKNESS,
} from './arenaConstants.js'

export function createBox(name, position, size, material) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(size.x, size.y, size.z),
    material,
  )
  mesh.name = name
  mesh.position.set(position.x, position.y, position.z)
  // Floors receive shadows but do not need to render into either shadow map.
  mesh.castShadow = !name.includes('Floor')
  mesh.receiveShadow = true
  // Solid cover can stop the ray and receive the temporary bullet mark.
  mesh.userData.bulletImpactSurface =
    /Wall|Crate|Barrier|Cover|Panel|Plank/.test(name)
  return mesh
}

export function createFogPlane(name, position, size, material) {
  const fogPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(size.x, size.z),
    material,
  )
  fogPlane.name = name
  fogPlane.position.set(position.x, position.y, position.z)
  fogPlane.rotation.x = -Math.PI / 2
  fogPlane.renderOrder = 1
  return fogPlane
}

export function createNamedGroup(name) {
  const group = new THREE.Group()
  group.name = name
  return group
}

export function createRoomGroup(room) {
  // Room metadata travels with the THREE.Group for room detection.
  const group = createNamedGroup(room.sceneName)
  group.userData.room = { ...room }
  return group
}

export function createCrate(name, position, size, material) {
  return createBox(name, position, size, material)
}

export function createExteriorSpawnFloor(name, position, material) {
  // Exterior floors show where zombies may stand before crossing a barricade.
  return createBox(
    name,
    { x: position.x, y: -0.12, z: position.z },
    { x: EXTERIOR_FLOOR_SIZE, y: 0.18, z: EXTERIOR_FLOOR_SIZE },
    material,
  )
}

export function createWallWithOpening({
  wallName,
  axis,
  wallPosition,
  wallLength,
  openingCenter,
  material,
}) {
  // A wall opening is built from four boxes around an empty center rectangle.
  // This keeps the barricade visible from both sides without Boolean geometry.
  const wall = createNamedGroup(wallName)
  const wallStart = wallPosition[axis] - wallLength / 2
  const wallEnd = wallPosition[axis] + wallLength / 2
  const openingStart = openingCenter - BARRICADE_WIDTH / 2
  const openingEnd = openingCenter + BARRICADE_WIDTH / 2
  const firstLength = openingStart - wallStart
  const secondLength = wallEnd - openingEnd
  const bottomHeight = BARRICADE_Y - BARRICADE_HEIGHT / 2
  const topStart = BARRICADE_Y + BARRICADE_HEIGHT / 2
  const topHeight = WALL_HEIGHT - topStart
  const isHorizontal = axis === 'x'

  function createSegment(name, center, length, y, height) {
    return createBox(
      name,
      {
        x: isHorizontal ? center : wallPosition.x,
        y,
        z: isHorizontal ? wallPosition.z : center,
      },
      {
        x: isHorizontal ? length : WALL_THICKNESS,
        y: height,
        z: isHorizontal ? WALL_THICKNESS : length,
      },
      material,
    )
  }

  wall.add(
    createSegment(`${wallName}_LeftSegment`, wallStart + firstLength / 2, firstLength, WALL_HEIGHT / 2, WALL_HEIGHT),
    createSegment(`${wallName}_RightSegment`, openingEnd + secondLength / 2, secondLength, WALL_HEIGHT / 2, WALL_HEIGHT),
    createSegment(`${wallName}_TopSegment`, openingCenter, BARRICADE_WIDTH, topStart + topHeight / 2, topHeight),
    createSegment(`${wallName}_BottomSegment`, openingCenter, BARRICADE_WIDTH, bottomHeight / 2, bottomHeight),
  )

  return wall
}

export function createBarricadeWindow({
  name,
  position,
  rotation = 0,
  width = BARRICADE_WIDTH,
  plankSettings = DEFAULT_BARRICADE_PLANK_SETTINGS,
  materials,
}) {
  // Planks sit directly across the wall opening.
  const barricade = createNamedGroup(name)
  barricade.position.set(position.x, position.y, position.z)
  barricade.rotation.y = rotation

  plankSettings.forEach((settings, index) => {
    const plankWidth =
      width * settings.widthMultiplier + settings.widthOffset
    const plank = createBox(
      `Plank_${index + 1}`,
      { x: 0, y: settings.y, z: (index - 1.5) * 0.012 },
      { x: plankWidth, y: 0.26, z: 0.2 },
      materials.plank,
    )
    plank.rotation.z = settings.rotation
    barricade.add(plank)
  })

  // Keeping the plank list on the barricade makes it easy for zombies to
  // remove one board at a time without searching the whole scene each hit.
  barricade.userData.planks = [...barricade.children]
  barricade.userData.isBroken = false

  return barricade
}

export function createLockedDoor(data, position, axis, materials) {
  // `axis` describes the wall direction: x creates a wide X-facing panel,
  // while z creates a wide Z-facing panel. Door behavior is metadata only.
  const door = createNamedGroup(data.name)
  const isHorizontal = axis === 'x'
  const panelSize = {
    x: isHorizontal ? DOOR_WIDTH : WALL_THICKNESS,
    y: WALL_HEIGHT,
    z: isHorizontal ? WALL_THICKNESS : DOOR_WIDTH,
  }
  const markerSize = {
    x: isHorizontal ? 1.4 : 0.12,
    y: 0.65,
    z: isHorizontal ? 0.12 : 1.4,
  }

  door.add(
    createBox(`${data.name}Panel`, { x: position.x, y: 1.25, z: position.z }, panelSize, materials.door),
  )

  if (isHorizontal) {
    door.add(
      createBox(`${data.name}NearSideMarker`, { x: position.x, y: 1.45, z: position.z + 0.3 }, markerSize, materials.doorMarker),
      createBox(`${data.name}FarSideMarker`, { x: position.x, y: 1.45, z: position.z - 0.3 }, markerSize, materials.doorMarker),
    )
  } else {
    door.add(
      createBox(`${data.name}NearSideMarker`, { x: position.x - 0.3, y: 1.45, z: position.z }, markerSize, materials.doorMarker),
      createBox(`${data.name}FarSideMarker`, { x: position.x + 0.3, y: 1.45, z: position.z }, markerSize, materials.doorMarker),
    )
  }

  door.userData.door = { ...data }
  return door
}
