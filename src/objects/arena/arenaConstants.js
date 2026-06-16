export const DOOR_WIDTH = 3
export const WALL_HEIGHT = 2.5
export const WALL_THICKNESS = 0.5
export const BARRICADE_WIDTH = 3
export const BARRICADE_HEIGHT = 1.8
export const BARRICADE_Y = 1.3
export const EXTERIOR_FLOOR_SIZE = 4.5
export const DEFAULT_BARRICADE_PLANK_SETTINGS = Object.freeze([
  Object.freeze({
    y: 0.56,
    rotation: 0.07,
    widthMultiplier: 1,
    widthOffset: 0.32,
  }),
  Object.freeze({
    y: 0.02,
    rotation: -0.1,
    widthMultiplier: 1,
    widthOffset: 0.46,
  }),
  Object.freeze({
    y: -0.56,
    rotation: 0.04,
    widthMultiplier: 1,
    widthOffset: 0.26,
  }),
  Object.freeze({
    y: 0,
    rotation: -0.58,
    widthMultiplier: 0.92,
    widthOffset: 0,
  }),
])
