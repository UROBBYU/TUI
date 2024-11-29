import ExtendedEventEmitter from '../events'
import { BorderFill, BorderStyle } from './Panel'
import { Color } from '..'

type BorderCornerParams = [style: BorderStyle, color?: Color]
type BorderEdgeParams = [width?: number, style?: BorderStyle, color?: Color, fill?: BorderFill]
type BorderBoxEvents = { redraw: [], resize: [] }

type SimpleEdge = {
	style: BorderStyle
	color: Color
	fill: BorderFill
}

const compEdges = (e1: SimpleEdge, e2: SimpleEdge) =>
	e1.style === e2.style &&
	e1.color === e2.color &&
	e1.fill === e2.fill

export class BorderCorner extends ExtendedEventEmitter<BorderBoxEvents> {
	constructor(
		public style?: BorderStyle,
		public color?: Color
	) { super() }
}

export class BorderEdge extends BorderCorner {
	constructor(
		public width = 1,
		public style: BorderStyle = 'line',
		public color: Color = 'default',
		public fill: BorderFill = 'solid'
	) { super() }
}

export class BorderBlock extends BorderEdge {
	#left = new BorderCorner()
	#right = new BorderCorner()

	get left(): BorderCorner { return this.#left }
	set left(v: BorderCornerParams) {
		this.#left.style = v[0]
		this.#left.color = v[1] ?? this.#left.color
	}

	get right(): BorderCorner { return this.#right }
	set right(v: BorderCornerParams) {
		this.#right.style = v[0]
		this.#right.color = v[1] ?? this.#right.color
	}
}

export default class BorderBox extends ExtendedEventEmitter<BorderBoxEvents> {
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
		this.#right = new BorderEdge(width, style, color, fill)
		this.#bottom = new BorderBlock(width, style, color, fill)
		this.#left = new BorderEdge(width, style, color, fill)
	}

	get top(): BorderBlock { return this.#top }
	set top(v: number | BorderEdgeParams) {
		const ref = { ...this.#top }

		if (Array.isArray(v)) {
			this.#top.width = v[0] ?? this.#top.width
			this.#top.style = v[1] ?? this.#top.style
			this.#top.color = v[2] ?? this.#top.color
			this.#top.fill = v[3] ?? this.#top.fill
		} else this.#top.width = v

		if (ref.width !== this.#top.width) this.emit('resize')
		else if (!compEdges(ref, this.#top)) this.emit('redraw')
	}

	get right(): BorderEdge { return this.#right }
	set right(v: number | BorderEdgeParams) {
		const ref = { ...this.#right }

		if (Array.isArray(v)) {
			this.#right.width = v[0] ?? this.#right.width
			this.#right.style = v[1] ?? this.#right.style
			this.#right.color = v[2] ?? this.#right.color
			this.#right.fill = v[3] ?? this.#right.fill
		} else this.#right.width = v

		if (ref.width !== this.#right.width) this.emit('resize')
		else if (!compEdges(ref, this.#right)) this.emit('redraw')
	}

	get bottom(): BorderBlock { return this.#bottom }
	set bottom(v: number | BorderEdgeParams) {
		const ref = { ...this.#bottom }

		if (Array.isArray(v)) {
			this.#bottom.width = v[0] ?? this.#bottom.width
			this.#bottom.style = v[1] ?? this.#bottom.style
			this.#bottom.color = v[2] ?? this.#bottom.color
			this.#bottom.fill = v[3] ?? this.#bottom.fill
		} else this.#bottom.width = v

		if (ref.width !== this.#bottom.width) this.emit('resize')
		else if (!compEdges(ref, this.#bottom)) this.emit('redraw')
	}

	get left(): BorderEdge { return this.#left }
	set left(v: number | BorderEdgeParams) {
		const ref = { ...this.#left }

		if (Array.isArray(v)) {
			this.#left.width = v[0] ?? this.#left.width
			this.#left.style = v[1] ?? this.#left.style
			this.#left.color = v[2] ?? this.#left.color
			this.#left.fill = v[3] ?? this.#left.fill
		} else this.#left.width = v

		if (ref.width !== this.#left.width) this.emit('resize')
		else if (!compEdges(ref, this.#left)) this.emit('redraw')
	}

	set inline(v: number | BorderEdgeParams) {
		const events = this.suppress(() => {
			this.left = this.right = v
		})

		if (events.includes('resize')) this.emit('resize')
		else if (events.includes('redraw')) this.emit('redraw')
	}

	set block(v: number | BorderEdgeParams) {
		const events = this.suppress(() => {
			this.top = this.bottom = v
		})

		if (events.includes('resize')) this.emit('resize')
		else if (events.includes('redraw')) this.emit('redraw')
	}

	set all(v: number | BorderEdgeParams) {
		const events = this.suppress(() => {
			this.inline = this.block = v
		})

		if (events.includes('resize')) this.emit('resize')
		else if (events.includes('redraw')) this.emit('redraw')
	}
}