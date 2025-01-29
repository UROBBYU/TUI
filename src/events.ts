import { EventEmitter } from 'node:events'
import { AsyncLocalStorage } from 'node:async_hooks'

type DefaultEventMap = [never]
type EventMap<T> = Record<keyof T, any[]> | DefaultEventMap
type IfDef<K, T, F> = K extends DefaultEventMap ? T : F
type AnyRest = [...args: any[]]
type Args<K, T> = IfDef<T, AnyRest, K extends keyof T ? (T[K] extends unknown[] ? [...T[K]] : never) : never>
type Key<K, T> = IfDef<T, string | symbol, K | keyof T>
type Key2<T> = IfDef<T, string | symbol, keyof T>
type Listener<K, T> = IfDef<T, (...args: any[]) => void, (K extends keyof T ? (T[K] extends unknown[] ? (...args: T[K]) => void : never) : never)>

type WrapperData<K, T extends EventMap<T>, E extends ExtendedEventEmitter<T>> = {
	readonly _listener: ExtendedListener<K, T, E>
	_propagation: boolean
	_default: boolean
	_once: boolean
	_level: number
	readonly type: Key<K, T>
	readonly emitter: E
	stopPropagation(): void
	preventDefault(): void
	remove(): void
}
type ExtendedListener<K, T extends EventMap<T>, E extends ExtendedEventEmitter<T>> = (this: WrapperData<K, T, E>, ...args: Parameters<Listener<K, T>>) => void
type Events<K extends Key2<T>, T extends EventMap<T>, E extends ExtendedEventEmitter<T>> = Partial<Record<K, (WrapperData<K, T, E> & OmitThisParameter<ExtendedListener<K, T, E>>)[]>>

/**
 * Suppressed function.
 * @name SuppressedFunc
 * @function
 * @returns {(string[]|Map<ExtendedEventEmitter,string[]>)} List of all suppressed events or a Map with lists mapped to ExtendedEventEmitter`s that emitted them
 */
type SuppressedFunc = () => Map<ExtendedEventEmitter<any>, Key2<any>[]> | Key2<any>[]

const asyncLocalStorage = new AsyncLocalStorage<Map<ExtendedEventEmitter<any> | null, Key2<any>[]>>()

/** Custom variant of Event Emitter with useful methods from both Node.JS and Web versions. */
export default class ExtendedEventEmitter<T extends EventMap<T> = DefaultEventMap> implements EventEmitter<T> {
	protected _events: Events<Key2<T>, T, this> = {}
	protected _maxListeners = 10

	addListener<K>(eventName: Key<K, T>, listener: ExtendedListener<K, T, this>, once = false, toEnd = true, level = 0) {
		const e = this._events

		if (!(eventName as Key2<T> in e))
			e[eventName as Key2<T>] = []

		const arr = e[eventName as Key2<T>]!

		if (this._maxListeners && this._maxListeners <= arr.length)
			console.warn(`MaxListenersExceededWarning: Possible ExtendedEventEmitter memory leak detected. ${arr.length + 1} ${eventName} listeners added to [ExtendedEventEmitter]. Use emitter.setMaxListeners() to increase limit`)

		let propagation: boolean
		let def: boolean
		const emitter = this
		const dataProperties = {
			_listener: {
				get() { return listener }
			},
			_propagation: {
				get() { return propagation },
				set(v) { propagation = !!v }
			},
			_default: {
				get() { return def },
				set(v) { def = !!v }
			},
			_once: {
				get() { return once },
				set(v) { once = !!v }
			},
			_level: {
				get() { return level }
			},
			type: {
				get() { return eventName }
			},
			emitter: {
				get() { return emitter }
			},
			stopPropagation: {
				get() { return () => { propagation = false } }
			},
			preventDefault: {
				get() { return () => { def = false } }
			},
			remove: {
				get() { return () => { once = true } }
			}
		} as PropertyDescriptorMap
		type W = WrapperData<K, T, this>
		const data = Object.defineProperties({}, dataProperties) as W

		function wrapper(this: W, ...args: Parameters<typeof listener>) {
			propagation = true
			listener.apply(this, args)
			if (this._once) {
				const i = arr.indexOf(wrappedListener as any)
				arr.splice(i, 1)
				if (!arr.length) delete e[eventName as Key2<T>]
			}
		}

		const wrappedListener = wrapper.bind(data)

		Object.defineProperties(wrappedListener, dataProperties)

		if (toEnd) {
			var i = arr.findLastIndex(v => v._level <= level) + 1
			if (!i) i = 0
		} else {
			var i = arr.findIndex(v => v._level >= level)
			if (!~i) i = arr.length
		}
		arr.splice(i, 0, wrappedListener as any)

		return this
	}

	on<K>(eventName: Key<K, T>, listener: ExtendedListener<K, T, this>, level = 0) {
		return this.addListener(eventName, listener, false, true, level)
	}

	once<K>(eventName: Key<K, T>, listener: ExtendedListener<K, T, this>, level = 0) {
		return this.addListener(eventName, listener, true, true, level)
	}

	prependListener<K>(eventName: Key<K, T>, listener: ExtendedListener<K, T, this>, once = false, level = 0) {
		return this.addListener(eventName, listener, once, false, level)
	}

	pre<K>(eventName: Key<K, T>, listener: ExtendedListener<K, T, this>, level = 0) {
		return this.prependListener(eventName, listener, false, level)
	}

