import * as THREE from 'three'

import { loadSharedTexture } from '../textureUtils.js'

const decalGeometry = new THREE.PlaneGeometry(1, 1)

const decalTexturePaths = {
  splatter: '/textures/decals/bloodsplatter.webp',
  darkPool: '/textures/decals/stain3-dark.webp',
  cloud: '/textures/decals/stains.png',
  droplets: '/textures/decals/stains2.webp',
  smallSpatter: '/textures/decals/stains5.png',
  mist: '/textures/decals/stains6.png',
}

// Arena blood stays on floors and solid props. Keeping decals away from walls
const decalPlacements = [
  { name: 'FirstRoomFloorTrail', texture: 'droplets', position: [-14.7, 0.012, 11.1], size: [2.25, 1.7], rotation: [-Math.PI / 2, 0, 0.55] },
  { name: 'FirstRoomCrateSpatter', texture: 'smallSpatter', position: [-18, 0.75, 9.656], size: [0.9, 0.72], rotation: [0, 0, 0.18] },

  { name: 'SecondRoomWestCrateBlood', texture: 'splatter', position: [-8, 0.82, 8.706], size: [1.05, 0.82], rotation: [0, 0, -0.18] },
  { name: 'SecondRoomFloorPool', texture: 'darkPool', position: [-5.1, 0.012, 12.7], size: [2.8, 2.2], rotation: [-Math.PI / 2, 0, -0.48] },
  { name: 'SecondRoomBarrierCloud', texture: 'cloud', position: [-3.35, 0.58, 10.594], size: [1.4, 0.9], rotation: [0, 0, 0.1] },

  { name: 'ConnectorFloorDroplets', texture: 'droplets', position: [2.2, 0.012, -1.2], size: [2.1, 1.55], rotation: [-Math.PI / 2, 0, 0.25] },

  { name: 'ThirdRoomFloorSplatter', texture: 'splatter', position: [14.2, 0.012, -1.4], size: [2.8, 2.1], rotation: [-Math.PI / 2, 0, 0.35] },
  { name: 'ThirdRoomSouthEastCrateBlood', texture: 'smallSpatter', position: [20, 0.72, 1.806], size: [1.08, 0.9], rotation: [0, 0, 0.12] },
  { name: 'ThirdRoomCenterFloorCloud', texture: 'cloud', position: [17.6, 0.013, -7.7], size: [2.2, 1.65], rotation: [-Math.PI / 2, 0, -0.62] },

  { name: 'FourthRoomFloorDarkPool', texture: 'darkPool', position: [17.8, 0.012, -16.4], size: [3.1, 2.45], rotation: [-Math.PI / 2, 0, -0.22] },
  { name: 'FourthRoomNorthCrateSpatter', texture: 'smallSpatter', position: [20, 0.74, -14.344], size: [1, 0.82], rotation: [0, 0, -0.16] },

  { name: 'ExtractionRoomFloorSplatter', texture: 'splatter', position: [7.7, 0.012, -20.8], size: [2.4, 1.8], rotation: [-Math.PI / 2, 0, -0.3] },
  { name: 'ExtractionRoomFloorMist', texture: 'mist', position: [3.1, 0.013, -18.2], size: [1.8, 1.45], rotation: [-Math.PI / 2, 0, 0.4] },
]

function createDecalMaterials() {
  return Object.fromEntries(
    Object.entries(decalTexturePaths).map(([key, path]) => {
      const material = new THREE.MeshBasicMaterial({
        map: loadSharedTexture({ path, isColorTexture: true }),
        transparent: true,
        opacity: key === 'darkPool' ? 0.62 : 0.74,
        alphaTest: 0.025,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        side: THREE.DoubleSide,
      })
      material.name = `ArenaBlood_${key}Material`
      return [key, material]
    }),
  )
}

function createBloodDecal(placement, materials) {
  const decal = new THREE.Mesh(decalGeometry, materials[placement.texture])
  decal.name = placement.name
  decal.position.fromArray(placement.position)
  decal.rotation.fromArray(placement.rotation)
  decal.scale.set(placement.size[0], placement.size[1], 1)
  decal.renderOrder = 2
  return decal
}

export function createArenaBloodDecals() {
  const decals = new THREE.Group()
  decals.name = 'ArenaBloodDecals'

  // The table varies placement while every repeated image shares one material.
  const materials = createDecalMaterials()
  decals.add(...decalPlacements.map((item) => createBloodDecal(item, materials)))
  return decals
}
