import { Color, TUI } from '..'
import ExtendedEventEmitter from '../events'
import BorderBox from './BorderBox'
import MetricBox from './MetricBox'

type ChangeArgN<N extends string, V> = {
	name: N
	value: V
}
type ChangeArg<N extends string, V, L = V> = ChangeArgN<N, V> & {
	lastValue: L
}
type ChangeProp =
	ChangeArg<'size', [width: number, height: number]> |
	ChangeArg<`${'min' | 'max'}${'Width' | 'Height'}`, number> |
	ChangeArgN<'margin' | 'padding', MetricBox> |
	ChangeArgN<'border', BorderBox> |
	ChangeArg<'bgColor', Color | 'transparent'>

type CustomBorderStyle = {
	empty: string
	horizontal: string
	vertical: string
	topLeft: string
	topRight: string
	bottomLeft: string
	bottomRight: string
	top: string
	right: string
	bottom: string
	left: string
	center: string
}
type DefaultBorderStyle = keyof typeof BORDER_STYLES
export type BorderStyle = DefaultBorderStyle | CustomBorderStyle
export type BorderFill = 'solid' | 'lines'
type BorderBlockTile = [
	top: boolean,
	right: boolean,
	bottom: boolean,
	left: boolean
]

const BORDER_STYLES = {
	line: {
		empty: ' ',
		horizontal: '─',
		vertical: '│',
		topLeft: '┌',
		topRight: '┐',
		bottomLeft: '└',
		bottomRight: '┘',
		top: '┬',
		right: '┤',
		bottom: '┴',
		left: '├',
		center: '┼'
	} as CustomBorderStyle,
	thick: {
		empty: ' ',
		horizontal: '━',
		vertical: '┃',
		topLeft: '┏',
		topRight: '┓',
		bottomLeft: '┗',
		bottomRight: '┛',
		top: '┳',
		right: '┫',
		bottom: '┻',
		left: '┣',
		center: '╋'
	} as CustomBorderStyle,
	double: {
		empty: ' ',
		horizontal: '═',
		vertical: '║',
		topLeft: '╔',
		topRight: '╗',
		bottomLeft: '╚',
		bottomRight: '╝',
		top: '╦',
		right: '╣',
		bottom: '╩',
		left: '╠',
		center: '╬'
	} as CustomBorderStyle,
	round: {
		empty: ' ',
		horizontal: '─',
		vertical: '│',
		topLeft: '╭',
		topRight: '╮',
		bottomLeft: '╰',
		bottomRight: '╯',
		top: '┬',
		right: '┤',
		bottom: '┴',
		left: '├',
		center: '┼'
	} as CustomBorderStyle,
	solid: {
		empty: ' ',
		horizontal: '█',
		vertical: '█',
		topLeft: '█',
		topRight: '█',
		bottomLeft: '█',
		bottomRight: '█',
		top: '█',
		right: '█',
		bottom: '█',
		left: '█',
		center: '█'
	} as CustomBorderStyle,
	none: {
		empty: ' ',
		horizontal: ' ',
		vertical: ' ',
		topLeft: ' ',
		topRight: ' ',
		bottomLeft: ' ',
		bottomRight: ' ',
		top: ' ',
		right: ' ',
		bottom: ' ',
		left: ' ',
		center: ' '
	} as CustomBorderStyle
}

const getBorderStyle = (style: BorderStyle): CustomBorderStyle => {
	if (typeof style === 'string') {
		if (!(style in BORDER_STYLES))
			throw new Error(`No such default border style - "${style}"`, { cause: style })

		return BORDER_STYLES[style]
	}

	return style
}

const BORDER_SYMBOL_LOOKUP_TABLE: (keyof CustomBorderStyle)[] = [
	'empty',
	'horizontal',
	'vertical',
	'topRight',
	'horizontal',
	'horizontal',
	'topLeft',
	'top',
	'vertical',
	'bottomRight',
	'vertical',
	'right',
	'bottomLeft',
	'bottom',
	'left',
	'center'
]

const pickBorderSymbol = (
	top: boolean,
	right: boolean,
	bottom: boolean,
	left: boolean
): keyof CustomBorderStyle => BORDER_SYMBOL_LOOKUP_TABLE[+top << 3 | +right << 2 | +bottom << 1 | +left]

