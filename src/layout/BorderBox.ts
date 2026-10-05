import ExtendedEventEmitter from '../events'
import { BorderFill, BorderStyle } from './Panel'
import { Color } from '..'
import { BorderCornerParamsGen, BorderEdgeParamsGen, GetSet, SetGet } from '@urobbyu/tui/ts'

type BorderCornerParams = BorderCornerParamsGen<BorderStyle, Color>
type BorderEdgeParams = BorderEdgeParamsGen<number, BorderStyle, Color, BorderFill>

type GetBorderCorner = GetSet<BorderCorner, BorderCornerParams>
type SetBorderCorner = SetGet<BorderCorner, BorderCornerParams>
type GetBorderBlock = GetSet<BorderBlock, BorderEdgeParams>
type SetBorderBlock = SetGet<BorderBlock, BorderEdgeParams>
type GetBorderEdge = GetSet<BorderEdge, BorderEdgeParams>
type SetBorderEdge = SetGet<BorderEdge, BorderEdgeParams>

type SimpleEdge = {
	width: number
	style: BorderStyle
	color: Color
	fill: BorderFill
}

const compEdges = (e1: SimpleEdge, e2: SimpleEdge) =>
	e1.width === e2.width &&
	e1.style === e2.style &&
	e1.color === e2.color &&
	e1.fill === e2.fill

export class BorderCorner extends ExtendedEventEmitter<{ change: [] }> {
	private _style?: BorderStyle
	private _color?: Color

	constructor(
		style?: BorderStyle,
		color?: Color
	) {
		super()

		this._style = style
		this._color = color
	}

	get style() { return this._style }
	set style(v) {
		if (this._style === v) return
		this._style = v
		this.emit('change')
	}

	get color() { return this._color }
	set color(v) {
		if (this._color === v) return
		this._color = v
		this.emit('change')
	}

	protected getStyle() { return this.style }
	protected setStyle(v: BorderStyle) { this.style = v }
	protected getColor() { return this.color }
	protected setColor(v: Color) { this.color = v }
}

export class BorderEdge extends BorderCorner {
	private _width: number
	private _fill: BorderFill

	constructor(
		width = 1,
		style: BorderStyle = 'line',
		color: Color = 'default',
		fill: BorderFill = 'solid'
	) {
		super(style, color)

		this._width = width
		this._fill = fill
	}

	get width() { return this._width }
	set width(v) {
		if (this._width === v) return
		this._width = v
		this.emit('change')
	}

	get fill() { return this._fill }
	set fill(v) {
		if (this._fill === v) return
		this._fill = v
		this.emit('change')
	}

	get style() { return super.getStyle()! }
	set style(v) { super.setStyle(v) }

	get color() { return super.getColor()! }
	set color(v) { super.setColor(v) }

	get _ref() { return {
		width: this.width,
		style: this.style,
		color: this.color,
		fill: this.fill
	} }
}

export class BorderBlock extends BorderEdge {
	private _left = new BorderCorner()
	private _right = new BorderCorner()

	constructor(
		width = 1,
		style: BorderStyle = 'line',
		color: Color = 'default',
		fill: BorderFill = 'solid'
	) {
		super(width, style, color, fill)

		this._left.on('change', () => this.emit('change'))
		this._right.on('change', () => this.emit('change'))
	}

	get left(): GetBorderCorner { return this._left }
	set left(v: SetBorderCorner) {
		if (this.suppress(() => {
			this._left.style = v[0]
			this._left.color = v[1] ?? this._left.color
		})().length) this.emit('change')
	}

	get right(): GetBorderCorner { return this._right }
	set right(v: SetBorderCorner) {
		if (this.suppress(() => {
			this._right.style = v[0]
			this._right.color = v[1] ?? this._right.color
		})().length) this.emit('change')
	}
}

export default class BorderBox extends ExtendedEventEmitter<{ change: [] }> {
	private _top: BorderBlock
	private _right: BorderEdge
	private _bottom: BorderBlock
	private _left: BorderEdge

	constructor(
		width = 1,
		style: BorderStyle = 'line',
		color: Color = 'default',
		fill: BorderFill = 'solid'
	) {
		super()

		this._top = new BorderBlock(width, style, color, fill)
		.on('change', () => this.emit('change'))

		this._right = new BorderEdge(width, style, color, fill)
		.on('change', () => this.emit('change'))

		this._bottom = new BorderBlock(width, style, color, fill)
		.on('change', () => this.emit('change'))

		this._left = new BorderEdge(width, style, color, fill)
		.on('change', () => this.emit('change'))
	}

	get top(): GetBorderBlock { return this._top }
	set top(v: SetBorderBlock) {
		const ref = this._top._ref

		if (Array.isArray(v)) {
			this._top.width = v[0] ?? this._top.width
			this._top.style = v[1] ?? this._top.style
			this._top.color = v[2] ?? this._top.color
			this._top.fill = v[3] ?? this._top.fill
		} else this._top.width = v

		if (!compEdges(ref, this._top)) this.emit('change')
	}

	get right(): GetBorderEdge { return this._right }
	set right(v: SetBorderEdge) {
		const ref = this._right._ref

		if (Array.isArray(v)) {
			this._right.width = v[0] ?? this._right.width
			this._right.style = v[1] ?? this._right.style
			this._right.color = v[2] ?? this._right.color
			this._right.fill = v[3] ?? this._right.fill
		} else this._right.width = v

		if (!compEdges(ref, this._right)) this.emit('change')
	}

	get bottom(): GetBorderBlock { return this._bottom }
	set bottom(v: SetBorderBlock) {
		const ref = this._bottom._ref

		if (Array.isArray(v)) {
			this._bottom.width = v[0] ?? this._bottom.width
			this._bottom.style = v[1] ?? this._bottom.style
			this._bottom.color = v[2] ?? this._bottom.color
			this._bottom.fill = v[3] ?? this._bottom.fill
		} else this._bottom.width = v

		if (!compEdges(ref, this._bottom)) this.emit('change')
	}

	get left(): GetBorderEdge { return this._left }
	set left(v: SetBorderEdge) {
		const ref = this._left._ref

		if (Array.isArray(v)) {
			this._left.width = v[0] ?? this._left.width
			this._left.style = v[1] ?? this._left.style
			this._left.color = v[2] ?? this._left.color
			this._left.fill = v[3] ?? this._left.fill
		} else this._left.width = v

		if (!compEdges(ref, this._left)) this.emit('change')
	}

	get inline(): number { return this._left.width + this._right.width }
	set inline(v: BorderEdgeParams) {
		const events = this.suppress(() => {
			this.left = this.right = v
		})()

		if (events.length) this.emit('change')
	}

	get block(): number { return this._top.width + this._bottom.width }
	set block(v: BorderEdgeParams) {
		const events = this.suppress(() => {
			this.top = this.bottom = v
		})()

		if (events.length) this.emit('change')
	}

	get all(): number { return this.inline + this.block }
	set all(v: BorderEdgeParams) {
		const events = this.suppress(() => {
			this.inline = this.block = v
		})()

		if (events.length) this.emit('change')
	}
}
