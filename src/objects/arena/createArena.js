import { BARRICADE_Y } from './arenaConstants.js'
import {
  doorData,
  endGameData,
  roomData,
  zombieSpawnZones,
} from './arenaData.js'
import { arenaCollisionBoxes } from './collisionData.js'
import { createArenaBloodDecals } from './arenaDecals.js'
import { createArenaMaterials } from './arenaTextures.js'
import {
  createBarricadeWindow,
  createBox,
  createCrate,
  createExteriorSpawnFloor,
  createFogPlane,
  createLockedDoor,
  createNamedGroup,
  createRoomGroup,
  createWallWithOpening,
} from './geometryHelpers.js'

function createFirstRoomSection(materials) {
  const section = createRoomGroup(roomData.firstRoom)
  const walls = createNamedGroup('FirstRoomBoundaryWalls')
  const obstacles = createNamedGroup('FirstRoomObstacles')
  const barricades = createNamedGroup('FirstRoomBarricades')
  const spawnFloors = createNamedGroup('FirstRoomExteriorSpawnFloors')

  section.add(
    createBox('FirstRoomFloor', { x: -16, y: -0.1, z: 10 }, { x: 10, y: 0.2, z: 8 }, materials.firstRoomFloor),
  )

  walls.add(
    createBox('FirstRoomWestWall', { x: -21, y: 1.25, z: 10 }, { x: 0.5, y: 2.5, z: 8 }, materials.wall),
    createBox('FirstRoomNorthWall', { x: -16, y: 1.25, z: 6 }, { x: 10, y: 2.5, z: 0.5 }, materials.wall),
    createWallWithOpening({
      wallName: 'FirstRoomSouthWall',
      axis: 'x',
      wallPosition: { x: -16, z: 14 },
      wallLength: 10,
      openingCenter: -17,
      material: materials.wall,
    }),
    createBox('FirstRoomEastNorthWall', { x: -11, y: 1.25, z: 7.25 }, { x: 0.5, y: 2.5, z: 2.5 }, materials.wall),
    createBox('FirstRoomEastSouthWall', { x: -11, y: 1.25, z: 12.75 }, { x: 0.5, y: 2.5, z: 2.5 }, materials.wall),
  )

  obstacles.add(
    createCrate('FirstRoomCrate', { x: -18, y: 0.65, z: 9 }, { x: 1.3, y: 1.3, z: 1.3 }, materials.prop),
    createBox('FirstRoomLowBarrier', { x: -14, y: 0.45, z: 12 }, { x: 2.4, y: 0.9, z: 0.8 }, materials.prop),
  )

  barricades.add(
    createBarricadeWindow({
      name: 'FirstRoomSouthBarricade',
      position: { x: -17, y: BARRICADE_Y, z: 14 },
      rotation: Math.PI,
      materials,
    }),
  )

  spawnFloors.add(
    createExteriorSpawnFloor('ExteriorSpawnFloor_FirstRoomSouth', { x: -17, z: 16.25 }, materials.exteriorFloor),
  )

  section.add(
    walls,
    obstacles,
    barricades,
    spawnFloors,
    createLockedDoor(doorData[0], { x: -11, z: 10 }, 'z', materials),
  )
  return section
}

