export * from '.'

export type Dimensions = [width: number, height: number]

export type AnyRest = [...args: any[]]
export type ArrayOf<V> = V extends unknown[] ? [...V] : never

export type RGBColor = [red: number, green: number, blue: number]
export type RGBRange = [from: RGBColor, to: RGBColor]

export type TUIEvents = {
    close: [hadError: boolean]
    end: []
    data: [data: Buffer]
    resize: Dimensions
}

export type PropLabel<T> = [prop: T]

export type BorderCornerParamsGen<T1, T2> = [style: T1, color?: T2]