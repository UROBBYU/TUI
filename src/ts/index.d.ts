export type Dimensions = [/** width */ number, /** height */ number]

//#region events
export type AnyRest = any[]
export type ArrayOf<V> = V extends unknown[] ? V : never
//#endregion
//#region index
export type ColorList = 'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white'
export type BrightColorList = string
export type HexColor = string
export type RGBColor = [/** red */ number, /** green */ number, /** blue */ number]
export type RGBRange = [/** from */ RGBColor, /** to */ RGBColor]

export type TUIEvents = {
    close: [/** hadError */ boolean]
    end: []
    data: [/** data */ Buffer]
    resize: Dimensions
}
//#endregion
//#region Panel
export type MinMax = 'minWidth' | 'minHeight' | 'maxWidth' | 'maxHeight'
export type PropLabel<T> = [/** prop */ T]
//#endregion
//#region MetricBox
export type InlineSetter = number
export type BlockSetter = number
export type AllSetter = number
//#endregion
//#region BorderBox
export type BorderCornerParamsGen<T1, T2> = [/** style */ T1, /** color */ T2?]
export type BorderEdgeParamsGen<T1, T2, T3, T4> = number
export type GetSet<Get, Set> = Get | Set
export type SetGet<Get, Set> = Set | Get
//#endregion