import * as THREE from 'three'

import { createPartMesh } from './createPartMesh.js'

export function createRightArm(materials) {
  // The shoulder hangs close to the torso while the elbow bends forward.
  const rightArm = new THREE.Group()
  rightArm.name = 'RightArm'
  rightArm.position.set(0.38, 1.52, 0)
  rightArm.rotation.x = -0.14
  rightArm.rotation.z = 0.12

  const shoulder = createPartMesh(
    'RightShoulderJoint',
    new THREE.SphereGeometry(0.14, 7, 5),
    materials.skin,
    { x: 0, y: -0.03, z: 0 },
  )
  const upperArm = createPartMesh(
    'RightUpperArm',
    new THREE.CylinderGeometry(0.11, 0.087, 0.39, 6),
    materials.skin,
    { x: 0, y: -0.21, z: 0 },
  )

  const rightElbow = new THREE.Group()
  rightElbow.name = 'RightElbow'
  rightElbow.position.set(0, -0.4, 0)
  rightElbow.rotation.x = 0.42
  rightElbow.rotation.z = 0.06

  const elbowJoint = createPartMesh(
    'RightElbowJoint',
    new THREE.SphereGeometry(0.09, 7, 5),
    materials.damagedSkin,
    { x: 0, y: 0, z: 0 },
  )
  const rightForearm = createPartMesh(
    'RightForearm',
    new THREE.CylinderGeometry(0.09, 0.067, 0.4, 6),
    materials.damagedSkin,
    { x: 0, y: -0.2, z: 0.01 },
  )

  const armWound = createPartMesh(
    'RightArmWound',
    new THREE.SphereGeometry(0.075, 6, 5),
    materials.blood,
    { x: 0.072, y: -0.18, z: -0.005 },
  )
  armWound.scale.set(0.18, 0.85, 0.7)

  const rightHand = new THREE.Group()
  rightHand.name = 'RightHand'
  rightHand.position.set(0, -0.42, 0.02)
  rightHand.rotation.z = 0.08

  const palm = createPartMesh(
    'RightPalm',
    new THREE.SphereGeometry(0.105, 10, 8),
    materials.damagedSkin,
    { x: 0, y: -0.04, z: 0 },
  )
  palm.scale.set(0.82, 1.05, 0.5)

  const fingerA = createPartMesh(
    'RightFingerA',
    new THREE.CapsuleGeometry(0.016, 0.11, 4, 7),
    materials.damagedSkin,
    { x: -0.048, y: -0.158, z: -0.01 },
  )
  const fingerB = createPartMesh(
    'RightFingerB',
    new THREE.CapsuleGeometry(0.017, 0.125, 4, 7),
    materials.skin,
    { x: 0.005, y: -0.17, z: -0.018 },
  )
  const fingerC = createPartMesh(
    'RightFingerC',
    new THREE.CapsuleGeometry(0.015, 0.095, 4, 7),
    materials.damagedSkin,
    { x: 0.055, y: -0.15, z: -0.006 },
  )
  const thumb = createPartMesh(
    'RightThumb',
    new THREE.CapsuleGeometry(0.018, 0.075, 4, 7),
    materials.damagedSkin,
    { x: 0.096, y: -0.075, z: -0.01 },
  )
  thumb.rotation.z = 0.82
  thumb.rotation.x = 0.15

  fingerA.rotation.x = 0.08
  fingerB.rotation.x = 0.1
  fingerC.rotation.x = 0.12

  const exposedKnuckle = createPartMesh(
    'RightExposedKnuckle',
    new THREE.SphereGeometry(0.027, 5, 4),
    materials.bone,
    { x: -0.045, y: -0.095, z: -0.052 },
  )

  rightHand.add(palm, fingerA, fingerB, fingerC, thumb, exposedKnuckle)

  rightElbow.add(elbowJoint, rightForearm, armWound, rightHand)
  rightArm.add(shoulder, upperArm, rightElbow)

  return {
    rightArm,
    rightArmMesh: upperArm,
    rightUpperArm: upperArm,
    rightElbow,
    rightForearm,
    rightHand,
    palm,
    fingers: [fingerA, fingerB, fingerC],
    armWound,
    thumb,
    exposedKnuckle,
  }
}