function createSecondRoomSection(materials) {
  const section = createRoomGroup(roomData.secondRoom)
  const walls = createNamedGroup('SecondRoomBoundaryWalls')
  const obstacles = createNamedGroup('SecondRoomObstacles')
  const barricades = createNamedGroup('SecondRoomBarricades')
  const spawnFloors = createNamedGroup('SecondRoomExteriorSpawnFloors')

  section.add(
    createBox('SecondRoomFloor', { x: -4, y: -0.1, z: 10 }, { x: 14, y: 0.2, z: 12 }, materials.secondRoomFloor),
  )

  // These walls define the second room boundary and barricade openings.
  walls.add(
    createBox('SecondRoomWestNorthWall', { x: -11, y: 1.25, z: 6.25 }, { x: 0.5, y: 2.5, z: 4.5 }, materials.wall),
    createBox('SecondRoomWestSouthWall', { x: -11, y: 1.25, z: 13.75 }, { x: 0.5, y: 2.5, z: 4.5 }, materials.wall),
    createWallWithOpening({
      wallName: 'SecondRoomNorthWall',
      axis: 'x',
      wallPosition: { x: -6, z: 4 },
      wallLength: 10,
      openingCenter: -6,
      material: materials.wall,
    }),
    createBox('SecondRoomNorthEastWall', { x: 2.5, y: 1.25, z: 4 }, { x: 1, y: 2.5, z: 0.5 }, materials.wall),
    createBox('SecondRoomEastNorthWall', { x: 3, y: 1.25, z: 5.75 }, { x: 0.5, y: 2.5, z: 5 }, materials.wall),
    createWallWithOpening({
      wallName: 'SecondRoomSouthWall',
      axis: 'x',
      wallPosition: { x: -4, z: 16 },
      wallLength: 14,
      openingCenter: -2,
      material: materials.wall,
    }),
    createBox('SecondRoomEastSouthWall', { x: 3, y: 1.25, z: 12 }, { x: 0.5, y: 2.5, z: 8 }, materials.wall),
  )

  obstacles.add(
    createCrate('SecondRoomWestCrate', { x: -8, y: 0.7, z: 8 }, { x: 1.4, y: 1.4, z: 1.4 }, materials.prop),
    createBox('SecondRoomCenterBarrier', { x: -3, y: 0.5, z: 11 }, { x: 3, y: 1, z: 0.8 }, materials.prop),
    createCrate('SecondRoomEastCrate', { x: 0.5, y: 0.6, z: 7.5 }, { x: 1.5, y: 1.2, z: 1.5 }, materials.prop),
  )

  barricades.add(
    createBarricadeWindow({
      name: 'SecondRoomNorthBarricade',
      position: { x: -6, y: BARRICADE_Y, z: 4 },
      materials,
    }),
    createBarricadeWindow({
      name: 'SecondRoomSouthBarricade',
      position: { x: -2, y: BARRICADE_Y, z: 16 },
      rotation: Math.PI,
      materials,
    }),
  )

  spawnFloors.add(
    createExteriorSpawnFloor('ExteriorSpawnFloor_SecondRoomNorth', { x: -6, z: 1.75 }, materials.exteriorFloor),
    createExteriorSpawnFloor('ExteriorSpawnFloor_SecondRoomSouth', { x: -2, z: 18.25 }, materials.exteriorFloor),
  )

  section.add(walls, obstacles, barricades, spawnFloors)
  return section
}

function createConnectorSection(materials) {
  const section = createRoomGroup(roomData.connector)
  const walls = createNamedGroup('ConnectorWalls')

  // Two overlapping floor rectangles form the L-shaped walking route.
  section.add(
    createBox('ConnectorVerticalFloor', { x: 0.5, y: -0.1, z: 1.5 }, { x: 5, y: 0.2, z: 11 }, materials.connectorFloor),
    createBox('ConnectorHorizontalFloor', { x: 5.5, y: -0.1, z: -1.5 }, { x: 8, y: 0.2, z: 5 }, materials.connectorFloor),
  )

  // These walls enclose the turn while leaving only the planned entrances open.
  walls.add(
    createBox('ConnectorWestWall', { x: -2, y: 1.25, z: 0 }, { x: 0.5, y: 2.5, z: 8 }, materials.wall),
    createBox('ConnectorNorthWall', { x: 3.5, y: 1.25, z: -4 }, { x: 11, y: 2.5, z: 0.5 }, materials.wall),
    createBox('ConnectorInnerEastWall', { x: 3, y: 1.25, z: 2.5 }, { x: 0.5, y: 2.5, z: 3 }, materials.wall),
    createBox('ConnectorSouthWall', { x: 6, y: 1.25, z: 1 }, { x: 6, y: 2.5, z: 0.5 }, materials.wall),
  )

  section.add(
    walls,
    createLockedDoor(doorData[1], { x: 9, z: -1.5 }, 'z', materials),
  )
  return section
}

