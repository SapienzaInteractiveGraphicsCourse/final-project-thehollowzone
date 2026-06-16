import * as THREE from 'three'

import { createPartMesh } from './createPartMesh.js'

export function createLeftArm(materials) {
  // Shoulder is the main animation pivot for the whole arm.
  const leftArm = new THREE.Group()
  leftArm.name = 'LeftArm'
  leftArm.position.set(-0.38, 1.52, 0)
  leftArm.rotation.z = -0.12
  leftArm.rotation.x = -0.08

  const shoulder = createPartMesh(
    'LeftShoulderJoint',
    new THREE.SphereGeometry(0.135, 7, 5),
    materials.damagedSkin,
    { x: 0, y: -0.03, z: 0 },
  )

  const upperArm = createPartMesh(
    'LeftUpperArm',
    new THREE.CylinderGeometry(0.105, 0.085, 0.37, 6),
    materials.damagedSkin,
    { x: 0, y: -0.2, z: 0 },
  )

  // Elbow is a child pivot, so the forearm can bend independently.
  const leftElbow = new THREE.Group()
  leftElbow.name = 'LeftElbow'
  leftElbow.position.set(0, -0.39, 0)
  leftElbow.rotation.x = 0.28
  leftElbow.rotation.z = -0.05

  const elbowJoint = createPartMesh(
    'LeftElbowJoint',
    new THREE.SphereGeometry(0.09, 7, 5),
    materials.bone,
    { x: 0, y: 0, z: 0 },
  )
  const leftForearm = createPartMesh(
    'LeftForearm',
    new THREE.CylinderGeometry(0.088, 0.065, 0.38, 6),
    materials.skin,
    { x: 0, y: -0.19, z: 0.01 },
  )

  const leftHand = new THREE.Group()
  leftHand.name = 'LeftHand'
  leftHand.position.set(0, -0.4, 0.02)
  leftHand.rotation.z = -0.06

  const palm = createPartMesh(
    'LeftPalm',
    new THREE.SphereGeometry(0.1, 10, 8),
    materials.skin,
    { x: 0, y: -0.04, z: 0 },
  )
  palm.scale.set(0.82, 1.05, 0.5)

  const fingerA = createPartMesh(
    'LeftFingerA',
    new THREE.CapsuleGeometry(0.016, 0.105, 4, 7),
    materials.skin,
    { x: -0.045, y: -0.155, z: -0.012 },
  )
  const fingerB = createPartMesh(
    'LeftFingerB',
    new THREE.CapsuleGeometry(0.017, 0.12, 4, 7),
    materials.skin,
    { x: 0.005, y: -0.165, z: -0.018 },
  )
  const fingerC = createPartMesh(
    'LeftFingerC',
    new THREE.CapsuleGeometry(0.015, 0.09, 4, 7),
    materials.damagedSkin,
    { x: 0.052, y: -0.145, z: -0.006 },
  )
  const thumb = createPartMesh(
    'LeftThumb',
    new THREE.CapsuleGeometry(0.018, 0.07, 4, 7),
    materials.damagedSkin,
    { x: -0.092, y: -0.07, z: -0.012 },
  )
  thumb.rotation.z = -0.8
  thumb.rotation.x = 0.15

  // A slight resting curl keeps the fingers from looking like straight rods.
  fingerA.rotation.x = 0.08
  fingerB.rotation.x = 0.1
  fingerC.rotation.x = 0.12

  const brokenNail = createPartMesh(
    'LeftBrokenNail',
    new THREE.BoxGeometry(0.028, 0.04, 0.012),
    materials.bone,
    { x: 0.052, y: -0.225, z: -0.012 },
  )

  leftHand.add(palm, fingerA, fingerB, fingerC, thumb, brokenNail)

  leftElbow.add(elbowJoint, leftForearm, leftHand)
  leftArm.add(shoulder, upperArm, leftElbow)

  return {
    leftArm,
    leftArmMesh: upperArm,
    leftUpperArm: upperArm,
    leftElbow,
    leftForearm,
    leftHand,
    palm,
    fingers: [fingerA, fingerB, fingerC],
    thumb,
    brokenNail,
  }
}
