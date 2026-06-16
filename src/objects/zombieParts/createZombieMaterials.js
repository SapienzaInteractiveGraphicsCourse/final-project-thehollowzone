import * as THREE from 'three'

import { loadSharedTexture } from '../textureUtils.js'

function normalizeTextureSet(textureSet) {
  if (!textureSet) return {}
  if (typeof textureSet === 'string') return { color: textureSet }
  return textureSet
}

function createMaterial(
  name,
  settings,
  textureSlot,
  textureSet,
  repeat = { x: 1, y: 1 },
) {
  const paths = normalizeTextureSet(textureSet)
  const material = new THREE.MeshStandardMaterial({
    ...settings,
    map: loadSharedTexture({
      path: paths.color,
      repeat,
      wrap: true,
      isColorTexture: true,
    }),
    normalMap: loadSharedTexture({ path: paths.normal, repeat, wrap: true }),
    roughnessMap: loadSharedTexture({
      path: paths.roughness,
      repeat,
      wrap: true,
    }),
    // Channel 0 lets primitive geometry use its normal UV coordinates for AO.
    aoMap: loadSharedTexture({ path: paths.ao, repeat, wrap: true, channel: 0 }),
  })
  material.name = name

  material.userData.textureSlot = textureSlot
  return material
}

// All body parts share these materials instead of making duplicates.
export function createZombieMaterials(texturePaths = {}) {
  return {
    skin: createMaterial(
      'ZombieSkinMaterial',
      { color: 0x718060, roughness: 0.92 },
      'skin',
      texturePaths.skin,
      { x: 2, y: 2 },
    ),
    damagedSkin: createMaterial(
      'ZombieDamagedSkinMaterial',
      { color: 0x4f5d46, roughness: 1 },
      'damaged-skin',
      texturePaths.damagedSkin ?? texturePaths.skin,
      { x: 2, y: 2 },
    ),
    shirt: createMaterial(
      'ZombieShirtMaterial',
      { color: 0x30383a, roughness: 0.96 },
      'fabric-shirt',
      texturePaths.shirt,
      { x: 2, y: 2 },
    ),
    tornShirt: createMaterial(
      'ZombieTornShirtMaterial',
      { color: 0x4b2d2b, roughness: 1 },
      'fabric-torn-shirt',
      texturePaths.tornShirt ?? texturePaths.shirt,
      { x: 2, y: 2 },
    ),
    pants: createMaterial(
      'ZombiePantsMaterial',
      { color: 0x24282f, roughness: 1 },
      'fabric-pants',
      texturePaths.pants,
      { x: 2, y: 2 },
    ),
    shoes: createMaterial(
      'ZombieShoesMaterial',
      { color: 0x151619, roughness: 0.88 },
      'shoes',
      texturePaths.shoes,
    ),
    belt: createMaterial(
      'ZombieBeltMaterial',
      { color: 0x24140e, roughness: 0.9 },
      'worn-leather',
      texturePaths.belt ?? texturePaths.shoes,
    ),
    metal: createMaterial(
      'ZombieMetalMaterial',
      { color: 0x57564f, metalness: 0.72, roughness: 0.68 },
      'rusted-metal',
      texturePaths.metal,
    ),
    blood: createMaterial(
      'ZombieBloodMaterial',
      { color: 0x4e0808, roughness: 0.62 },
      'blood',
      texturePaths.blood,
    ),
    bone: createMaterial(
      'ZombieBoneMaterial',
      { color: 0xc2b994, roughness: 0.85 },
      'bone',
      texturePaths.bone,
    ),
    mouth: createMaterial(
      'ZombieMouthMaterial',
      { color: 0x180607, roughness: 0.82 },
      'mouth',
      texturePaths.mouth ?? texturePaths.blood,
    ),
    eyes: createMaterial(
      'ZombieEyeMaterial',
      {
        color: 0x8d1111,
        emissive: 0x420000,
        emissiveIntensity: 1.5,
      },
      'eyes',
      texturePaths.eyes,
    ),
  }
}
