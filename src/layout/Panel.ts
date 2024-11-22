import { Color, TUI } from '..'
import ExtendedEventEmitter from '../events'

type PanelEvents = {
	resize: [width: number, height: number]
}

type BoxMetrics = {
	top: number
	right: number
	bottom: number
	left: number
}

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
type BorderFill = 'solid' | 'lines'
type BorderCorner = {
	style?: BorderStyle
	color?: Color
}
type BorderEdge = Required<BorderCorner> & {
	width: number
	fill: BorderFill
}
type BorderBlock = BorderEdge & {
	left: BorderCorner
	right: BorderCorner
}
type BorderBlockTile = [
	top: boolean,
	right: boolean,
	bottom: boolean,
	left: boolean
]
type Border = {
	top: BorderBlock
	right: BorderEdge
	bottom: BorderBlock
	left: BorderEdge
}

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

export class Panel extends ExtendedEventEmitter<PanelEvents> {
	#textLines: string[] = ['']
	#innerText = ''
	#wordWrap = false
	#tabSize = 4
	#scroll = 0
	#maxWidth = Infinity
	#width = NaN
	#height = NaN

	scrollDirection: 'up' | 'down' = 'down'
	color: Color = 'default'
	bgColor: Color = 'default'
	minWidth = 1
	minHeight = 1
	maxHeight = Infinity
	margin: BoxMetrics = {
		top: 0,
		right: 0,
		bottom: 0,
		left: 0
	}
	padding: BoxMetrics = {
		top: 0,
		right: 0,
		bottom: 0,
		left: 0
	}
	border: Border = {
		top: { width: 1, style: 'line', color: 'default', fill: 'solid', left: {}, right: {} },
		right: { width: 1, style: 'line', color: 'default', fill: 'solid' },
		bottom: { width: 1, style: 'line', color: 'default', fill: 'solid', left: {}, right: {} },
		left: { width: 1, style: 'line', color: 'default', fill: 'solid' }
	}

	constructor(public readonly parent: Panel | TUI) {
		super()

		parent.addListener('resize', () => {
			if (this.updateSize()) {
				this.updateText()
				this.emit('resize', this.width, this.height)
			}
		})

		this.updateSize()
	}

	updateSize() {
		let avWidth = this.parent.width
		avWidth -= this.margin.left
		avWidth -= this.margin.right
		avWidth -= this.border.left.width
		avWidth -= this.border.right.width
		avWidth -= this.padding.left
		avWidth -= this.padding.right
		let avHeight = this.parent.height
		avHeight -= this.margin.top
		avHeight -= this.margin.bottom
		avHeight -= this.border.top.width
		avHeight -= this.border.bottom.width
		avHeight -= this.padding.top
		avHeight -= this.padding.bottom

		const lastWidth = this.#width
		const lastHeight = this.#height

		this.#width = Math.min(this.maxWidth, avWidth)
		this.#height = Math.min(this.maxHeight, avHeight)

		return lastWidth !== this.#width || lastHeight !== this.#height
	}

	draw() {
		this.tui.style({ bgColor: this.bgColor })
		this.drawBorder()
		this.tui.style({ color: this.color })
		this.drawText()
		this.tui.style()

		return this
	}

	drawBorder() {
		if (
			this.width < Math.max(0, this.minWidth) ||
			this.height < Math.max(0, this.minHeight)
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

		const width = this.width
		const height = this.height
		const pWidth = this.padding.left + width + this.padding.right
		const pHeight = this.padding.top + height + this.padding.bottom
		const bAbsX = this.parent.absX + this.margin.left
		const bAbsY = this.parent.absY + this.margin.top

		const lTL = buildBorderBlock(bL.width, bT.width, bT.fill, bs.topleft, undefined, bT.fill, bL.fill, undefined)
		const lT = buildBorderBlock(pWidth, bT.width, bT.fill, bs.top, undefined, bT.fill, undefined, bT.fill)
		const lTR = buildBorderBlock(bR.width, bT.width, bT.fill, bs.topright, undefined, undefined, bR.fill, bT.fill)
		const lL = buildBorderBlock(bL.width, pHeight, bL.fill, bs.left, bT.fill, undefined, bB.fill, undefined)
		const lR = buildBorderBlock(bR.width, pHeight, bR.fill, bs.right, bT.fill, undefined, bB.fill, undefined)
		const lBL = buildBorderBlock(bL.width, bB.width, bB.fill, bs.bottomleft, bL.fill, bB.fill, undefined, undefined)
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
			...lL.map((l, i) => cL+l + TUI.cursorRight(pWidth) + cR+lR[i]),
			...lB.map((l, i) => cBL+lBL[i] + cB+l + cBR+lBR[i])
		]

		const pad = bAbsX > 1 ? TUI.cursorRight(bAbsX - 1) : ''
		const frame = TUI.cursorPosition(bAbsY, bAbsX) + lines.join(`\n${pad}`) + TUI.style()

		this.tui.saveCursor()
		.write(frame)
		.restoreCursor()

		return this
	}

	drawText() {
		if (
			this.width < Math.max(0, this.minWidth) ||
			this.height < Math.max(0, this.minHeight)
		) return this

		const shift = Math.max(0, Math.min(this.scrollDirection == 'down' ? this.scroll : this.#textLines.length - this.height - this.scroll, this.#textLines.length - this.height))

		const pad = this.absX > 1 ? TUI.cursorRight(this.absX - 1) : ''
		const frame = TUI.cursorPosition(this.absY, this.absX) + [...this.#textLines].splice(shift, this.height).join(`\n${pad}`)

		this.tui.saveCursor()
		.write(frame)
		.restoreCursor()

		return this
	}

	updateText() {
		this.#textLines = TUI.fitString(
			this.innerText,
			this.width,
			this.width,
			this.wordWrap,
			this.tabSize,
			TUI.style({ color: this.color })
		)
		this.scroll = this.scroll
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

	get width() { return this.#width }

	get height() { return this.#height }

	get innerText() { return this.#innerText }
	set innerText(v) {
		if (this.#innerText !== v) {
			this.#innerText = v
			this.updateText()
		}
	}

	get wordWrap() { return this.#wordWrap }
	set wordWrap(v) {
		if (this.#wordWrap !== v) {
			this.#wordWrap = v
			this.updateText()
		}
	}

	get tabSize() { return this.#tabSize }
	set tabSize(v) {
		if (this.#tabSize !== v) {
			this.#tabSize = v
			this.updateText()
		}
	}

	/** Either percent [0; 1] or line index. */
	get scroll() { return this.#scroll }
	set scroll(v) {
		v = Math.max(0, v)
		if (v >= 1) v = Math.min(Math.round(v), this.#textLines.length - this.#height)
		this.#scroll = v
	}

	get maxWidth() { return this.#maxWidth }
	set maxWidth(v) {
		this.#maxWidth = v
		if (this.updateSize()) {
			this.updateText()
			this.emit('resize', this.width, this.height)
		}
	}
}