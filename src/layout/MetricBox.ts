import ExtendedEventEmitter from '../events'

type MetricBoxEvents = { resize: [] }

export default class MetricBox extends ExtendedEventEmitter<MetricBoxEvents> {
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
			this.emit('resize')
		}
	}

	get right() { return this.#right }
	set right(v) {
		if (this.#right !== v) {
			this.#right = v
			this.emit('resize')
		}
	}

	get bottom() { return this.#bottom }
	set bottom(v) {
		if (this.#bottom !== v) {
			this.#bottom = v
			this.emit('resize')
		}
	}

	get left() { return this.#left }
	set left(v) {
		if (this.#left !== v) {
			this.#left = v
			this.emit('resize')
		}
	}

	set inline(v: number | [left: number, right: number]) {
		const left = this.#left
		const right = this.#right

		if (typeof v === 'number')
			this.#left = this.#right = v
		else [this.#left, this.#right] = v

		if (this.#left !== left || this.#right !== right)
			this.emit('resize')
	}

	set block(v: number | [top: number, bottom: number]) {
		const top = this.#top
		const bottom = this.#bottom

		if (typeof v === 'number')
			this.#top = this.#bottom = v
		else [this.#top, this.#bottom] = v

		if (this.#top !== top || this.#bottom !== bottom)
			this.emit('resize')
	}

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
		) this.emit('resize')
	}
}
