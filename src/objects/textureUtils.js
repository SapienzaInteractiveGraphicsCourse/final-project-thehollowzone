import * as THREE from 'three'

const textureLoader = new THREE.TextureLoader()
const textureCache = new Map()

// The cache key includes settings that change the texture itself. This lets
// different meshes reuse one GPU texture without accidentally changing repeats.
export function loadSharedTexture({
  path,
  isColorTexture = false,
  repeat = { x: 1, y: 1 },
  wrap = false,
  channel = 0,
}) {
  if (!path) return null

  const cacheKey = [
    path,
    isColorTexture,
    repeat.x,
    repeat.y,
    wrap,
    channel,
  ].join('|')

  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)
  }

  const texture = textureLoader.load(path)
  texture.channel = channel
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.magFilter = THREE.LinearFilter

  if (wrap) {
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(repeat.x, repeat.y)
  }

  // Color images use sRGB, while normal, roughness, and AO maps stay linear.
  // Without this difference, colors look washed out and surface data is wrong.
  if (isColorTexture) {
    texture.colorSpace = THREE.SRGBColorSpace
  }

  textureCache.set(cacheKey, texture)
  return texture
}
