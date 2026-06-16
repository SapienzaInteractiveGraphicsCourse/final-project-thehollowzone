// Each arena room has bounds so gameplay systems can decide when areas unlock.
// Room order: First Room -> Second Room -> Connector -> Third Room -> Fourth Room -> Extraction Room.
// sceneName is the exact THREE.Group name used when searching the scene graph.
// IDs provide stable references for doors, rooms, and spawn zones.
export const roomData = {
  firstRoom: {
    id: 'first-room',
    name: 'First Room',
    sceneName: 'FirstRoomSection',
    purpose: 'Player spawn and opening room',
    bounds: { minX: -21, maxX: -11, minZ: 6, maxZ: 14 },
  },
  secondRoom: {
    id: 'second-room',
    name: 'Second Room',
    sceneName: 'SecondRoomSection',
    purpose: 'First large combat room',
    bounds: { minX: -11, maxX: 3, minZ: 4, maxZ: 16 },
  },
  connector: {
    id: 'connector',
    name: 'Connector',
    sceneName: 'ConnectorSection',
    purpose: 'L-shaped hallway between the second and third rooms',
    bounds: { minX: -2, maxX: 9, minZ: -4, maxZ: 4 },
  },
  thirdRoom: {
    id: 'third-room',
    name: 'Third Room',
    sceneName: 'ThirdRoomSection',
    purpose: 'Largest combat space',
    bounds: { minX: 9, maxX: 23, minZ: -12, maxZ: 4 },
  },
  fourthRoom: {
    id: 'fourth-room',
    name: 'Fourth Room',
    sceneName: 'FourthRoomSection',
    purpose: 'Side room leading to extraction',
    bounds: { minX: 11, maxX: 23, minZ: -24, maxZ: -12 },
  },
  extractionRoom: {
    id: 'extraction-room',
    name: 'Extraction Room',
    sceneName: 'ExtractionRoomSection',
    purpose: 'Final objective area',
    bounds: { minX: 1, maxX: 11, minZ: -24, maxZ: -16 },
  },
}

export const doorData = [
  {
    id: 'door-to-second-room',
    name: 'DoorToSecondRoom',
    requiredPoints: 750,
    isOpen: false,
    leadsTo: roomData.secondRoom.sceneName,
    leadsToRoom: roomData.secondRoom.name,
  },
  {
    id: 'door-to-third-room',
    name: 'DoorToThirdRoom',
    requiredPoints: 1500,
    isOpen: false,
    leadsTo: roomData.thirdRoom.sceneName,
    leadsToRoom: roomData.thirdRoom.name,
  },
  {
    id: 'door-to-fourth-room',
    name: 'DoorToFourthRoom',
    requiredPoints: 2000,
    isOpen: false,
    leadsTo: roomData.fourthRoom.sceneName,
    leadsToRoom: roomData.fourthRoom.name,
  },
  {
    id: 'door-to-extraction-room',
    name: 'DoorToExtractionRoom',
    requiredPoints: 5000,
    isOpen: false,
    leadsTo: roomData.extractionRoom.sceneName,
    leadsToRoom: roomData.extractionRoom.name,
  },
]

export const endGameData = {
  id: 'final-objective',
  requiredPointsToWin: 6000,
  room: roomData.extractionRoom.sceneName,
  roomName: roomData.extractionRoom.name,
  isCompleted: false,
}

// Spawn points are associated with exterior floors outside barricades.
export const zombieSpawnZones = [
  {
    id: 'spawn-first-room-south',
    name: 'FirstRoomSouthExteriorSpawn',
    position: { x: -17, y: 0, z: 16.25 },
    linkedBarricade: 'FirstRoomSouthBarricade',
    roomTarget: roomData.firstRoom.sceneName,
    roomName: roomData.firstRoom.name,
    isActive: true,
  },
  {
    id: 'spawn-second-room-north',
    name: 'SecondRoomNorthExteriorSpawn',
    position: { x: -6, y: 0, z: 1.75 },
    linkedBarricade: 'SecondRoomNorthBarricade',
    roomTarget: roomData.secondRoom.sceneName,
    roomName: roomData.secondRoom.name,
    requiredDoorId: 'door-to-second-room',
    isActive: false,
  },
  {
    id: 'spawn-second-room-south',
    name: 'SecondRoomSouthExteriorSpawn',
    position: { x: -2, y: 0, z: 18.25 },
    linkedBarricade: 'SecondRoomSouthBarricade',
    roomTarget: roomData.secondRoom.sceneName,
    roomName: roomData.secondRoom.name,
    requiredDoorId: 'door-to-second-room',
    isActive: false,
  },
  {
    id: 'spawn-third-room-east',
    name: 'ThirdRoomEastExteriorSpawn',
    position: { x: 25.25, y: 0, z: -2 },
    linkedBarricade: 'ThirdRoomEastBarricade',
    roomTarget: roomData.thirdRoom.sceneName,
    roomName: roomData.thirdRoom.name,
    requiredDoorId: 'door-to-third-room',
    isActive: false,
  },
  {
    id: 'spawn-third-room-west',
    name: 'ThirdRoomWestExteriorSpawn',
    position: { x: 6.75, y: 0, z: -9 },
    linkedBarricade: 'ThirdRoomWestBarricade',
    roomTarget: roomData.thirdRoom.sceneName,
    roomName: roomData.thirdRoom.name,
    requiredDoorId: 'door-to-third-room',
    isActive: false,
  },
  {
    id: 'spawn-third-room-south',
    name: 'ThirdRoomSouthExteriorSpawn',
    position: { x: 18, y: 0, z: 6.25 },
    linkedBarricade: 'ThirdRoomSouthBarricade',
    roomTarget: roomData.thirdRoom.sceneName,
    roomName: roomData.thirdRoom.name,
    requiredDoorId: 'door-to-third-room',
    isActive: false,
  },
  {
    id: 'spawn-fourth-room-east',
    name: 'FourthRoomEastExteriorSpawn',
    position: { x: 25.25, y: 0, z: -17 },
    linkedBarricade: 'FourthRoomEastBarricade',
    roomTarget: roomData.fourthRoom.sceneName,
    roomName: roomData.fourthRoom.name,
    requiredDoorId: 'door-to-fourth-room',
    isActive: false,
  },
  {
    id: 'spawn-fourth-room-north',
    name: 'FourthRoomNorthExteriorSpawn',
    position: { x: 19, y: 0, z: -26.25 },
    linkedBarricade: 'FourthRoomNorthBarricade',
    roomTarget: roomData.fourthRoom.sceneName,
    roomName: roomData.fourthRoom.name,
    requiredDoorId: 'door-to-fourth-room',
    isActive: false,
  },
]
