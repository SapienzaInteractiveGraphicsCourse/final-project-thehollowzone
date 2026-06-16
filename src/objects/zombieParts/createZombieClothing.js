import * as THREE from 'three'

import { createPartMesh } from './createPartMesh.js'

export function createZombieClothing(materials) {
  // Shoulder cloth overlaps the arm joints like short torn sleeves.
  const leftShoulderCloth = createPartMesh(
    'LeftShoulderCloth',
    new THREE.CylinderGeometry(0.15, 0.13, 0.2, 6, 1, true),
    materials.shirt,
    { x: -0.38, y: 1.49, z: 0 },
  )
  leftShoulderCloth.rotation.z = -0.12
  leftShoulderCloth.rotation.x = -0.08

  const rightShoulderCloth = createPartMesh(
    'RightShoulderCloth',
    new THREE.CylinderGeometry(0.15, 0.125, 0.15, 6, 1, true),
    materials.tornShirt,
    { x: 0.38, y: 1.5, z: 0 },
  )
  rightShoulderCloth.rotation.z = 0.12
  rightShoulderCloth.rotation.x = -0.14

  // The pelvis connects the torso and legs and gives the pants a real waist.
  const waist = createPartMesh(
    'PantsWaist',
    new THREE.CylinderGeometry(0.3, 0.27, 0.25, 7),
    materials.pants,
    { x: 0, y: 0.88, z: 0 },
  )
  waist.scale.z = 0.75

  const belt = createPartMesh(
    'DamagedBelt',
    new THREE.TorusGeometry(0.292, 0.025, 4, 7),
    materials.belt,
    { x: 0, y: 0.98, z: 0 },
  )
  belt.rotation.x = Math.PI / 2
  belt.scale.z = 0.75

  const beltBuckle = createPartMesh(
    'RustedBeltBuckle',
    new THREE.BoxGeometry(0.11, 0.085, 0.035),
    materials.metal,
    { x: 0.03, y: 0.98, z: -0.225 },
  )
  beltBuckle.rotation.z = -0.1

  const backShirtStrip = createPartMesh(
    'BackShirtStrip',
    new THREE.BoxGeometry(0.16, 0.24, 0.025),
    materials.tornShirt,
    { x: 0.14, y: 0.89, z: 0.225 },
  )
  backShirtStrip.rotation.z = -0.22

  return {
    leftShoulderCloth,
    rightShoulderCloth,
    waist,
    belt,
    beltBuckle,
    backShirtStrip,
  }
}
