import ExtendedEventEmitter from '../events'
import { InlineSetter, BlockSetter, AllSetter } from '@urobbyu/tui/ts'

export default class MetricBox extends ExtendedEventEmitter<{ change: [] }> {
	private _top: number
	private _right: number
	private _bottom: number
	private _left: number

	constructor()
	constructor(options: {
		top?: number
		right?: number
		bottom?: number
		left?: number
	})
	constructor(top: number, right?: number, bottom?: number, left?: number)
	constructor(...args: any[]) {
		super()

		const [t, r, b, l] = args
		this._top = +(t?.top ?? t) || 0
		this._right = +(t?.right ?? r ?? t) || 0
		this._bottom = +(t?.bottom ?? b ?? t) || 0
		this._left = +(t?.left ?? l ?? r ?? t) || 0
	}

	get top() { return this._top }
	set top(v) {
		if (this._top !== v) {
			this._top = v
			this.emit('change')
		}
	}

	get right() { return this._right }
	set right(v) {
		if (this._right !== v) {
			this._right = v
			this.emit('change')
		}
	}

	get bottom() { return this._bottom }
	set bottom(v) {
		if (this._bottom !== v) {
			this._bottom = v
			this.emit('change')
		}
	}

	get left() { return this._left }
	set left(v) {
		if (this._left !== v) {
			this._left = v
			this.emit('change')
		}
	}

	get inline(): number { return this._left + this._right }
	set inline(v: InlineSetter) {
		const left = this._left
		const right = this._right

		if (typeof v === 'number')
			this._left = this._right = v
		else [this._left, this._right] = v

		if (this._left !== left || this._right !== right)
			this.emit('change')
	}

	get block(): number { return this._top + this._bottom }
	set block(v: BlockSetter) {
		const top = this._top
		const bottom = this._bottom

		if (typeof v === 'number')
			this._top = this._bottom = v
		else [this._top, this._bottom] = v

		if (this._top !== top || this._bottom !== bottom)
			this.emit('change')
	}

	get all(): number { return this.inline + this.block }
	set all(v: AllSetter) {
		const top = this._top
		const right = this._right
		const bottom = this._bottom
		const left = this._left

		if (typeof v === 'number')
			this._top = this._right = this._bottom = this._left = v
		else {
			this._top = v[0]
			this._right = v[1]
			this._bottom = v[2] ?? v[0]
			this._left = v[3] ?? v[1]
		}

		if (
			this._top !== top ||
			this._right !== right ||
			this._bottom !== bottom ||
			this._left !== left
		) this.emit('change')
	}
}