function createThirdRoomSection(materials) {
  const section = createRoomGroup(roomData.thirdRoom)
  const walls = createNamedGroup('ThirdRoomBoundaryWalls')
  const obstacles = createNamedGroup('ThirdRoomObstacles')
  const barricades = createNamedGroup('ThirdRoomBarricades')
  const spawnFloors = createNamedGroup('ThirdRoomExteriorSpawnFloors')

  section.add(
    createBox('ThirdRoomFloor', { x: 16, y: -0.1, z: -4 }, { x: 14, y: 0.2, z: 16 }, materials.thirdRoomFloor),
  )

  walls.add(
    createWallWithOpening({
      wallName: 'ThirdRoomWestNorthWall',
      axis: 'z',
      wallPosition: { x: 9, z: -8.75 },
      wallLength: 6.5,
      openingCenter: -9,
      material: materials.wall,
    }),
    createBox('ThirdRoomWestDoorNorthWall', { x: 9, y: 1.25, z: -4.25 }, { x: 0.5, y: 2.5, z: 2.5 }, materials.wall),
    createBox('ThirdRoomWestSouthWall', { x: 9, y: 1.25, z: 2 }, { x: 0.5, y: 2.5, z: 4 }, materials.wall),
    createBox('ThirdRoomNorthWestWall', { x: 11.75, y: 1.25, z: -12 }, { x: 5.5, y: 2.5, z: 0.5 }, materials.wall),
    createBox('ThirdRoomNorthEastWall', { x: 20.25, y: 1.25, z: -12 }, { x: 5.5, y: 2.5, z: 0.5 }, materials.wall),
    createWallWithOpening({
      wallName: 'ThirdRoomSouthWall',
      axis: 'x',
      wallPosition: { x: 16, z: 4 },
      wallLength: 14,
      openingCenter: 18,
      material: materials.wall,
    }),
    createWallWithOpening({
      wallName: 'ThirdRoomEastWall',
      axis: 'z',
      wallPosition: { x: 23, z: -4 },
      wallLength: 16,
      openingCenter: -2,
      material: materials.wall,
    }),
  )

  obstacles.add(
    createCrate('ThirdRoomNorthWestCrate', { x: 12, y: 0.7, z: -8 }, { x: 1.4, y: 1.4, z: 1.4 }, materials.prop),
    createBox('ThirdRoomCenterBarrier', { x: 16, y: 0.5, z: -4 }, { x: 3.5, y: 1, z: 0.9 }, materials.prop),
    createCrate('ThirdRoomSouthEastCrate', { x: 20, y: 0.65, z: 1 }, { x: 1.6, y: 1.3, z: 1.6 }, materials.prop),
    createBox('ThirdRoomWestCover', { x: 12, y: 0.45, z: 0 }, { x: 2.5, y: 0.9, z: 0.8 }, materials.prop),
    createBox('ThirdRoomEastCover', { x: 20, y: 0.55, z: -7 }, { x: 0.8, y: 1.1, z: 2.6 }, materials.prop),
  )

  barricades.add(
    createBarricadeWindow({
      name: 'ThirdRoomWestBarricade',
      position: { x: 9, y: BARRICADE_Y, z: -9 },
      rotation: Math.PI / 2,
      materials,
    }),
    createBarricadeWindow({
      name: 'ThirdRoomSouthBarricade',
      position: { x: 18, y: BARRICADE_Y, z: 4 },
      rotation: Math.PI,
      materials,
    }),
    createBarricadeWindow({
      name: 'ThirdRoomEastBarricade',
      position: { x: 23, y: BARRICADE_Y, z: -2 },
      rotation: Math.PI / 2,
      materials,
    }),
  )

  spawnFloors.add(
    createExteriorSpawnFloor('ExteriorSpawnFloor_ThirdRoomWest', { x: 6.75, z: -9 }, materials.exteriorFloor),
    createExteriorSpawnFloor('ExteriorSpawnFloor_ThirdRoomSouth', { x: 18, z: 6.25 }, materials.exteriorFloor),
    createExteriorSpawnFloor('ExteriorSpawnFloor_ThirdRoomEast', { x: 25.25, z: -2 }, materials.exteriorFloor),
  )

  section.add(
    walls,
    obstacles,
    barricades,
    spawnFloors,
    createLockedDoor(doorData[2], { x: 16, z: -12 }, 'x', materials),
  )
  return section
}

