import ExtendedEventEmitter from './events'

type ColorList = keyof typeof COLOR_LIST
type BrightColorList = `bright-${ColorList}`
type RGBColor = `#${string}`
type ColorIndex = number
export type Color = ColorList | BrightColorList | ColorIndex | RGBColor | 'default'

interface Style {
	color?: Color
	bgColor?: Color
	reset?: true
	/** 2 means faint */
	bold?: boolean | 2
	italic?: boolean
	/** 2 means double-underline */
	underline?: boolean | 2
	blink?: boolean
	inverse?: boolean
	invisible?: boolean
	strikethrough?: boolean
}

interface TUIEvents {
	close: [hadError: boolean],
	end: [],
	data: [data: Buffer],
	resize: [width: number, height: number]
}

const COLOR_LIST = {
	black: 30,
	red: 31,
	green: 32,
	yellow: 33,
	blue: 34,
	magenta: 35,
	cyan: 36,
	white: 37
}

const CURSOR_STYLES = {
	b_block: 0,
	deafult: 1,
	block: 2,
	b_underline: 3,
	underline: 4,
	b_bar: 5,
	bar: 6
}

const ETX = Buffer.of(3)
const EOT = Buffer.of(4)

/** Text-based User Interface */
export class TUI extends ExtendedEventEmitter<TUIEvents> {
	#lastRawMode: boolean
	#active = false

	constructor(
		public sin: NodeJS.ReadStream,
		public sout: NodeJS.WriteStream,
		private options: {
			exitOnCtrlC: boolean,
			exitOnCtrlD: boolean
		} = {
			exitOnCtrlC: true,
			exitOnCtrlD: true
		}
	) {
		super()
		this.#lastRawMode = sin.isRaw

		this.on('close', () => this.exit()).on('end', () => this.exit())
		process.once('exit', () => this.exit())
	}

	init() {
		if (!this.#active) {
			this.altBuffer(true)
			this.sin.setRawMode(true)
			.on('close', this._closeListener)
			.on('end', this._endListener)
			.on('data', this._dataListener)

			this.sout
			.on('resize', this._resizeListener)

			.cursorTo(0, 0)

			this.#active = true
		}
		return this
	}