const buildBorderBlock = (
	width: number,
	height: number,
	fill: BorderFill,
	style: CustomBorderStyle,
	top?: BorderFill,
	right?: BorderFill,
	bottom?: BorderFill,
	left?: BorderFill
) => {
	const t = !!top, r = !!right, b = !!bottom, l = !!left

	const hor = fill !== 'lines' || l || r
	const vert = fill !== 'lines' || t || b

	const hT = hor || !top
	const vR = vert || !right
	const hB = hor || !bottom
	const vL = vert || !left

	const w = width > 1, h = height > 1
	const wr = w || r, hb = h || b

	const tiles: BorderBlockTile[] = [
		[t, hT && wr, vL && hb, l],
		[t, hT, vert && hb, hT],
		[t, r, vR && hb, hT],
		[vL, hor && wr, vL, l],
		[vert, hor, vert, hor],
		[vR, r, vR, hor],
		[vL, hB && wr, b, l],
		[vert, hB, b, hB],
		[vR, r, b, hB]
	]

	const lines: string[] = []
	let i = 0
	for (let y = 0; y < height; y++) {
		let line = ''

		for (let x = 0; x < width; x++) {
			const bSym = pickBorderSymbol(...tiles[i])
			line += style[bSym]

			switch (i) {
				case 0:
					i += Math.max(1, 4 - width)
					break
				case 1:
				case 4:
				case 7:
				case 8:
					if (x >= width - 2) i++
					break
				case 2:
					i += height > 2 ? 1 : 4
					break
				case 3:
					i += w ? (width > 2 ? 1 : 2) : (y === height - 2 ? 3 : 0)
					break
				case 5:
					i += y === height - 2 ? 1 : -2
					break
				case 6:
					i += w ? (width > 2 ? 1 : 2) : 9
					break
				default:
					throw new Error('Tile index is out of bounds')
			}

			if (i === 9 && (y !== height - 1 || x !== width - 1))
				throw new Error('Tile building ended prematurely')
		}

		lines.push(line)
	}

	return lines
}

export class Panel extends ExtendedEventEmitter<{ change: [prop: ChangeProp], draw: [] }> {
	#bgColor: Color | 'transparent' = 'transparent'
	#minWidth = 1
	#minHeight = 1
	#width = NaN
	#height = NaN
	#maxWidth = Infinity
	#maxHeight = Infinity

	#drawPropagate = true

	margin = new MetricBox()
	padding = new MetricBox()
	border = new BorderBox()

