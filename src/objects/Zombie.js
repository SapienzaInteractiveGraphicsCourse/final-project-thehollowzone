import * as THREE from 'three'

import { createLeftArm } from './zombieParts/createLeftArm.js'
import { createLeftLeg } from './zombieParts/createLeftLeg.js'
import { createRightArm } from './zombieParts/createRightArm.js'
import { createRightLeg } from './zombieParts/createRightLeg.js'
import { createZombieClothing } from './zombieParts/createZombieClothing.js'
import { addZombieBloodDecals } from './zombieParts/createZombieBloodDecals.js'
import { createZombieHead } from './zombieParts/createZombieHead.js'
import { createZombieMaterials } from './zombieParts/createZombieMaterials.js'
import { createZombieTorso } from './zombieParts/createZombieTorso.js'

function saveBasePose(parts) {
  const animatedPartNames = [
    'body',
    'torso',
    'head',
    'jaw',
    'leftArm',
    'rightArm',
    'leftElbow',
    'rightElbow',
    'leftHand',
    'rightHand',
    'leftFingerA',
    'leftFingerB',
    'leftFingerC',
    'rightFingerA',
    'rightFingerB',
    'rightFingerC',
    'leftThumb',
    'rightThumb',
    'leftLeg',
    'rightLeg',
    'leftKnee',
    'rightKnee',
    'leftFoot',
    'rightFoot',
  ]

  return Object.fromEntries(
    animatedPartNames.map((name) => {
      const part = parts[name]
      return [
        name,
        {
          part,
          position: part.position.clone(),
          rotation: part.rotation.clone(),
        },
      ]
    }),
  )
}

