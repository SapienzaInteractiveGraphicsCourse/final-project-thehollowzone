import * as THREE from 'three'

import { createPartMesh } from './createPartMesh.js'

export function createZombieHead(materials) {
  // Head is the neck pivot, while jaw is another child pivot below it.
  const head = new THREE.Group()
  head.name = 'Head'
  head.position.set(0.02, 1.88, -0.03)
  head.rotation.z = 0.04
  head.rotation.x = -0.03

  const headMesh = createPartMesh(
    'HeadMesh',
    new THREE.SphereGeometry(0.31, 9, 7),
    materials.skin,
    { x: 0, y: 0.015, z: 0 },
  )
  headMesh.scale.set(0.9, 1, 0.88)

  const neck = createPartMesh(
    'Neck',
    new THREE.CylinderGeometry(0.14, 0.17, 0.28, 7),
    materials.damagedSkin,
    { x: -0.015, y: -0.29, z: 0.035 },
  )
  neck.rotation.z = -0.03

  // Layered facial shapes make the expression readable under low arena light.
  const leftCheek = createPartMesh(
    'LeftCheek',
    new THREE.SphereGeometry(0.12, 7, 5),
    materials.damagedSkin,
    { x: -0.18, y: -0.055, z: -0.13 },
  )
  leftCheek.scale.set(0.65, 1, 0.62)

  const nose = createPartMesh(
    'BrokenNose',
    new THREE.ConeGeometry(0.055, 0.16, 5),
    materials.damagedSkin,
    { x: 0.015, y: 0.015, z: -0.292 },
  )
  nose.rotation.x = -Math.PI / 2
  nose.rotation.z = 0.12

  const leftBrow = createPartMesh(
    'LeftBrow',
    new THREE.BoxGeometry(0.13, 0.035, 0.04),
    materials.damagedSkin,
    { x: -0.105, y: 0.145, z: -0.245 },
  )
  leftBrow.rotation.z = -0.18

  const rightBrow = createPartMesh(
    'RightBrow',
    new THREE.BoxGeometry(0.12, 0.035, 0.04),
    materials.damagedSkin,
    { x: 0.11, y: 0.125, z: -0.245 },
  )
  rightBrow.rotation.z = 0.25

  const leftEar = createPartMesh(
    'LeftEar',
    new THREE.SphereGeometry(0.065, 6, 5),
    materials.skin,
    { x: -0.285, y: 0.02, z: -0.015 },
  )
  leftEar.scale.set(0.42, 1, 0.62)

  const damagedRightEar = createPartMesh(
    'DamagedRightEar',
    new THREE.SphereGeometry(0.06, 6, 5),
    materials.blood,
    { x: 0.27, y: 0.015, z: -0.02 },
  )
  damagedRightEar.scale.set(0.25, 0.72, 0.5)

  const leftEye = createPartMesh(
    'LeftEye',
    new THREE.SphereGeometry(0.047, 7, 5),
    materials.eyes,
    { x: -0.105, y: 0.075, z: -0.264 },
  )
  const rightEye = createPartMesh(
    'RightEye',
    new THREE.SphereGeometry(0.043, 7, 5),
    materials.eyes,
    { x: 0.105, y: 0.05, z: -0.264 },
  )
  rightEye.scale.set(0.7, 1, 0.7)


  // The jaw parent controls the mouth position.
  const jaw = new THREE.Group()
  jaw.name = 'Jaw'
  jaw.position.set(0.01, -0.08, -0.11)
  jaw.rotation.x = 0.04
  jaw.rotation.z = -0.02

  const jawMesh = createPartMesh(
    'JawMesh',
    new THREE.SphereGeometry(0.19, 8, 6),
    materials.damagedSkin,
    { x: 0, y: 0, z: 0 },
  )
  jawMesh.scale.set(0.82, 0.55, 0.72)

  const mouth = createPartMesh(
    'Mouth',
    new THREE.SphereGeometry(0.1, 8, 5),
    materials.mouth,
    { x: 0.005, y: -0.012, z: -0.137 },
  )
  mouth.scale.set(1, 0.28, 0.18)

  const toothPositions = [-0.065, -0.018, 0.035, 0.075]
  const teeth = toothPositions.map((x, index) => {
    const tooth = createPartMesh(
      `ExposedTooth${index + 1}`,
      new THREE.ConeGeometry(0.012, 0.036 + (index % 2) * 0.008, 4),
      materials.bone,
      { x, y: -0.018, z: -0.15 },
    )
    tooth.rotation.z = Math.PI
    return tooth
  })

  const templeWound = createPartMesh(
    'TempleWound',
    new THREE.SphereGeometry(0.09, 7, 5),
    materials.blood,
    { x: 0.245, y: 0.08, z: -0.08 },
  )
  templeWound.scale.set(0.2, 0.8, 0.75)

  const scalpWound = createPartMesh(
    'ScalpWound',
    new THREE.SphereGeometry(0.12, 7, 5),
    materials.blood,
    { x: -0.095, y: 0.265, z: -0.12 },
  )
  scalpWound.scale.set(0.85, 0.22, 0.65)

  // Facial details are separate meshes so they can share the head pivot.
  jaw.add(jawMesh, mouth, ...teeth)
  head.add(
    neck,
    headMesh,
    leftCheek,
    nose,
    leftBrow,
    rightBrow,
    leftEar,
    damagedRightEar,
    leftEye,
    rightEye,
    jaw,
    templeWound,
    scalpWound,
  )

  return {
    head,
    neck,
    headMesh,
    leftEye,
    rightEye,
    jaw,
    jawMesh,
    mouth,
    exposedTooth: teeth[0],
    teeth,
    templeWound,
    scalpWound,
  }
}
