import ExtendedEventEmitter from '../events'

export default class MetricBox extends ExtendedEventEmitter<{ change: [] }> {
	#top: number
	#right: number
	#bottom: number
	#left: number

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
		this.#top = +(t?.top ?? t) || 0
		this.#right = +(t?.right ?? r ?? t) || 0
		this.#bottom = +(t?.bottom ?? b ?? t) || 0
		this.#left = +(t?.left ?? l ?? r ?? t) || 0
	}

	get top() { return this.#top }
	set top(v) {
		if (this.#top !== v) {
			this.#top = v
			this.emit('change')
		}
	}

	get right() { return this.#right }
	set right(v) {
		if (this.#right !== v) {
			this.#right = v
			this.emit('change')
		}
	}

	get bottom() { return this.#bottom }
	set bottom(v) {
		if (this.#bottom !== v) {
			this.#bottom = v
			this.emit('change')
		}
	}

	get left() { return this.#left }
	set left(v) {
		if (this.#left !== v) {
			this.#left = v
			this.emit('change')
		}
	}

	get inline(): number { return this.#left + this.#right }
	set inline(v: number | [left: number, right: number]) {
		const left = this.#left
		const right = this.#right

		if (typeof v === 'number')
			this.#left = this.#right = v
		else [this.#left, this.#right] = v

		if (this.#left !== left || this.#right !== right)
			this.emit('change')
	}

	get block(): number { return this.#top + this.#bottom }
	set block(v: number | [top: number, bottom: number]) {
		const top = this.#top
		const bottom = this.#bottom

		if (typeof v === 'number')
			this.#top = this.#bottom = v
		else [this.#top, this.#bottom] = v

		if (this.#top !== top || this.#bottom !== bottom)
			this.emit('change')
	}

	get all(): number { return this.inline + this.block }
	set all(v: number | [top: number, right: number, bottom?: number, left?: number]) {
		const top = this.#top
		const right = this.#right
		const bottom = this.#bottom
		const left = this.#left

		if (typeof v === 'number')
			this.#top = this.#right = this.#bottom = this.#left = v
		else {
			this.#top = v[0]
			this.#right = v[1]
			this.#bottom = v[2] ?? v[0]
			this.#left = v[3] ?? v[1]
		}

		if (
			this.#top !== top ||
			this.#right !== right ||
			this.#bottom !== bottom ||
			this.#left !== left
		) this.emit('change')
	}
}
