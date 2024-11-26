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

type WrapperData<K, T extends EventMap<T>> = {
	readonly _listener: ExtendedListener<K, T>
	_propagation: boolean
	_once: boolean
	readonly type: Key<K, T>
	readonly emitter: ExtendedEventEmitter<T>
	stopPropagation(): void
	stopImmediatePropagation(): void
	remove(): void
}
type ExtendedListener<K, T extends EventMap<T>> = (this: WrapperData<K, T>, ...args: Parameters<Listener<K, T>>) => void
type Events<K extends Key2<T>, T extends EventMap<T>> = Partial<Record<K, (WrapperData<K, T> & OmitThisParameter<ExtendedListener<K, T>>)[]>>

const asyncLocalStorage = new AsyncLocalStorage<Map<ExtendedEventEmitter<any> | null, Key2<any>[]>>()

/** Custom variant of Event Emitter with useful methods from both Node.JS and Web versions. */
export default class ExtendedEventEmitter<T extends EventMap<T> = DefaultEventMap> implements EventEmitter<T> {
	protected _events: Events<Key2<T>, T> = {}
	protected _maxListeners = 10

	addListener<K>(eventName: Key<K, T>, listener: ExtendedListener<K, T>, once = false, toEnd = true) {
		const e = this._events

		if (!(eventName as Key2<T> in e))
			e[eventName as Key2<T>] = []

		const arr = e[eventName as Key2<T>]!

		if (this._maxListeners && this._maxListeners <= arr.length)
			console.warn(`MaxListenersExceededWarning: Possible ExtendedEventEmitter memory leak detected. ${arr.length + 1} ${eventName} listeners added to [ExtendedEventEmitter]. Use emitter.setMaxListeners() to increase limit`)

		let propagation = true
		const emitter = this
		const dataProperties = {
			_listener: {
				get() { return listener }
			},
			_propagation: {
				get() { return propagation },
				set(v) { propagation = !!v }
			},
			_once: {
				get() { return once },
				set(v) { once = !!v }
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
			stopImmediatePropagation: {
				get() { return () => { propagation = false } }
			},
			remove: {
				get() { return () => { once = true } }
			}
		} as PropertyDescriptorMap
		const data = Object.defineProperties({}, dataProperties) as WrapperData<K, T>

		function wrapper(this: WrapperData<K, T>, ...args: Parameters<typeof listener>) {
			listener.apply(this, args)
			if (this._once) {
				const i = arr.indexOf(wrappedListener as any)
				arr.splice(i, 1)
				if (!arr.length) delete e[eventName as Key2<T>]
			}
		}

		const wrappedListener = wrapper.bind(data)

		Object.defineProperties(wrappedListener, dataProperties)

		arr[toEnd ? 'push' : 'unshift'](wrappedListener as any)
		return this
	}

	on<K>(eventName: Key<K, T>, listener: ExtendedListener<K, T>, once = false, toEnd = true) {
		return this.addListener(eventName, listener, once, toEnd)
	}

	once<K>(eventName: Key<K, T>, listener: ExtendedListener<K, T>, toEnd = true) {
		return this.on(eventName, listener, true, toEnd)
	}

	prependListener<K>(eventName: Key<K, T>, listener: ExtendedListener<K, T>, once = false) {
		return this.on(eventName, listener, once, false)
	}

	pre<K>(eventName: Key<K, T>, listener: ExtendedListener<K, T>, once = false) {
		return this.prependListener(eventName, listener, once)
	}

	prependOnceListener<K>(eventName: Key<K, T>, listener: ExtendedListener<K, T>) {
		return this.once(eventName, listener, false)
	}

	preOnce<K>(eventName: Key<K, T>, listener: ExtendedListener<K, T>) {
		return this.prependOnceListener(eventName, listener)
	}

	removeListener<K>(eventName: Key<K, T>, listener: ExtendedListener<K, T>) {
		const arr = this._events[eventName as Key2<T>]

		if (arr) {
			const i = arr.findLastIndex(l => l._listener === listener)
			arr.splice(i, 1)
			if (!arr.length) delete this._events[eventName as Key2<T>]
		}
		return this
	}

	off<K>(eventName: Key<K, T>, listener: ExtendedListener<K, T>) {
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

	rawListeners<K>(eventName: Key<K, T>): (WrapperData<K, T> & Listener<K, T>)[] {
		const arr = this._events[eventName as Key2<T>] ?? []
		return [...arr] as any
	}

	listeners<K>(eventName: Key<K, T>): Listener<K, T>[] {
		return this.rawListeners(eventName).map(e => e._listener) as any
	}

	emit<K>(eventName: Key<K, T>, ...args: Args<K, T>): boolean {
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
				// @ts-expect-error TS is really stupid
				e(...args)
				if (!e._propagation) {
					e._propagation = true
					break
				}
			}
			return true
		}
		return false
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
	suppress(fn: () => void): Key2<T>[] {
		return ExtendedEventEmitter.suppress(fn, this).get(this) as any
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
	 * })
	 *
	 * ExtendedEventEmitter.suppress(() => {
	 * 	a.emit('test', 'A | A Suppressed')
	 * 	b.emit('test', 'B | A Suppressed')
	 * }, a)
	 *
	 * b.suppress(() => {
	 * 	a.emit('test', 'A | B Suppressed')
	 * 	b.emit('test', 'B | B Suppressed')
	 * })
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
	 * @returns {(string[]|Map<ExtendedEventEmitter,string[]>)} List of all suppressed events or a Map with lists mapped to ExtendedEventEmitter`s that emitted them
	 */
	static suppress(fn: () => void): Key2<any>[]
	static suppress(fn: () => void, ...targets: ExtendedEventEmitter<any>[]): Map<ExtendedEventEmitter<any>, Key2<any>[]>
	static suppress(fn: () => void, ...targets: ExtendedEventEmitter<any>[]): Map<ExtendedEventEmitter<any>, Key2<any>[]> | Key2<any>[] {
		const tgt = targets.length ? targets : [null] as const
		const map = new Map(tgt.map(v => [v, []]))
		asyncLocalStorage.run(map, fn)

		return map.get(null) ?? map as Map<ExtendedEventEmitter<any>, Key2<any>[]>
	}
}
