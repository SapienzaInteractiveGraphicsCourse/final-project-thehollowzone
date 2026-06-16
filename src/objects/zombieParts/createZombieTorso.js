import * as THREE from 'three'

import { createPartMesh } from './createPartMesh.js'

export function createZombieTorso(materials) {
  // This group is the chest pivot. Later it can sway without moving the legs.
  const torso = new THREE.Group()
  torso.name = 'Torso'
  torso.position.set(0, 1.3, 0)
  torso.rotation.z = -0.045
  torso.rotation.x = 0.08

  // A 7-sided cylinder gives the body shoulders and a smaller waist.
  // It stays low-poly, but the outline is less box-shaped.
  const torsoMesh = createPartMesh(
    'TorsoMesh',
    new THREE.CylinderGeometry(0.35, 0.29, 0.82, 7),
    materials.damagedSkin,
    { x: 0, y: 0, z: 0 },
  )
  torsoMesh.scale.z = 0.72

  // Clothing is a slightly larger shell over the body instead of painted color.
  const shirtShell = createPartMesh(
    'ShirtShell',
    new THREE.CylinderGeometry(0.385, 0.315, 0.72, 7, 1, true),
    materials.shirt,
    { x: 0, y: 0.04, z: 0 },
  )
  shirtShell.scale.z = 0.74

  const chestWound = createPartMesh(
    'ChestWound',
    new THREE.SphereGeometry(0.105, 7, 5),
    materials.blood,
    { x: -0.13, y: 0.12, z: -0.275 },
  )
  chestWound.scale.set(1.25, 0.7, 0.2)

  const woundCavity = createPartMesh(
    'ChestWoundCavity',
    new THREE.SphereGeometry(0.09, 7, 5),
    materials.mouth,
    { x: -0.13, y: 0.12, z: -0.292 },
  )
  woundCavity.scale.set(1.05, 0.54, 0.12)

  const exposedRibs = [-0.04, 0.02, 0.08].map((y, index) => {
    const rib = createPartMesh(
      `ExposedRib${index + 1}`,
      new THREE.TorusGeometry(0.075 - index * 0.008, 0.012, 4, 7, Math.PI),
      materials.bone,
      { x: -0.13, y: 0.1 + y, z: -0.315 },
    )
    rib.rotation.z = Math.PI / 2
    rib.scale.y = 0.65
    return rib
  })

  torso.add(
    torsoMesh,
    shirtShell,
    woundCavity,
    chestWound,
    ...exposedRibs,
  )
  return {
    torso,
    torsoMesh,
    shirtShell,
    chestWound,
    woundCavity,
    exposedRibs,
  }
}