	prependOnceListener<K>(eventName: Key<K, T>, listener: ExtendedListener<K, T, this>, level = 0) {
		return this.prependListener(eventName, listener, true, level)
	}

	preOnce<K>(eventName: Key<K, T>, listener: ExtendedListener<K, T, this>, level = 0) {
		return this.prependOnceListener(eventName, listener, level)
	}

	removeListener<K>(eventName: Key<K, T>, listener: ExtendedListener<K, T, this>) {
		const arr = this._events[eventName as Key2<T>]

		if (arr) {
			const i = arr.findLastIndex(l => l._listener === listener)
			arr.splice(i, 1)
			if (!arr.length) delete this._events[eventName as Key2<T>]
		}
		return this
	}

	off<K>(eventName: Key<K, T>, listener: ExtendedListener<K, T, this>) {
		return this.removeListener(eventName, listener)
	}

	removeAllListeners(eventName?: Key<unknown, T>) {
		if (eventName === undefined) this._events = {}
		else delete this._events[eventName as Key2<T>]
		return this
	}

	setMaxListeners(n: number) {
		this._maxListeners = n
		return this
	}

	getMaxListeners(): number {
		return this._maxListeners
	}

	rawListeners<K>(eventName: Key<K, T>): (WrapperData<K, T, this> & Listener<K, T>)[] {
		const arr = this._events[eventName as Key2<T>] ?? []
		return [...arr] as any
	}

	listeners<K>(eventName: Key<K, T>): Listener<K, T>[] {
		return this.rawListeners(eventName).map(e => e._listener) as any
	}

	emitDef<K>(eventName: Key<K, T>, def = true, ...args: Args<K, T>): boolean {
		const suppMap = asyncLocalStorage.getStore()
		const suppAll = suppMap?.get(null)
		const suppThis = suppMap?.get(this)
		const isSuppressed = suppAll || suppThis

		if (isSuppressed) {
			(suppThis ?? suppAll)?.push(eventName as any)
			return false
		}

		if (eventName as Key2<T> in this._events) {
			for (const e of [...this._events[eventName as Key2<T>]!]) {
				e._default = def
				// @ts-expect-error TS is really stupid
				e(...args)
				def &&= e._default
				if (!e._propagation) {
					e._propagation = true
					break
				}
			}
		}

		return def
	}

	emit<K>(eventName: Key<K, T>, ...args: Args<K, T>): boolean {
		return this.emitDef(eventName, true, ...args)
	}

	listenerCount<K>(eventName: Key<K, T>, listener?: Listener<K, T>): number {
		let arr = this._events[eventName as Key2<T>]
		if (!arr) return 0

		if (listener !== undefined) arr = arr.filter(e => e._listener === listener)
		return arr.length
	}

	eventNames(): ((string | symbol) & Key2<T>)[] {
		return [
			...Object.getOwnPropertyNames(this._events),
			...Object.getOwnPropertySymbols(this._events)
		] as any
	}

	/** Alias for static method `.suppress(fn, ...targets)` with `this` as it's only target. */
	suppress(fn: () => void): () => Key2<T>[] {
		const supp = ExtendedEventEmitter.suppress(fn, this)
		return () => supp().get(this) as any
	}

	/**
	 * Suppresses `.emit()` calls for `targets` that happen anywhere inside `fn` function.
	 *
	 * If `targets` is empty, suppresses all `.emit()` calls.
	 *
	 * ```ts
	 * const a = new ExtendedEventEmitter<{ test: [value: string] }>()
	 * const b = new ExtendedEventEmitter<{ test: [value: string] }>()
	 *
	 * a.on('test', console.log)
	 * b.on('test', console.log)
	 *
	 * a.emit('test', 'A | First')
	 * b.emit('test', 'B | First')
	 *
	 * ExtendedEventEmitter.suppress(() => {
	 * 	a.emit('test', 'A | All Suppressed')
	 * 	b.emit('test', 'B | All Suppressed')
	 * })()
	 *
	 * ExtendedEventEmitter.suppress(() => {
	 * 	a.emit('test', 'A | A Suppressed')
	 * 	b.emit('test', 'B | A Suppressed')
	 * }, a)()
	 *
	 * b.suppress(() => {
	 * 	a.emit('test', 'A | B Suppressed')
	 * 	b.emit('test', 'B | B Suppressed')
	 * })()
	 *
	 * a.emit('test', 'A | Last')
	 * b.emit('test', 'B | Last')
	 *
	 * // Prints:
	 * // A | First
	 * // B | First
	 * // B | A Suppressed
	 * // A | B Suppressed
	 * // A | Last
	 * // B | Last
	 * ```
	 * @returns {SuppressedFunc} Suppressed function
	 */
	static suppress(fn: () => void): () => Key2<any>[]
	static suppress(fn: () => void, ...targets: ExtendedEventEmitter<any>[]): () => Map<ExtendedEventEmitter<any>, Key2<any>[]>
	static suppress(fn: () => void, ...targets: ExtendedEventEmitter<any>[]): SuppressedFunc {
		const tgt = targets.length ? targets : [null] as const

		return () => asyncLocalStorage.run(new Map(tgt.map(v => [v, []])), () => {
			fn()
			const map = asyncLocalStorage.getStore()!
			return map.get(null) ?? map as Map<ExtendedEventEmitter<any>, Key2<any>[]>
		})
	}
}
