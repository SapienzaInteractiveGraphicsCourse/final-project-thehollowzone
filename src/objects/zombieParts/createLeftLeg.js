import * as THREE from 'three'

import { createPartMesh } from './createPartMesh.js'

export function createLeftLeg(materials) {
  // Hip rotates the full leg, while the knee only rotates the lower section.
  const leftLeg = new THREE.Group()
  leftLeg.name = 'LeftLeg'
  leftLeg.position.set(-0.2, 0.9, 0)
  leftLeg.rotation.z = 0.06
  leftLeg.rotation.x = -0.08

  const leftUpperLeg = createPartMesh(
    'LeftUpperLeg',
    new THREE.CylinderGeometry(0.14, 0.115, 0.38, 6),
    materials.pants,
    { x: 0, y: -0.2, z: 0 },
  )

  const leftKnee = new THREE.Group()
  leftKnee.name = 'LeftKnee'
  leftKnee.position.set(0, -0.39, 0)
  leftKnee.rotation.x = 0.14

  const kneeJoint = createPartMesh(
    'LeftKneeJoint',
    new THREE.SphereGeometry(0.115, 7, 5),
    materials.tornShirt,
    { x: 0, y: 0, z: 0 },
  )
  const leftLowerLeg = createPartMesh(
    'LeftLowerLeg',
    new THREE.CylinderGeometry(0.112, 0.085, 0.37, 6),
    materials.pants,
    { x: 0, y: -0.2, z: 0 },
  )

  const leftFoot = new THREE.Group()
  leftFoot.name = 'LeftFoot'
  leftFoot.position.set(0, -0.43, -0.08)

  const shoe = createPartMesh(
    'LeftShoe',
    new THREE.BoxGeometry(0.27, 0.16, 0.46),
    materials.shoes,
    { x: 0, y: 0, z: -0.08 },
  )
  shoe.rotation.x = -0.04
  const sole = createPartMesh(
    'LeftShoeSole',
    new THREE.BoxGeometry(0.285, 0.045, 0.48),
    materials.belt,
    { x: 0, y: -0.095, z: -0.08 },
  )
  const exposedAnkle = createPartMesh(
    'LeftExposedAnkle',
    new THREE.CylinderGeometry(0.075, 0.08, 0.1, 6),
    materials.damagedSkin,
    { x: 0, y: 0.08, z: 0.08 },
  )
  leftFoot.add(shoe, sole, exposedAnkle)

  leftKnee.add(kneeJoint, leftLowerLeg, leftFoot)
  leftLeg.add(leftUpperLeg, leftKnee)

  return {
    leftLeg,
    leftLegMesh: leftUpperLeg,
    leftUpperLeg,
    leftKnee,
    leftLowerLeg,
    leftFoot,
    sole,
    exposedAnkle,
  }
}
