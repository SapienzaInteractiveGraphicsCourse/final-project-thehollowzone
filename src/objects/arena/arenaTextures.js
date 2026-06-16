import * as THREE from 'three'

import { loadSharedTexture } from '../textureUtils.js'

const texturePaths = {
  floor: {
    color: '/textures/arenaTextures/ConcreteFloor/Concrete044C_1K-JPG_Color.jpg',
    normal: '/textures/arenaTextures/ConcreteFloor/Concrete044C_1K-JPG_NormalGL.jpg',
    roughness: '/textures/arenaTextures/ConcreteFloor/Concrete044C_1K-JPG_Roughness.jpg',
  },
  wall: {
    color: '/textures/arenaTextures/TheWalls/Asphalt026C_1K-JPG_Color.jpg',
    normal: '/textures/arenaTextures/TheWalls/Asphalt026C_1K-JPG_NormalGL.jpg',
    roughness: '/textures/arenaTextures/TheWalls/Asphalt026C_1K-JPG_Roughness.jpg',
  },
  barricade: {
    color: '/textures/arenaTextures/BarricadeWood/WoodFloor051_1K-JPG_Color.jpg',
    normal: '/textures/arenaTextures/BarricadeWood/WoodFloor051_1K-JPG_NormalGL.jpg',
    roughness: '/textures/arenaTextures/BarricadeWood/WoodFloor051_1K-JPG_Roughness.jpg',
  },
  crate: {
    color: '/textures/arenaTextures/Crates-Boxes/PaintedWood005_1K-JPG_Color.jpg',
    normal: '/textures/arenaTextures/Crates-Boxes/PaintedWood005_1K-JPG_NormalGL.jpg',
    roughness: '/textures/arenaTextures/Crates-Boxes/PaintedWood005_1K-JPG_Roughness.jpg',
  },
}

function createTexturedMaterial({
  name,
  paths,
  repeat,
  color,
  roughness = 1,
  normalScale = 1,
}) {
  // Color maps are visible paint, while normal and roughness maps only change
  // how light reacts to the surface. All room meshes reuse these materials.
  const material = new THREE.MeshStandardMaterial({
    color,
    map: loadSharedTexture({
      path: paths.color,
      repeat,
      wrap: true,
      isColorTexture: true,
    }),
    normalMap: loadSharedTexture({ path: paths.normal, repeat, wrap: true }),
    roughnessMap: loadSharedTexture({
      path: paths.roughness,
      repeat,
      wrap: true,
    }),
    roughness,
    normalScale: new THREE.Vector2(normalScale, normalScale),
  })
  material.name = name
  return material
}

export function createArenaMaterials() {
  const floorMaterial = createTexturedMaterial({
    name: 'ArenaConcreteFloorMaterial',
    paths: texturePaths.floor,
    repeat: { x: 4, y: 4 },
    color: 0x77736b,
    roughness: 0.95,
    normalScale: 0.75,
  })

  const wallMaterial = createTexturedMaterial({
    name: 'ArenaWallMaterial',
    paths: texturePaths.wall,
    repeat: { x: 1.25, y: 1 },
    color: 0x828487,
    roughness: 0.94,
    normalScale: 0.32,
  })

  const interiorWallMaterial = wallMaterial.clone()
  interiorWallMaterial.name = 'ArenaInteriorWallMaterial'
  interiorWallMaterial.color.setHex(0x5f6468)

  const crateMaterial = createTexturedMaterial({
    name: 'ArenaCrateMaterial',
    paths: texturePaths.crate,
    repeat: { x: 1.5, y: 1.5 },
    color: 0x8b684f,
    roughness: 0.9,
    normalScale: 0.7,
  })

  const plankMaterial = createTexturedMaterial({
    name: 'ArenaBarricadeWoodMaterial',
    paths: texturePaths.barricade,
    repeat: { x: 2, y: 1 },
    color: 0x95633f,
    roughness: 0.9,
    normalScale: 0.85,
  })

  return {
    firstRoomFloor: floorMaterial,
    secondRoomFloor: floorMaterial,
    connectorFloor: floorMaterial,
    thirdRoomFloor: floorMaterial,
    fourthRoomFloor: floorMaterial,
    extractionRoomFloor: floorMaterial,
    wall: wallMaterial,
    interiorWall: interiorWallMaterial,
    prop: crateMaterial,
    plank: plankMaterial,
    exteriorFloor: floorMaterial,
    door: new THREE.MeshStandardMaterial({
      name: 'LockedDoorMaterial',
      color: 0x5c1717,
      roughness: 0.82,
    }),
    doorMarker: new THREE.MeshStandardMaterial({
      name: 'DoorBuyPanelMaterial',
      color: 0xd19a2a,
      roughness: 0.72,
    }),
    endGame: new THREE.MeshStandardMaterial({
      name: 'EndGameMarkerMaterial',
      color: 0x3ecf8e,
      emissive: 0x123d2d,
      emissiveIntensity: 1.5,
    }),
    fog: new THREE.MeshBasicMaterial({
      name: 'RoomFogMaterial',
      color: 0x79818c,
      transparent: true,
      opacity: 0.075,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  }
}