export function createZombie(options = {}) {
  const {
    position = { x: 0, y: 0, z: 0 },
    rotationY = 0,
    scale = 1,
    name = 'ZombieGroup',
    texturePaths = {},
  } = options

  // Moving the parent group moves every body part.
  const group = new THREE.Group()
  group.name = name
  group.position.set(position.x, position.y, position.z)
  group.rotation.y = rotationY
  group.scale.setScalar(scale)

  // The body group keeps the full character hierarchy under one child.
  const body = new THREE.Group()
  body.name = 'Body'
  // A slight lean changes the full silhouette while the feet stay near the floor.
  body.rotation.x = 0.035
  body.position.y = 0.04

  // Texture paths are optional, so the model still works with plain colors.
  const materials = createZombieMaterials(texturePaths)
  const torsoParts = createZombieTorso(materials)
  const headParts = createZombieHead(materials)
  const leftArmParts = createLeftArm(materials)
  const rightArmParts = createRightArm(materials)
  const leftLegParts = createLeftLeg(materials)
  const rightLegParts = createRightLeg(materials)
  const clothingParts = createZombieClothing(materials)

  // Decals are attached after the body parts exist so each stain can follow
  // the correct animation pivot without changing any gameplay references.
  addZombieBloodDecals({
    torso: torsoParts.torso,
    head: headParts.head,
    rightElbow: rightArmParts.rightElbow,
    rightKnee: rightLegParts.rightKnee,
  })

  // Body-part modules are assembled into one hierarchical model.
  body.add(
    torsoParts.torso,
    headParts.head,
    leftArmParts.leftArm,
    rightArmParts.rightArm,
    leftLegParts.leftLeg,
    rightLegParts.rightLeg,
    clothingParts.leftShoulderCloth,
    clothingParts.rightShoulderCloth,
    clothingParts.waist,
    clothingParts.belt,
    clothingParts.beltBuckle,
    clothingParts.backShirtStrip,
  )
  group.add(body)

  // Tiny wounds, teeth, and facial details do not produce useful shadows.
  // Limiting shadow casters avoids redrawing every small mesh for each light.
  const shadowCasterNames = new Set([
    'TorsoMesh',
    'ShirtShell',
    'HeadMesh',
    'JawMesh',
    'LeftUpperArm',
    'LeftForearm',
    'LeftPalm',
    'RightUpperArm',
    'RightForearm',
    'RightPalm',
    'LeftUpperLeg',
    'LeftLowerLeg',
    'LeftShoe',
    'RightUpperLeg',
    'RightLowerLeg',
    'RightShoe',
  ])
  group.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = shadowCasterNames.has(object.name)
    }
  })

  // Animation systems use these references to pose individual body parts.
  const parts = {
    body,
    torso: torsoParts.torso,
    torsoMesh: torsoParts.torsoMesh,
    shirtShell: torsoParts.shirtShell,
    chestWound: torsoParts.chestWound,
    woundCavity: torsoParts.woundCavity,
    exposedRibs: torsoParts.exposedRibs,
    head: headParts.head,
    neck: headParts.neck,
    headMesh: headParts.headMesh,
    leftEye: headParts.leftEye,
    rightEye: headParts.rightEye,
    jaw: headParts.jaw,
    jawMesh: headParts.jawMesh,
    mouth: headParts.mouth,
    exposedTooth: headParts.exposedTooth,
    teeth: headParts.teeth,
    templeWound: headParts.templeWound,
    scalpWound: headParts.scalpWound,
    leftArm: leftArmParts.leftArm,
    leftArmMesh: leftArmParts.leftArmMesh,
    leftUpperArm: leftArmParts.leftUpperArm,
    leftElbow: leftArmParts.leftElbow,
    leftForearm: leftArmParts.leftForearm,
    leftHand: leftArmParts.leftHand,
    leftPalm: leftArmParts.palm,
    leftFingerA: leftArmParts.fingers[0],
    leftFingerB: leftArmParts.fingers[1],
    leftFingerC: leftArmParts.fingers[2],
    leftThumb: leftArmParts.thumb,
    rightArm: rightArmParts.rightArm,
    rightArmMesh: rightArmParts.rightArmMesh,
    rightUpperArm: rightArmParts.rightUpperArm,
    rightElbow: rightArmParts.rightElbow,
    rightForearm: rightArmParts.rightForearm,
    rightHand: rightArmParts.rightHand,
    rightPalm: rightArmParts.palm,
    rightFingerA: rightArmParts.fingers[0],
    rightFingerB: rightArmParts.fingers[1],
    rightFingerC: rightArmParts.fingers[2],
    rightThumb: rightArmParts.thumb,
    leftLeg: leftLegParts.leftLeg,
    leftLegMesh: leftLegParts.leftLegMesh,
    leftUpperLeg: leftLegParts.leftUpperLeg,
    leftKnee: leftLegParts.leftKnee,
    leftLowerLeg: leftLegParts.leftLowerLeg,
    leftFoot: leftLegParts.leftFoot,
    rightLeg: rightLegParts.rightLeg,
    rightLegMesh: rightLegParts.rightLegMesh,
    rightUpperLeg: rightLegParts.rightUpperLeg,
    rightKnee: rightLegParts.rightKnee,
    rightLowerLeg: rightLegParts.rightLowerLeg,
    rightFoot: rightLegParts.rightFoot,
    leftShoulderCloth: clothingParts.leftShoulderCloth,
    rightShoulderCloth: clothingParts.rightShoulderCloth,
    waist: clothingParts.waist,
    belt: clothingParts.belt,
    beltBuckle: clothingParts.beltBuckle,
    backShirtStrip: clothingParts.backShirtStrip,
  }

  const zombie = {
    group,
    parts,
    animationState: 'idle',
    animationTime: 0,
    health: 100,
    maxHealth: 100,
    isDead: false,
    killRewardGiven: false,
    lastHitTime: -Infinity,
    hitFeedback: {
      timer: 0,
      materials: [],
    },
    // Saving the original transforms gives every animation the same clean pose.
    basePose: saveBasePose(parts),
    metadata: {
      type: 'basic-zombie',
      isActive: false,
      canMove: false,
      canAttack: false,
    },
  }

  group.userData.zombie = zombie.metadata
  return zombie
}
