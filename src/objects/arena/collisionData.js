import {
  BARRICADE_HEIGHT,
  BARRICADE_WIDTH,
  BARRICADE_Y,
  DOOR_WIDTH,
  WALL_HEIGHT,
  WALL_THICKNESS,
} from './arenaConstants.js'

function createWallOpeningCollisionBoxes({
  wallName,
  barricadeName,
  axis,
  wallPosition,
  wallLength,
  openingCenter,
}) {
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

  function segment(name, center, length, y, height) {
    return {
      name,
      position: {
        x: isHorizontal ? center : wallPosition.x,
        y,
        z: isHorizontal ? wallPosition.z : center,
      },
      size: {
        x: isHorizontal ? length : WALL_THICKNESS,
        y: height,
        z: isHorizontal ? WALL_THICKNESS : length,
      },
    }
  }

  return [
    segment(`${wallName}_LeftSegment`, wallStart + firstLength / 2, firstLength, WALL_HEIGHT / 2, WALL_HEIGHT),
    segment(`${wallName}_RightSegment`, openingEnd + secondLength / 2, secondLength, WALL_HEIGHT / 2, WALL_HEIGHT),
    segment(`${wallName}_TopSegment`, openingCenter, BARRICADE_WIDTH, topStart + topHeight / 2, topHeight),
    segment(`${wallName}_BottomSegment`, openingCenter, BARRICADE_WIDTH, bottomHeight / 2, bottomHeight),
    segment(`${barricadeName}Collision`, openingCenter, BARRICADE_WIDTH, BARRICADE_Y, BARRICADE_HEIGHT),
  ]
}

function createDoorCollisionBox(name, position, axis = 'z') {
  const isHorizontal = axis === 'x'

  return {
    name,
    position: { x: position.x, y: WALL_HEIGHT / 2, z: position.z },
    size: {
      x: isHorizontal ? DOOR_WIDTH : WALL_THICKNESS,
      y: WALL_HEIGHT,
      z: isHorizontal ? WALL_THICKNESS : DOOR_WIDTH,
    },
  }
}

