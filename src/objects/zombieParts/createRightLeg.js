import * as THREE from 'three'

import { createPartMesh } from './createPartMesh.js'

export function createRightLeg(materials) {
  // Uneven position and knee bend make the stance feel less symmetrical.
  const rightLeg = new THREE.Group()
  rightLeg.name = 'RightLeg'
  rightLeg.position.set(0.21, 0.9, 0.035)
  rightLeg.rotation.z = -0.075
  rightLeg.rotation.x = 0.12

  const rightUpperLeg = createPartMesh(
    'RightUpperLeg',
    new THREE.CylinderGeometry(0.145, 0.118, 0.39, 6),
    materials.pants,
    { x: 0, y: -0.205, z: 0 },
  )

  const rightKnee = new THREE.Group()
  rightKnee.name = 'RightKnee'
  rightKnee.position.set(0, -0.4, 0)
  rightKnee.rotation.x = -0.18

  const kneeJoint = createPartMesh(
    'RightKneeJoint',
    new THREE.SphereGeometry(0.112, 7, 5),
    materials.damagedSkin,
    { x: 0, y: 0, z: 0 },
  )
  const rightLowerLeg = createPartMesh(
    'RightLowerLeg',
    new THREE.CylinderGeometry(0.112, 0.084, 0.38, 6),
    materials.pants,
    { x: 0, y: -0.205, z: 0 },
  )

  const shinWound = createPartMesh(
    'RightShinWound',
    new THREE.SphereGeometry(0.07, 6, 5),
    materials.blood,
    { x: 0.075, y: -0.2, z: -0.015 },
  )
  shinWound.scale.set(0.2, 0.85, 0.65)

  const rightFoot = new THREE.Group()
  rightFoot.name = 'RightFoot'
  rightFoot.position.set(0, -0.44, -0.09)
  rightFoot.rotation.y = -0.12

  const shoe = createPartMesh(
    'RightShoe',
    new THREE.BoxGeometry(0.28, 0.16, 0.48),
    materials.shoes,
    { x: 0, y: 0, z: -0.08 },
  )
  const sole = createPartMesh(
    'RightShoeSole',
    new THREE.BoxGeometry(0.295, 0.045, 0.5),
    materials.belt,
    { x: 0, y: -0.095, z: -0.08 },
  )
  const tornToe = createPartMesh(
    'RightTornShoeToe',
    new THREE.SphereGeometry(0.08, 6, 5),
    materials.damagedSkin,
    { x: 0.025, y: 0.015, z: -0.31 },
  )
  tornToe.scale.set(0.9, 0.55, 0.35)
  rightFoot.add(shoe, sole, tornToe)

  rightKnee.add(kneeJoint, rightLowerLeg, shinWound, rightFoot)
  rightLeg.add(rightUpperLeg, rightKnee)

  return {
    rightLeg,
    rightLegMesh: rightUpperLeg,
    rightUpperLeg,
    rightKnee,
    rightLowerLeg,
    rightFoot,
    shinWound,
    sole,
    tornToe,
  }
}