	exit(stop = true) {
		if (this.#active) {
			this.#active = false

			this.sin.setRawMode(this.#lastRawMode)
			.off('close', this._closeListener)
			.off('end', this._endListener)
			.off('data', this._dataListener)

			this.sout
			.off('resize', this._resizeListener)

			this.style()
			this.cursorStyle()
			this.cursorVisible()
			this.altBuffer(false)
			if (stop) process.exit()
		}
		return this
	}

	write(message: any) {
		if (!(message instanceof Buffer))
			message = `${message}`
		this.sout.write(message)
		return this
	}

	endl() { // TODO: Add JSDoc everywhere!
		return this.write('\n')
	}

	writeLine(message: any) {
		return this.write(message).endl()
	}

	/** `ESC code` */
	writeCode(code: string) {
		return this.write(`\x1B${code}`)
	}

	/** `ESC [ code` */
	writeCSI(code: string) {
		return this.writeCode(`[${code}`)
	}

	/** `ESC [ code h/l` */
	setCSIBool(code: string, val: boolean) {
		return this.writeCSI(`${code}${val ? 'h' : 'l'}`)
	}

	/** Moves cursor to home position (1, 1). */
	moveTo(): this
	/** Moves cursor to absolute position. \
	 *
	 * If position is in range [0; 1], it will
	 * be normalized relative to terminal size.
	 */
	moveTo(col: number, row?: number, relative?: false): this
	/** Moves cursor relative to current position. */
	moveTo(col: number, row: number, relative: true): this
	moveTo(col = 1, row = 1, rel = false) {
		if (rel) {
			if (!Number.isInteger(col) || !Number.isInteger(row))
				throw new Error('Position cannot be fractional', { cause: [col, row] })

			if (col) {
				if (col < 0) this.writeCSI(`${-col}D`)
				else this.writeCSI(`${col}C`)
			}
			if (row) {
				if (row < 0) this.writeCSI(`${-row}A`)
				else this.writeCSI(`${row}B`)
			}
		} else {
			if (col < 0 || row < 0)
				throw new Error('Absolute position cannot be negative', { cause: [col, row] })

			if (col < 1) {
				col = Math.round(col * (this.width - 1) + 1)
			} else if (!Number.isInteger(col))
				throw new Error('Position cannot be fractional', { cause: col })

			if (row < 1) {
				row = Math.round(row * (this.height - 1) + 1)
			} else if (!Number.isInteger(row))
				throw new Error('Position cannot be fractional', { cause: row })

			this.writeCSI(`${row};${col}H`)
		}
		return this
	}

	/** Clears styles. */
	style(): this
	/** For explanation see [documentation](https://invisible-island.net/xterm/ctlseqs/ctlseqs.html#h2-The-Alternate-Screen-Buffer). */
	style(options: Style): this
	/** For explanation see [documentation](https://invisible-island.net/xterm/ctlseqs/ctlseqs.html#h2-The-Alternate-Screen-Buffer). */
	style(...codes: number[]): this
	style(fst?: Style | number, ...rst: number[]) {
		/* let codes: number[] = []
		if (typeof fst == 'number') {
			codes = [fst, ...rst]
		} else {
			if (!fst || fst.reset) codes = [0]
			else {
				const pc = (opt: Style['bold'], t: number, f = t + 20, d = t) => {
					if (opt !== undefined)
						codes.push(opt ? (opt === 2 ? d : t) : f)
				}

				const cc = (clr?: Color, off = 0) => {
					if (clr !== undefined) {
						if (clr === 'default') codes.push(39 + off)
						else if (typeof clr === 'number') {
							if (!Number.isInteger(clr) || clr < 0 || clr > 255)
								throw new Error(`Invalid index color: ${clr}`, { cause: clr })

							codes.push(38 + off, 5, clr)
						} else if (clr.startsWith('#')) {
							const regexArr = /^#([0-F]{2})([0-F]{2})([0-F]{2})$/i.exec(clr)
							if (!regexArr)
								throw new Error(`Invalid hex color: ${clr}`, { cause: clr })

							codes.push(38 + off, 2,
								parseInt(regexArr[1], 16),
								parseInt(regexArr[2], 16),
								parseInt(regexArr[3], 16)
							)
						} else {
							const colorArr = clr.split('-')

							switch (colorArr.length) {
								case 2:
									const brt = colorArr.shift()
									if (brt !== 'bright') break
									off += 60
								case 1:
									const clr = colorArr[0] as 'red'
									if (!(clr in COLOR_LIST)) break
									codes.push(COLOR_LIST[clr] + off)
									return
							}

							throw new Error(`Invalid color name: ${clr}`, { cause: clr })
						}
					}
				}

				pc(fst.bold, 1, 22, 2)
				pc(fst.italic, 3, 23)
				pc(fst.underline, 4, 24, 21)
				pc(fst.blink, 5)
				pc(fst.inverse, 7)
				pc(fst.invisible, 8)
				pc(fst.strikethrough, 9)

				cc(fst.color)
				cc(fst.bgColor, 10)
			}
		}

		return this.writeCSI(`${codes.join(';')}m`) */
		return this.write(TUI.compStyle(...arguments))
	}

	/** Sets cursor style to default. */
	cursorStyle(): this
	/** Set cursor style.
	 * 0 ⇒ blinking block
	 * 1 ⇒ blinking block (default)
	 * 2 ⇒ steady block
	 * 3 ⇒ blinking underline
	 * 4 ⇒ steady underline
	 * 5 ⇒ blinking bar, xterm
	 * 6 ⇒ steady bar, xterm
	 * */
	cursorStyle(code: number): this
	/** Sets cursor style. */
	cursorStyle(style: keyof typeof CURSOR_STYLES): this
	cursorStyle(opt: keyof typeof CURSOR_STYLES | number = 1) {
		let code: number

		if (typeof opt === 'number') {
			if (!Number.isInteger(opt) || opt < 0 || opt > 6)
				throw new Error(`Invalid style code: ${opt}`, { cause: opt })

			code = opt
		} else {
			if (!Object.hasOwn(CURSOR_STYLES, opt))
				throw new Error(`Invalid style: "${opt}"`, { cause: opt })

			code = CURSOR_STYLES[opt]
		}

		return this.writeCode(`${code} q`)
	}

	cursorVisible(is = true) {
		return this.setCSIBool('?25', is)
	}

	altBuffer(val: boolean) {
		return this.setCSIBool('?1049', val)
	}

	protected readonly _closeListener = (err: boolean) => {
		if (this.#active) {
			this.emit('close', err)
		}
	}

	protected readonly _endListener = () => {
		if (this.#active) {
			this.emit('end')
		}
	}

	protected readonly _dataListener = (data: Buffer) => {
		if (this.#active) {
			this.emit('data', data)

			if (
				(this.options.exitOnCtrlC && data.equals(this.CTRL_C))
				|| (this.options.exitOnCtrlD && data.equals(this.CTRL_D))
			) this.emit('end')
		}
	}

	protected readonly _resizeListener = () => {
		if (this.#active) {
			this.emit('resize', this.width, this.height)
		}
	}

	get active() {
		return this.#active
	}
	set active(val) {
		if (val) this.init()
		else this.exit()
	}

	get absX() {
		return 1
	}

	get absY() {
		return 1
	}

	get width() {
		return this.sout.columns
	}

	get height() {
		return this.sout.rows
	}

	get CTRL_C() {
		return ETX
	}

	get CTRL_D() {
		return EOT
	}

	/** Clears styles. */
	static compStyle(): string
	/** For explanation see [documentation (Character Attributes (SGR))](https://invisible-island.net/xterm/ctlseqs/ctlseqs.html#h3-Functions-using-CSI-_-ordered-by-the-final-character_s_). */
	static compStyle(options: Style): string
	/** For explanation see [documentation (Character Attributes (SGR)](https://invisible-island.net/xterm/ctlseqs/ctlseqs.html#h3-Functions-using-CSI-_-ordered-by-the-final-character_s_). */
	static compStyle(...codes: number[]): string
	static compStyle(fst?: Style | number, ...rst: number[]) {
		let codes: number[] = []
		if (typeof fst == 'number') {
			codes = [fst, ...rst]
		} else {
			if (!fst || fst.reset) codes = [0]
			else {
				const pc = (opt: Style['bold'], t: number, f = t + 20, d = t) => {
					if (opt !== undefined)
						codes.push(opt ? (opt === 2 ? d : t) : f)
				}

				const cc = (clr?: Color, off = 0) => {
					if (clr !== undefined) {
						if (clr === 'default') codes.push(39 + off)
						else if (typeof clr === 'number') {
							if (!Number.isInteger(clr) || clr < 0 || clr > 255)
								throw new Error(`Invalid index color: ${clr}`, { cause: clr })

							codes.push(38 + off, 5, clr)
						} else if (clr.startsWith('#')) {
							const regexArr = /^#([0-F]{2})([0-F]{2})([0-F]{2})$/i.exec(clr)
							if (!regexArr)
								throw new Error(`Invalid hex color: ${clr}`, { cause: clr })

							codes.push(38 + off, 2,
								parseInt(regexArr[1], 16),
								parseInt(regexArr[2], 16),
								parseInt(regexArr[3], 16)
							)
						} else {
							const colorArr = clr.split('-')

							switch (colorArr.length) {
								case 2:
									const brt = colorArr.shift()
									if (brt !== 'bright') break
									off += 60
								case 1:
									const clr = colorArr[0] as 'red'
									if (!(clr in COLOR_LIST)) break
									codes.push(COLOR_LIST[clr] + off)
									return
							}

							throw new Error(`Invalid color name: ${clr}`, { cause: clr })
						}
					}
				}

				pc(fst.bold, 1, 22, 2)
				pc(fst.italic, 3, 23)
				pc(fst.underline, 4, 24, 21)
				pc(fst.blink, 5)
				pc(fst.inverse, 7)
				pc(fst.invisible, 8)
				pc(fst.strikethrough, 9)

				cc(fst.color)
				cc(fst.bgColor, 10)
			}
		}

		return `\x1B[${codes.join(';')}m`
	}
}

const linerize = (str: string, width: number, firstWidth = width, tabSize = 4) => {
	const lines: string[][] = []
	let line: string[] = []
	let cursor = 0

	for (let char of str) {
		const cp = char.codePointAt(0)!
		if (
			(0 < cp && cp < 9) ||
			(10 < cp && cp < 13) ||
			(13 < cp && cp < 32) ||
			(127 < cp && cp < 160)
		) char = '\uFFFF'
		else if (cp === 9)
			char = ' '.repeat(tabSize)
		else if (cp === 10) {
			lines.push(line)
			line = []
			cursor = 0
		} else if (cp === 13) {
			cursor = 0
			continue
		}

		const w = lines.length ? width : firstWidth
		if (char.length > w) continue

		const newLen = cursor + char.length
		if (newLen > w) {
			lines.push(line)
			line = char.split('')
			cursor = char.length
		} else {
			line.splice(cursor, char.length, ...char.split(''))
			cursor += char.length
		}
	}
	lines.push(line)

	return lines.map(l => l.join(''))
}

const rect = (
	col: number, row: number,
	width: number, height: number,
	char: string
) => {
	char = char.charAt(0)

	const line = `${char}\x1B[${width - 1}b`
	const lines = Array(height).fill(line)
	const block = lines.join(`\x1b[${width}D\x1b[1B`)
	return `\x1B7\x1B[${row};${col}H${block}\x1B8`
}

/* CSI Pt ; Pl ; Pb ; Pr $ {
	Selective Erase Rectangular Area (DECSERA), VT400 and up.
	Pt ; Pl ; Pb ; Pr denotes the rectangle.
*/
const clearRect = (
	col: number, row: number,
	width: number, height: number
) => `\x1B[${row};${col};${row + height - 1};${col + width - 1}\${`

const border = (
	col: number, row: number,
	width: number, height: number,
	char: string, lineWidth = 1
) => {
	char = char.charAt(0)
	lineWidth = Math.min(
		lineWidth,
		Math.floor(height / 2),
		Math.floor(width / 2)
	)

	const line = `${char}\x1B[${width - 1}b`
	const vert = char + (lineWidth - 1 > 1 ? `\x1B[${lineWidth - 1}b` : '')
	const hollowLine = `${vert}\x1B[${Math.max(0, width - lineWidth * 2)}C${vert}`
	const lines = [
		...Array(lineWidth).fill(line),
		...Array(height - lineWidth * 2).fill(hollowLine),
		...Array(lineWidth).fill(line),
	]
	const block = lines.join(`\x1b[${width}D\x1b[1B`)
	return `\x1B7\x1B[${row};${col}H${block}\x1B8`
}

const textArea = (
	col: number, row: number,
	width: number, height: number,
	text: string,
	scroll = true
) => {
	let lines = linerize(text, width)
	const start = scroll ? Math.max(lines.length - height, 0) : 0
	const end = scroll || lines.length < height ? undefined : height
	lines = lines.slice(start, end)
	const block = lines.join(`\x1b[${width}D\x1b[1B`)
	return `\x1B7\x1B[${row};${col}H${block}\x1B8`
}