	constructor(public readonly parent: Panel | TUI) {
		super()
		const me = this

		parent.on('resize', () => me.updateSize())
		parent.on('change', prop => {
			if (prop.name === 'size') me.updateSize()
		})
		parent.on('draw', () => me.draw())
		me.margin.on('change', () => {
			me.emit('change', {
				name: 'margin',
				value: me.margin
			})
			me.updateSize()
		})
		me.padding.on('change', () => {
			me.emit('change', {
				name: 'padding',
				value: me.padding
			})
			me.updateSize()
		})
		me.border.on('change', () => {
			me.emit('change', {
				name: 'border',
				value: me.border
			})
			me.updateSize()
		})

		me.on('change', function(prop) {
			switch (prop.name) {
				case 'size':
					[me.#width, me.#height] = prop.value
					break
				case 'minWidth':
					me.#minWidth = prop.value
					break
				case 'minHeight':
					me.#minHeight = prop.value
					break
				case 'maxWidth':
					me.#maxWidth = prop.value
					break
				case 'maxHeight':
					me.#maxHeight = prop.value
					break
				case 'bgColor':
					me.#bgColor = prop.value
			}
		})

		me.on('draw', function() {
			if (!this._default) return

			me.tui.style({ bgColor: me._realBgColor })
			me.drawBorder(false)
			me.tui.style()

			if (!me.#drawPropagate) this.stopPropagation()
		})

		me.updateSize()
	}

	draw(propagate = true) {
		this.#drawPropagate = propagate
		this.emit('draw')
		return this
	}

	drawBorder(applyStyle = true) {
		if (
			this.#width < Math.max(0, this.#minWidth) ||
			this.#height < Math.max(0, this.#minHeight)
		) return this

		const { top: bT, right: bR, bottom: bB, left: bL } = this.border

		const bs = {
			top: getBorderStyle(bT.style),
			right: getBorderStyle(bR.style),
			bottom: getBorderStyle(bB.style),
			left: getBorderStyle(bL.style),
			topleft: getBorderStyle(bT.left.style ?? bT.style),
			topright: getBorderStyle(bT.right.style ?? bT.style),
			bottomleft: getBorderStyle(bB.left.style ?? bB.style),
			bottomright: getBorderStyle(bB.right.style ?? bB.style)
		}

		const width = this.#width
		const height = this.#height
		const pWidth = this.padding.left + width + this.padding.right
		const pHeight = this.padding.top + height + this.padding.bottom
		const bAbsX = this.parent.absX + this.margin.left
		const bAbsY = this.parent.absY + this.margin.top

		const lTL = buildBorderBlock(bL.width, bT.width, bT.fill, bs.topleft, undefined, bT.fill, bL.fill)
		const lT = buildBorderBlock(pWidth, bT.width, bT.fill, bs.top, undefined, bT.fill, undefined, bT.fill)
		const lTR = buildBorderBlock(bR.width, bT.width, bT.fill, bs.topright, undefined, undefined, bR.fill, bT.fill)
		const lL = buildBorderBlock(bL.width, pHeight, bL.fill, bs.left, bT.fill, undefined, bB.fill)
		const lR = buildBorderBlock(bR.width, pHeight, bR.fill, bs.right, bT.fill, undefined, bB.fill)
		const lBL = buildBorderBlock(bL.width, bB.width, bB.fill, bs.bottomleft, bL.fill, bB.fill)
		const lB = buildBorderBlock(pWidth, bB.width, bB.fill, bs.bottom, undefined, bB.fill, undefined, bB.fill)
		const lBR = buildBorderBlock(bR.width, bB.width, bB.fill, bs.bottomright, bR.fill, undefined, undefined, bB.fill)

		const cTL = TUI.style({ color: bT.left.color ?? bT.color })
		const cT = TUI.style({ color: bT.color })
		const cTR = TUI.style({ color: bT.right.color ?? bT.color })
		const cL = TUI.style({ color: bL.color })
		const cR = TUI.style({ color: bR.color })
		const cBL = TUI.style({ color: bB.left.color ?? bB.color })
		const cB = TUI.style({ color: bB.color })
		const cBR = TUI.style({ color: bB.right.color ?? bB.color })

		const lines: string[] = [
			...lT.map((l, i) => cTL+lTL[i] + cT+l + cTR+lTR[i]),
			...lL.map((l, i) => cL+l + ' '.repeat(pWidth) + cR+lR[i]),
			...lB.map((l, i) => cBL+lBL[i] + cB+l + cBR+lBR[i])
		]

		const pad = bAbsX > 1 ? TUI.cursorRight(bAbsX - 1) : ''
		const frame = TUI.cursorPosition(bAbsY, bAbsX) + lines.join(`\n${pad}`) + TUI.style()

		if (applyStyle) this.tui.style({ bgColor: this._realBgColor })
		this.tui.saveCursor()
		.write(frame)
		.restoreCursor()
		if (applyStyle) this.tui.style()

		return this
	}

	updateSize() {
		let avWidth = this.parent.width -
		this.margin.left -
		this.margin.right -
		this.border.left.width -
		this.border.right.width -
		this.padding.left -
		this.padding.right
		let avHeight = this.parent.height -
		this.margin.top -
		this.margin.bottom -
		this.border.top.width -
		this.border.bottom.width -
		this.padding.top -
		this.padding.bottom

		const width = Math.min(this.#maxWidth, avWidth)
		const height = Math.min(this.#maxHeight, avHeight)

		if (width === this.#width && height === this.#height) return false

		this.emit('change', {
			name: 'size',
			value: [width, height],
			lastValue: [this.#width, this.#height]
		})
		return true
	}

	get tui(): TUI {
		if (this.parent instanceof TUI)
			return this.parent
		return this.parent.tui

	}

	get absX(): number {
		return this.parent.absX +
			this.margin.left +
			this.border.left.width +
			this.padding.left
	}

	get absY(): number {
		return this.parent.absY +
			this.margin.top +
			this.border.top.width +
			this.padding.top
	}

	get minWidth() { return this.#minWidth }
	set minWidth(v) {
		if (this.#minWidth === v) return
		this.emit('change', {
			name: 'minWidth',
			value: v,
			lastValue: this.#minWidth
		})
	}

	get minHeight() { return this.#minHeight }
	set minHeight(v) {
		if (this.#minHeight === v) return
		this.emit('change', {
			name: 'minHeight',
			value: v,
			lastValue: this.#minHeight
		})
	}

	get width() { return this.#width }

	get height() { return this.#height }

	get maxWidth() { return this.#maxWidth }
	set maxWidth(v) {
		if (this.#maxWidth === v) return
		this.emit('change', {
			name: 'maxWidth',
			value: v,
			lastValue: this.#maxWidth
		})
		this.updateSize()
	}

	get maxHeight() { return this.#maxHeight }
	set maxHeight(v) {
		if (this.#maxHeight === v) return
		this.emit('change', {
			name: 'maxHeight',
			value: v,
			lastValue: this.#maxHeight
		})
		this.updateSize()
	}

	get bgColor() { return this.#bgColor }
	set bgColor(v) {
		if (this.#bgColor === v) return
		this.emit('change', {
			name: 'bgColor',
			value: v,
			lastValue: this.#bgColor
		})
	}

	get _realBgColor(): Color {
		return this.#bgColor === 'transparent' ? (this.parent instanceof TUI ? 'default' : this.parent._realBgColor) : this.#bgColor
	}
}