function createFourthRoomSection(materials) {
  const section = createRoomGroup(roomData.fourthRoom)
  const walls = createNamedGroup('FourthRoomBoundaryWalls')
  const interiorWalls = createNamedGroup('FourthRoomInteriorWalls')
  const obstacles = createNamedGroup('FourthRoomObstacles')
  const barricades = createNamedGroup('FourthRoomBarricades')
  const spawnFloors = createNamedGroup('FourthRoomExteriorSpawnFloors')

  section.add(
    createBox('FourthRoomFloor', { x: 17, y: -0.1, z: -18 }, { x: 12, y: 0.2, z: 12 }, materials.fourthRoomFloor),
  )

  walls.add(
    createBox('FourthRoomWestNorthWall', { x: 11, y: 1.25, z: -22.75 }, { x: 0.5, y: 2.5, z: 2.5 }, materials.wall),
    createBox('FourthRoomWestSouthWall', { x: 11, y: 1.25, z: -15.25 }, { x: 0.5, y: 2.5, z: 6.5 }, materials.wall),
    createWallWithOpening({
      wallName: 'FourthRoomNorthWall',
      axis: 'x',
      wallPosition: { x: 17, z: -24 },
      wallLength: 12,
      openingCenter: 19,
      material: materials.wall,
    }),
    createWallWithOpening({
      wallName: 'FourthRoomEastWall',
      axis: 'z',
      wallPosition: { x: 23, z: -18 },
      wallLength: 12,
      openingCenter: -17,
      material: materials.wall,
    }),
    // The Third Room already owns this shared wall around the locked door.
    // Not drawing it twice prevents the two textured faces from flickering.
  )

  interiorWalls.add(
    createBox('FourthRoomInteriorWallA', { x: 15, y: 0.9, z: -18 }, { x: 0.5, y: 1.8, z: 3.5 }, materials.interiorWall),
    createBox('FourthRoomInteriorWallB', { x: 19.5, y: 0.9, z: -20.5 }, { x: 3, y: 1.8, z: 0.5 }, materials.interiorWall),
  )

  obstacles.add(
    createCrate('FourthRoomNorthCrate', { x: 20, y: 0.65, z: -15 }, { x: 1.3, y: 1.3, z: 1.3 }, materials.prop),
    createCrate('FourthRoomSouthCrate', { x: 14, y: 0.55, z: -22 }, { x: 1.8, y: 1.1, z: 1.4 }, materials.prop),
  )

  barricades.add(
    createBarricadeWindow({
      name: 'FourthRoomNorthBarricade',
      position: { x: 19, y: BARRICADE_Y, z: -24 },
      materials,
    }),
    createBarricadeWindow({
      name: 'FourthRoomEastBarricade',
      position: { x: 23, y: BARRICADE_Y, z: -17 },
      rotation: Math.PI / 2,
      materials,
    }),
  )

  spawnFloors.add(
    createExteriorSpawnFloor('ExteriorSpawnFloor_FourthRoomNorth', { x: 19, z: -26.25 }, materials.exteriorFloor),
    createExteriorSpawnFloor('ExteriorSpawnFloor_FourthRoomEast', { x: 25.25, z: -17 }, materials.exteriorFloor),
  )

  section.add(
    walls,
    interiorWalls,
    obstacles,
    barricades,
    spawnFloors,
    createLockedDoor(doorData[3], { x: 11, z: -20 }, 'z', materials),
  )
  return section
}

