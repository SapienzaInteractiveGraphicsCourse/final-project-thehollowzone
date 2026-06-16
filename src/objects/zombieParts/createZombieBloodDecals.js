import * as THREE from 'three'

import { loadSharedTexture } from '../textureUtils.js'

const decalGeometry = new THREE.PlaneGeometry(1, 1)

function createZombieDecal({
  name,
  texturePath,
  position,
  size,
  rotation = {},
  opacity = 0.82,
}) {
  const texture = loadSharedTexture({
    path: texturePath,
    isColorTexture: true,
  })
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity,
    alphaTest: 0.03,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -3,
    side: THREE.DoubleSide,
  })
  material.name = `${name}Material`

  const decal = new THREE.Mesh(decalGeometry, material)
  decal.name = name
  decal.position.set(position.x, position.y, position.z)
  decal.rotation.set(rotation.x ?? 0, rotation.y ?? 0, rotation.z ?? 0)
  decal.scale.set(size.x, size.y, 1)
  decal.renderOrder = 3
  decal.castShadow = false
  decal.receiveShadow = false
  return decal
}

// These planes belong to body-part pivots, so blood follows animated limbs.
export function addZombieBloodDecals({ torso, head, rightElbow, rightKnee }) {
  torso.add(
    createZombieDecal({
      name: 'ZombieShirtBloodSmear',
      texturePath: '/textures/decals/stains4.png',
      position: { x: 0.12, y: -0.06, z: -0.292 },
      size: { x: 0.38, y: 0.34 },
      rotation: { z: -0.22 },
      opacity: 0.72,
    }),
  )

  head.add(
    createZombieDecal({
      name: 'ZombieFaceBloodSpatter',
      texturePath: '/textures/decals/stains5.png',
      position: { x: 0.07, y: 0.07, z: -0.292 },
      size: { x: 0.25, y: 0.21 },
      rotation: { z: 0.28 },
      opacity: 0.78,
    }),
  )

  rightElbow.add(
    createZombieDecal({
      name: 'ZombieForearmBloodTrail',
      texturePath: '/textures/decals/stains2.webp',
      position: { x: 0, y: -0.22, z: -0.071 },
      size: { x: 0.15, y: 0.3 },
      rotation: { z: -0.15 },
      opacity: 0.7,
    }),
  )

  rightKnee.add(
    createZombieDecal({
      name: 'ZombieShinBloodSpatter',
      texturePath: '/textures/decals/stain3-dark.webp',
      position: { x: 0, y: -0.22, z: -0.086 },
      size: { x: 0.18, y: 0.28 },
      rotation: { z: 0.18 },
      opacity: 0.65,
    }),
  )
}
