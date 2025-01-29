import ExtendedEventEmitter from '../events'
import { BorderFill, BorderStyle } from './Panel'
import { Color } from '..'

type BorderCornerParams = [style: BorderStyle, color?: Color]
type BorderEdgeParams = [width?: number, style?: BorderStyle, color?: Color, fill?: BorderFill]

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
	#style?: BorderStyle
	#color?: Color

	constructor(
		style?: BorderStyle,
		color?: Color
	) {
		super()

		this.#style = style
		this.#color = color
	}

	get style() { return this.#style }
	set style(v) {
		if (this.#style === v) return
		this.#style = v
		this.emit('change')
	}

	get color() { return this.#color }
	set color(v) {
		if (this.#color === v) return
		this.#color = v
		this.emit('change')
	}
}

export class BorderEdge extends BorderCorner {
	#width: number
	#fill: BorderFill

	constructor(
		width = 1,
		style: BorderStyle = 'line',
		color: Color = 'default',
		fill: BorderFill = 'solid'
	) {
		super(style, color)

		this.#width = width
		this.#fill = fill
	}

	get width() { return this.#width }
	set width(v) {
		if (this.#width === v) return
		this.#width = v
		this.emit('change')
	}

	get fill() { return this.#fill }
	set fill(v) {
		if (this.#fill === v) return
		this.#fill = v
		this.emit('change')
	}

	get style() { return super.style! }
	set style(v) { super.style = v }

	get color() { return super.color! }
	set color(v) { super.color = v }

	get _ref() { return {
		width: this.width,
		style: this.style,
		color: this.color,
		fill: this.fill
	} }
}

export class BorderBlock extends BorderEdge {
	#left = new BorderCorner()
	#right = new BorderCorner()

	constructor(
		width = 1,
		style: BorderStyle = 'line',
		color: Color = 'default',
		fill: BorderFill = 'solid'
	) {
		super(width, style, color, fill)

		this.#left.on('change', () => this.emit('change'))
		this.#right.on('change', () => this.emit('change'))
	}

	get left(): BorderCorner { return this.#left }
	set left(v: BorderCornerParams) {
		if (this.suppress(() => {
			this.#left.style = v[0]
			this.#left.color = v[1] ?? this.#left.color
		})().length) this.emit('change')
	}

	get right(): BorderCorner { return this.#right }
	set right(v: BorderCornerParams) {
		if (this.suppress(() => {
			this.#right.style = v[0]
			this.#right.color = v[1] ?? this.#right.color
		})().length) this.emit('change')
	}
}

export default class BorderBox extends ExtendedEventEmitter<{ change: [] }> {
	#top: BorderBlock
	#right: BorderEdge
	#bottom: BorderBlock
	#left: BorderEdge

	constructor(
		width = 1,
		style: BorderStyle = 'line',
		color: Color = 'default',
		fill: BorderFill = 'solid'
	) {
		super()

		this.#top = new BorderBlock(width, style, color, fill)
		.on('change', () => this.emit('change'))

		this.#right = new BorderEdge(width, style, color, fill)
		.on('change', () => this.emit('change'))

		this.#bottom = new BorderBlock(width, style, color, fill)
		.on('change', () => this.emit('change'))

		this.#left = new BorderEdge(width, style, color, fill)
		.on('change', () => this.emit('change'))
	}

	get top(): BorderBlock { return this.#top }
	set top(v: number | BorderEdgeParams) {
		const ref = this.#top._ref

		if (Array.isArray(v)) {
			this.#top.width = v[0] ?? this.#top.width
			this.#top.style = v[1] ?? this.#top.style
			this.#top.color = v[2] ?? this.#top.color
			this.#top.fill = v[3] ?? this.#top.fill
		} else this.#top.width = v

		if (!compEdges(ref, this.#top)) this.emit('change')
	}

	get right(): BorderEdge { return this.#right }
	set right(v: number | BorderEdgeParams) {
		const ref = this.#right._ref

		if (Array.isArray(v)) {
			this.#right.width = v[0] ?? this.#right.width
			this.#right.style = v[1] ?? this.#right.style
			this.#right.color = v[2] ?? this.#right.color
			this.#right.fill = v[3] ?? this.#right.fill
		} else this.#right.width = v

		if (!compEdges(ref, this.#right)) this.emit('change')
	}

	get bottom(): BorderBlock { return this.#bottom }
	set bottom(v: number | BorderEdgeParams) {
		const ref = this.#bottom._ref

		if (Array.isArray(v)) {
			this.#bottom.width = v[0] ?? this.#bottom.width
			this.#bottom.style = v[1] ?? this.#bottom.style
			this.#bottom.color = v[2] ?? this.#bottom.color
			this.#bottom.fill = v[3] ?? this.#bottom.fill
		} else this.#bottom.width = v

		if (!compEdges(ref, this.#bottom)) this.emit('change')
	}

	get left(): BorderEdge { return this.#left }
	set left(v: number | BorderEdgeParams) {
		const ref = this.#left._ref

		if (Array.isArray(v)) {
			this.#left.width = v[0] ?? this.#left.width
			this.#left.style = v[1] ?? this.#left.style
			this.#left.color = v[2] ?? this.#left.color
			this.#left.fill = v[3] ?? this.#left.fill
		} else this.#left.width = v

		if (!compEdges(ref, this.#left)) this.emit('change')
	}

	get inline(): number { return this.#left.width + this.#right.width }
	set inline(v: number | BorderEdgeParams) {
		const events = this.suppress(() => {
			this.left = this.right = v
		})()

		if (events.length) this.emit('change')
	}

	get block(): number { return this.#top.width + this.#bottom.width }
	set block(v: number | BorderEdgeParams) {
		const events = this.suppress(() => {
			this.top = this.bottom = v
		})()

		if (events.length) this.emit('change')
	}

	get all(): number { return this.inline + this.block }
	set all(v: number | BorderEdgeParams) {
		const events = this.suppress(() => {
			this.inline = this.block = v
		})()

		if (events.length) this.emit('change')
	}
}
