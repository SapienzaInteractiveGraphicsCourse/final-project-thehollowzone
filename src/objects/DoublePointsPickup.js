import * as THREE from 'three'

function createLabel() {
  if (typeof document === 'undefined') {
    const label = new THREE.Sprite(new THREE.SpriteMaterial())
    label.name = 'DoublePointsLabel'
    label.position.y = 0.9
    label.scale.set(1.25, 0.42, 1)
    return label
  }

  const canvas = document.createElement('canvas')
  canvas.width = 384
  canvas.height = 128
  const context = canvas.getContext('2d')
  context.fillStyle = 'rgba(18, 11, 3, 0.9)'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.strokeStyle = '#ffad33'
  context.lineWidth = 8
  context.strokeRect(5, 5, canvas.width - 10, canvas.height - 10)
  context.fillStyle = '#fff2c7'
  context.font = '800 72px monospace'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText('2X', canvas.width / 2, canvas.height / 2)

  const label = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(canvas),
      transparent: true,
      depthWrite: false,
    }),
  )
  label.name = 'DoublePointsLabel'
  label.position.y = 0.9
  label.scale.set(1.25, 0.42, 1)
  return label
}

export function createDoublePointsPickup(data) {
  const group = new THREE.Group()
  group.name = `DoublePointsPickup_${data.id}`
  group.position.set(data.position.x, data.position.y, data.position.z)

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0x251b12,
    metalness: 0.7,
    roughness: 0.42,
  })
  const accentMaterial = new THREE.MeshStandardMaterial({
    color: 0xffad33,
    emissive: 0x8b3f00,
    emissiveIntensity: 1.2,
    metalness: 0.45,
    roughness: 0.26,
  })
  const core = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.34, 0.22, 12),
    bodyMaterial,
  )
  core.rotation.x = Math.PI / 2
  const symbol = new THREE.Mesh(
    new THREE.TorusGeometry(0.42, 0.055, 8, 28),
    accentMaterial,
  )
  const marker = new THREE.Mesh(
    new THREE.TorusGeometry(0.55, 0.03, 8, 32),
    accentMaterial,
  )
  marker.position.y = -0.25
  marker.rotation.x = Math.PI / 2

  group.add(core, symbol, marker, createLabel())
  group.traverse((object) => {
    if (!object.isMesh) return
    object.castShadow = object !== marker
    object.receiveShadow = true
  })
  group.userData.powerUpPickup = {
    id: data.id,
    type: 'double-points',
    room: null,
    isPermanent: false,
    isCollected: false,
    lifetimeRemaining: data.lifetime,
  }
  group.userData.baseY = group.position.y
  group.userData.marker = marker
  group.userData.accentMaterial = accentMaterial
  return group
}
