export * from './v4.1'

export type InlineSetter = number | [left: number, right: number]
export type BlockSetter = number | [top: number, bottom: number]
export type AllSetter = number | [top: number, right: number, bottom?: number, left?: number]

export type BorderEdgeParamsGen<T1, T2, T3, T4> = number | [width?: T1, style?: T2, color?: T3, fill?: T4]
export type GetSet<Get, Set> = Get