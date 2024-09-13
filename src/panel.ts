import { Color, TUI } from '.'

type BoxMetrics = {
	top: number,
	right: number,
	bottom: number,
	left: number
}

type CustomBorderStyle = {
	empty: string
	horizontal: string
	vertertical: string
	topLeft: string
	topRight: string
	bottomLeft: string
	bottomRight: string
	topMid: string
	rightMid: string
	bottomMid: string
	leftMid: string
	center: string
}
type DefaultBorderStyles = keyof typeof BORDER_STYLES
type BorderStyles = DefaultBorderStyles | CustomBorderStyle
type BorderFill = 'solid' | 'lines'
type BorderCorner = {
	style?: BorderStyles
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
		vertertical: '│',
		topLeft: '┌',
		topRight: '┐',
		bottomLeft: '└',
		bottomRight: '┘',
		topMid: '┬',
		rightMid: '┤',
		bottomMid: '┴',
		leftMid: '├',
		center: '┼'
	} as CustomBorderStyle,
	thick: {
		empty: ' ',
		horizontal: '━',
		vertertical: '┃',
		topLeft: '┏',
		topRight: '┓',
		bottomLeft: '┗',
		bottomRight: '┛',
		topMid: '┳',
		rightMid: '┫',
		bottomMid: '┻',
		leftMid: '┣',
		center: '╋'
	} as CustomBorderStyle,
	double: {
		empty: ' ',
		horizontal: '═',
		vertertical: '║',
		topLeft: '╔',
		topRight: '╗',
		bottomLeft: '╚',
		bottomRight: '╝',
		topMid: '╦',
		rightMid: '╣',
		bottomMid: '╩',
		leftMid: '╠',
		center: '╬'
	} as CustomBorderStyle,
	solid: {
		empty: ' ',
		horizontal: '█',
		vertertical: '█',
		topLeft: '█',
		topRight: '█',
		bottomLeft: '█',
		bottomRight: '█',
		topMid: '█',
		rightMid: '█',
		bottomMid: '█',
		leftMid: '█',
		center: '█'
	} as CustomBorderStyle,
	none: {
		empty: ' ',
		horizontal: ' ',
		vertertical: ' ',
		topLeft: ' ',
		topRight: ' ',
		bottomLeft: ' ',
		bottomRight: ' ',
		topMid: ' ',
		rightMid: ' ',
		bottomMid: ' ',
		leftMid: ' ',
		center: ' '
	} as CustomBorderStyle
}

const getBorderStyle = (style: BorderStyles): CustomBorderStyle => {
	if (typeof style === 'string') {
		if (!(style in BORDER_STYLES))
			throw new Error(`No such default border style - "${style}"`, { cause: style })

		return BORDER_STYLES[style]
	}

	return style
}

const pickBorderSymbol = (
	top: boolean,
	right: boolean,
	bottom: boolean,
	left: boolean
): keyof CustomBorderStyle => {
	const sides = `${+top}${+right}${+bottom}${+left}`
	switch (sides) {
		case '0000':
			return 'empty'
		case '0001':
		case '0100':
		case '0101':
			return 'horizontal'
		case '0010':
		case '1000':
		case '1010':
			return 'vertertical'
		case '0011':
			return 'topRight'
		case '0110':
			return 'topLeft'
		case '0111':
			return 'topMid'
		case '1001':
			return 'bottomRight'
		case '1011':
			return 'rightMid'
		case '1100':
			return 'bottomLeft'
		case '1101':
			return 'bottomMid'
		case '1110':
			return 'leftMid'
	}

	return 'center'
	// TRBL
	// 0000 | O
	// 0001 | 0100 | 0101 | ─
	// 0010 | 1000 | 1010 | │
	// 0011 | ┐
	// 0110 | ┌
	// 0111 | ┬
	// 1001 | ┘
	// 1011 | ┤
	// 1100 | └
	// 1101 | ┴
	// 1110 | ├
	// 1111 | ┼
}

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

export class Panel {
	innerText = ''
	color: Color = 'default'
	bgColor: Color = 'default'
	minWidth = 1
	maxWidth = Infinity
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

	constructor(public readonly parent: Panel | TUI) {}

