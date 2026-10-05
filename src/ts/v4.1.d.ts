export * from './v4.0'

import type { ColorList } from '.'

export type BrightColorList = `bright-${ColorList}`
export type HexColor = `#${string}`

export type MinMax = `${'min' | 'max'}${'Width' | 'Height'}`