// These boxes mirror visible walls, doors, and cover without depending on mesh geometry.
export const arenaCollisionBoxes = [
  // First Room: small spawn room with one doorway and one barricade.
  { name: 'FirstRoomWestWall', position: { x: -21, y: 1.25, z: 10 }, size: { x: 0.5, y: 2.5, z: 8 } },
  { name: 'FirstRoomNorthWall', position: { x: -16, y: 1.25, z: 6 }, size: { x: 10, y: 2.5, z: 0.5 } },
  ...createWallOpeningCollisionBoxes({
    wallName: 'FirstRoomSouthWall',
    barricadeName: 'FirstRoomSouthBarricade',
    axis: 'x',
    wallPosition: { x: -16, z: 14 },
    wallLength: 10,
    openingCenter: -17,
  }),
  { name: 'FirstRoomEastNorthWall', position: { x: -11, y: 1.25, z: 7.25 }, size: { x: 0.5, y: 2.5, z: 2.5 } },
  { name: 'FirstRoomEastSouthWall', position: { x: -11, y: 1.25, z: 12.75 }, size: { x: 0.5, y: 2.5, z: 2.5 } },

  // Second Room: the north-center gap is the intentional connector entrance.
  { name: 'SecondRoomWestNorthWall', position: { x: -11, y: 1.25, z: 6.25 }, size: { x: 0.5, y: 2.5, z: 4.5 } },
  { name: 'SecondRoomWestSouthWall', position: { x: -11, y: 1.25, z: 13.75 }, size: { x: 0.5, y: 2.5, z: 4.5 } },
  ...createWallOpeningCollisionBoxes({
    wallName: 'SecondRoomNorthWall',
    barricadeName: 'SecondRoomNorthBarricade',
    axis: 'x',
    wallPosition: { x: -6, z: 4 },
    wallLength: 10,
    openingCenter: -6,
  }),
  { name: 'SecondRoomNorthEastWall', position: { x: 2.5, y: 1.25, z: 4 }, size: { x: 1, y: 2.5, z: 0.5 } },
  // This uses the same overlap as the visible wall so there is no escape gap.
  { name: 'SecondRoomEastNorthWall', position: { x: 3, y: 1.25, z: 5.75 }, size: { x: 0.5, y: 2.5, z: 5 } },
  ...createWallOpeningCollisionBoxes({
    wallName: 'SecondRoomSouthWall',
    barricadeName: 'SecondRoomSouthBarricade',
    axis: 'x',
    wallPosition: { x: -4, z: 16 },
    wallLength: 14,
    openingCenter: -2,
  }),
  { name: 'SecondRoomEastSouthWall', position: { x: 3, y: 1.25, z: 12 }, size: { x: 0.5, y: 2.5, z: 8 } },

  // Connector: an L-shaped hallway that turns east toward the Third Room.
  { name: 'ConnectorWestWall', position: { x: -2, y: 1.25, z: 0 }, size: { x: 0.5, y: 2.5, z: 8 } },
  { name: 'ConnectorNorthWall', position: { x: 3.5, y: 1.25, z: -4 }, size: { x: 11, y: 2.5, z: 0.5 } },
  { name: 'ConnectorInnerEastWall', position: { x: 3, y: 1.25, z: 2.5 }, size: { x: 0.5, y: 2.5, z: 3 } },
  { name: 'ConnectorSouthWall', position: { x: 6, y: 1.25, z: 1 }, size: { x: 6, y: 2.5, z: 0.5 } },

  // Third Room: largest room, with three intentional barricade openings.
  ...createWallOpeningCollisionBoxes({
    wallName: 'ThirdRoomWestNorthWall',
    barricadeName: 'ThirdRoomWestBarricade',
    axis: 'z',
    wallPosition: { x: 9, z: -8.75 },
    wallLength: 6.5,
    openingCenter: -9,
  }),
  { name: 'ThirdRoomWestDoorNorthWall', position: { x: 9, y: 1.25, z: -4.25 }, size: { x: 0.5, y: 2.5, z: 2.5 } },
  { name: 'ThirdRoomWestSouthWall', position: { x: 9, y: 1.25, z: 2 }, size: { x: 0.5, y: 2.5, z: 4 } },
  { name: 'ThirdRoomNorthWestWall', position: { x: 11.75, y: 1.25, z: -12 }, size: { x: 5.5, y: 2.5, z: 0.5 } },
  { name: 'ThirdRoomNorthEastWall', position: { x: 20.25, y: 1.25, z: -12 }, size: { x: 5.5, y: 2.5, z: 0.5 } },
  ...createWallOpeningCollisionBoxes({
    wallName: 'ThirdRoomSouthWall',
    barricadeName: 'ThirdRoomSouthBarricade',
    axis: 'x',
    wallPosition: { x: 16, z: 4 },
    wallLength: 14,
    openingCenter: 18,
  }),
  ...createWallOpeningCollisionBoxes({
    wallName: 'ThirdRoomEastWall',
    barricadeName: 'ThirdRoomEastBarricade',
    axis: 'z',
    wallPosition: { x: 23, z: -4 },
    wallLength: 16,
    openingCenter: -2,
  }),

  // Fourth Room: side room that leads west into extraction.
  { name: 'FourthRoomWestNorthWall', position: { x: 11, y: 1.25, z: -22.75 }, size: { x: 0.5, y: 2.5, z: 2.5 } },
  // This matches the longer visible wall so players and zombies cannot walk
  // through the section that was added beside the extraction-room doorway.
  { name: 'FourthRoomWestSouthWall', position: { x: 11, y: 1.25, z: -15.25 }, size: { x: 0.5, y: 2.5, z: 6.5 } },
  ...createWallOpeningCollisionBoxes({
    wallName: 'FourthRoomNorthWall',
    barricadeName: 'FourthRoomNorthBarricade',
    axis: 'x',
    wallPosition: { x: 17, z: -24 },
    wallLength: 12,
    openingCenter: 19,
  }),
  ...createWallOpeningCollisionBoxes({
    wallName: 'FourthRoomEastWall',
    barricadeName: 'FourthRoomEastBarricade',
    axis: 'z',
    wallPosition: { x: 23, z: -18 },
    wallLength: 12,
    openingCenter: -17,
  }),

  // Extraction Room: final enclosed objective space.
  { name: 'ExtractionRoomNorthWall', position: { x: 6, y: 1.25, z: -24 }, size: { x: 10, y: 2.5, z: 0.5 } },
  { name: 'ExtractionRoomSouthWall', position: { x: 6, y: 1.25, z: -16 }, size: { x: 10, y: 2.5, z: 0.5 } },
  { name: 'ExtractionRoomWestWall', position: { x: 1, y: 1.25, z: -20 }, size: { x: 0.5, y: 2.5, z: 8 } },
  // This matches the green extraction box so players and zombies go around it
  // while the normal interaction range still lets the player pay from outside.
  { name: 'EndGameMarker', position: { x: 4, y: 0.75, z: -20 }, size: { x: 1.2, y: 1.5, z: 1.2 } },

  createDoorCollisionBox('DoorToSecondRoom', { x: -11, z: 10 }),
  createDoorCollisionBox('DoorToThirdRoom', { x: 9, z: -1.5 }),
  createDoorCollisionBox('DoorToFourthRoom', { x: 16, z: -12 }, 'x'),
  createDoorCollisionBox('DoorToExtractionRoom', { x: 11, z: -20 }),

  { name: 'FirstRoomCrate', position: { x: -18, y: 0.65, z: 9 }, size: { x: 1.3, y: 1.3, z: 1.3 } },
  { name: 'FirstRoomLowBarrier', position: { x: -14, y: 0.45, z: 12 }, size: { x: 2.4, y: 0.9, z: 0.8 } },
  { name: 'SecondRoomWestCrate', position: { x: -8, y: 0.7, z: 8 }, size: { x: 1.4, y: 1.4, z: 1.4 } },
  { name: 'SecondRoomCenterBarrier', position: { x: -3, y: 0.5, z: 11 }, size: { x: 3, y: 1, z: 0.8 } },
  { name: 'SecondRoomEastCrate', position: { x: 0.5, y: 0.6, z: 7.5 }, size: { x: 1.5, y: 1.2, z: 1.5 } },
  { name: 'ThirdRoomNorthWestCrate', position: { x: 12, y: 0.7, z: -8 }, size: { x: 1.4, y: 1.4, z: 1.4 } },
  { name: 'ThirdRoomCenterBarrier', position: { x: 16, y: 0.5, z: -4 }, size: { x: 3.5, y: 1, z: 0.9 } },
  { name: 'ThirdRoomSouthEastCrate', position: { x: 20, y: 0.65, z: 1 }, size: { x: 1.6, y: 1.3, z: 1.6 } },
  { name: 'ThirdRoomWestCover', position: { x: 12, y: 0.45, z: 0 }, size: { x: 2.5, y: 0.9, z: 0.8 } },
  { name: 'ThirdRoomEastCover', position: { x: 20, y: 0.55, z: -7 }, size: { x: 0.8, y: 1.1, z: 2.6 } },
  { name: 'FourthRoomInteriorWallA', position: { x: 15, y: 0.9, z: -18 }, size: { x: 0.5, y: 1.8, z: 3.5 } },
  { name: 'FourthRoomInteriorWallB', position: { x: 19.5, y: 0.9, z: -20.5 }, size: { x: 3, y: 1.8, z: 0.5 } },
  { name: 'FourthRoomNorthCrate', position: { x: 20, y: 0.65, z: -15 }, size: { x: 1.3, y: 1.3, z: 1.3 } },
  { name: 'FourthRoomSouthCrate', position: { x: 14, y: 0.55, z: -22 }, size: { x: 1.8, y: 1.1, z: 1.4 } },
]