	draw() {
		/* const width = this.width
		const height = this.height

		if (
			width < Math.max(0, this.minWidth) ||
			height < Math.max(0, this.minHeight)
		) return this

		const border = this.border
		const bs = {
			top: getBorderStyle(border.top.style),
			right: getBorderStyle(border.right.style),
			bottom: getBorderStyle(border.bottom.style),
			left: getBorderStyle(border.left.style),
			topleft: getBorderStyle(border.top.left.style ?? border.top.style),
			topright: getBorderStyle(border.top.right.style ?? border.top.style),
			bottomleft: getBorderStyle(border.bottom.left.style ?? border.bottom.style),
			bottomright: getBorderStyle(border.bottom.right.style ?? border.bottom.style)
		}

		const bAbsX = this.parent.absX + this.margin.left
		const bAbsY = this.parent.absY + this.margin.top
		const bWidth = this.parent.width - this.margin.left - this.margin.right
		const bHeight = this.parent.height - this.margin.top - this.margin.bottom

		const lines: string[] = []

		for (let y = 0; y < bHeight; y++) {
			let line = ''

			for (let x = 0; x < bWidth; x++) {
				const tb = y < border.top.width ? 'top' : (y >= bHeight - border.bottom.width ? 'bottom' : '')
				const lr = x < border.left.width ? 'left' : (x >= bWidth - border.right.width ? 'right' : '')
				const quad = `${tb}${lr}` as const

				if (quad) {
					const horOut = x === 0 || x === (bWidth - 1)
					const verOut = y === 0 || y === (bHeight - 1)

					const bSym = pickBorderSymbol(
						(!!lr || (horOut && y !== bHeight - border.bottom.width)) && (!tb || y > 0),
						(!!tb || (verOut && x !== border.left.width - 1)) && (!lr || (x < bWidth - 1)),
						(!!lr || (horOut && y !== border.top.width - 1)) && (!tb || (y < bHeight - 1)),
						(!!tb || (verOut && x !== bWidth - border.right.width)) && (!lr || x > 0),
					)

					line += bs[quad][bSym] // TODO: Colors
				} else if (
					y < border.top.width + this.padding.top ||
					y >= bHeight - (border.bottom.width + this.padding.bottom) ||
					x < border.left.width + this.padding.left ||
					x >= bWidth - (border.right.width + this.padding.right)
				) line += ' '
				else line += '.'
			}

			lines.push(line)
		}

		const pad = bAbsX > 1 ? `\x1B[${bAbsX - 1}C` : ''
		const frame = lines.join(`\x1B[E${pad}`)

		const tui = this.tui

		tui.writeCode('7')
		.moveTo(bAbsX, bAbsY)
		.write(frame)
		.writeCode('8') */

		this.tui.style({ bgColor: this.bgColor, color: this.color })
		this.drawBorder()
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

		const width = Math.min(this.width, this.maxWidth)
		const height = Math.min(this.height, this.maxHeight)
		const pWidth = this.padding.left + width + this.padding.right
		const pHeight = this.padding.top + height + this.padding.bottom
		// const bWidth = this.margin.left + pWidth + this.margin.right
		// const bHeight = this.margin.top + pHeight + this.margin.bottom
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

		const cTL = TUI.compStyle({ color: bT.left.color ?? bT.color })
		const cT = TUI.compStyle({ color: bT.color })
		const cTR = TUI.compStyle({ color: bT.right.color ?? bT.color })
		const cL = TUI.compStyle({ color: bL.color })
		const cR = TUI.compStyle({ color: bR.color })
		const cBL = TUI.compStyle({ color: bB.left.color ?? bB.color })
		const cB = TUI.compStyle({ color: bB.color })
		const cBR = TUI.compStyle({ color: bB.right.color ?? bB.color })

		const lines: string[] = [
			...lT.map((l, i) => cTL+lTL[i] + cT+l + cTR+lTR[i]),
			...lL.map((l, i) => cL+l + `\x1B[${pWidth}C` + cR+lR[i]),
			...lB.map((l, i) => cBL+lBL[i] + cB+l + cBR+lBR[i])
		]

		const pad = bAbsX > 1 ? `\x1B[${bAbsX - 1}C` : ''
		const frame = lines.join(`\x1B[E${pad}`)

		this.tui.writeCode('7')
		.moveTo(bAbsX, bAbsY)
		.write(frame)
		.writeCode('8')

		return this
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

	get width(): number {
		let available = this.parent.width
		available -= this.margin.left
		available -= this.margin.right
		available -= this.border.left.width
		available -= this.border.right.width
		available -= this.padding.left
		available -= this.padding.right

		return Math.min(this.maxWidth, available)
	}

	get height(): number {
		let available = this.parent.height
		available -= this.margin.top
		available -= this.margin.bottom
		available -= this.border.top.width
		available -= this.border.bottom.width
		available -= this.padding.top
		available -= this.padding.bottom

		return Math.min(this.maxHeight, available)
	}
}