function createExtractionRoomSection(materials) {
  const section = createRoomGroup(roomData.extractionRoom)
  const walls = createNamedGroup('ExtractionRoomBoundaryWalls')

  section.add(
    createBox('ExtractionRoomFloor', { x: 6, y: -0.1, z: -20 }, { x: 10, y: 0.2, z: 8 }, materials.extractionRoomFloor),
  )

  walls.add(
    createBox('ExtractionRoomNorthWall', { x: 6, y: 1.25, z: -24 }, { x: 10, y: 2.5, z: 0.5 }, materials.wall),
    createBox('ExtractionRoomSouthWall', { x: 6, y: 1.25, z: -16 }, { x: 10, y: 2.5, z: 0.5 }, materials.wall),
    createBox('ExtractionRoomWestWall', { x: 1, y: 1.25, z: -20 }, { x: 0.5, y: 2.5, z: 8 }, materials.wall),
    // The Fourth Room walls already cover this shared extraction boundary.
  )

  const endGameMarker = createBox(
    'EndGameMarker',
    { x: 4, y: 0.75, z: -20 },
    { x: 1.2, y: 1.5, z: 1.2 },
    materials.endGame,
  )
  endGameMarker.userData.endGame = { ...endGameData }

  section.add(walls, endGameMarker)
  return section
}

// Build the complete static arena once. Materials are shared by all sections,
// which keeps the room builders simple and avoids duplicate GPU resources.
export function createArena() {
  const arena = createNamedGroup('ArenaGroup')
  // Arena texture materials are loaded once and shared by the room meshes.
  const materials = createArenaMaterials()

  // Sections are added in the same order the player encounters them.
  arena.add(
    createFirstRoomSection(materials),
    createSecondRoomSection(materials),
    createConnectorSection(materials),
    createThirdRoomSection(materials),
    createFourthRoomSection(materials),
    createExtractionRoomSection(materials),
  )

  // Fog planes are static transparent meshes placed just above each floor.
  const roomFog = createNamedGroup('RoomFogPlanes')
  roomFog.add(
    createFogPlane('FirstRoomRoomFogPlane', { x: -16, y: 0.12, z: 10 }, { x: 9, z: 7 }, materials.fog),
    createFogPlane('SecondRoomFogPlane', { x: -4, y: 0.12, z: 10 }, { x: 13, z: 11 }, materials.fog),
    createFogPlane('ConnectorFogPlane', { x: 3.5, y: 0.12, z: -1.5 }, { x: 10, z: 4 }, materials.fog),
    createFogPlane('ThirdRoomFogPlane', { x: 16, y: 0.12, z: -4 }, { x: 13, z: 15 }, materials.fog),
    createFogPlane('FourthRoomFogPlane', { x: 17, y: 0.12, z: -18 }, { x: 11, z: 11 }, materials.fog),
    createFogPlane('ExtractionRoomRoomFogPlane', { x: 6, y: 0.12, z: -20 }, { x: 9, z: 7 }, materials.fog),
  )
  arena.add(roomFog)
  arena.add(createArenaBloodDecals())

  // Copies protect the exported configuration objects from accidental mutation.
  arena.userData.rooms = Object.values(roomData).map((room) => ({
    ...room,
    bounds: { ...room.bounds },
  }))
  arena.userData.doors = doorData.map((door) => ({ ...door }))
  arena.userData.endGame = { ...endGameData }
  arena.userData.zombieSpawnZones = zombieSpawnZones.map((zone) => ({
    ...zone,
    position: { ...zone.position },
  }))
  arena.userData.collisionBoxes = arenaCollisionBoxes.map((box) => ({
    name: box.name,
    position: { ...box.position },
    size: { ...box.size },
  }))

  return arena
}
