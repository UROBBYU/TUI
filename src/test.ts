import { TUI } from '.'
import { Panel } from './layout/Panel'

type Keys = {
	default: { [code: string]: string }
} & {
	[charset: string]: { [code: string]: string }
}

const KeyDB: Keys = require('./keys.json')

const tui = new TUI(
	process.stdin,
	process.stdout
)

/* tui.on('data', function(data) {
	if (data.equals(Buffer.of(16))) {
		tui.preOnce('data', function(data) {
			const regArr = /\x1B\[(\d+);(\d+)R/.exec(data.toString('utf8'))
			if (!regArr) return

			const [, r, c] = regArr
			tui.style(96).write('Cursor pos is: ')
			.style(93).writeLine(`[${c}; ${r}]`).style()

			this.stopPropagation()
		}).writeCSI('6n')
	} else tui
		.style({ color: 'black', bgColor: 'magenta' })
		.writeLine(`<Buffer ${Array.from(data).map(d => `${d < 10 ? 0 : ''}${d.toString(16)}`).join(' ')}>`)
		.style()
})
.on('resize', (w, h) => tui
	.style({ color: 'bright-cyan' }).write('Terminal size is: ')
	.style(93).writeLine(`${w}x${h}`).style()
).init()
.emit('resize', tui.width, tui.height)

Array(256).fill(1).reduce<TUI>(
	(t,v,i) => t.style({ color: i }).write(`${i} `),
	tui.style({ bgColor: '#1e1e1e' }).writeLine('Index Palette:')
).endl().style() */

/* tui.on('resize', () => {
	tui.writeCSI('2J').moveTo(.5, .5).write('O')
}).init().emit('resize', 0, 0) */

/* tui.init().cursorVisible(false)
.style({ bgColor: '#444444' })
.write(rect(3, 3, 30, 7, '#'))
.write(clearRect(4, 4, 28, 5))
.write(textArea(6, 5, 24, 3, lorem, false))
.write(textArea(6, 13, 24, 3, lorem))
.write(border(3, 11, 30, 7, 'H', 1))
.style() */

const cyanCode = TUI.style({ color: 'cyan' })
const cyan = (str: string) => `${cyanCode}${str}\x1B[m`

const lorem = `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor ${TUI.style({ color: 'red' })}incididunt${TUI.style()} ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`

const flaskDesc = `${TUI.style({ color: 'magenta', bold: true })}Бездонна фляга:${TUI.style()}
Як сказала нейронка, анігіляція є ${TUI.style({ underline: true })}ненаучною${TUI.style()}. Значить будемо використовувати ефект акумуляції ${cyan('мани')}. Для наповнення фляги потрібно ${cyan('ману')} подати, при опустошенні флаги ${cyan('мана')} вивільняється назад. При руйнуванні оболонки, вся ${cyan('мана')}, конвертована в потенційну енергію, миттєво вивільняється і звідси ${TUI.style({ color: 'bright-red', bold: true })}вибух${TUI.style()}. Все просто та реалістично. Тільки тепер флягу прийдеться наповнювати доволі довго, адже для великого ${TUI.style({ color: 'bright-red', bold: true })}вибуху${TUI.style()} потрібно багато енергії.`

const panel1 = new Panel(tui)
panel1.margin.top = 1
panel1.margin.right = 2
panel1.margin.bottom = 3
panel1.margin.left = 4
panel1.border.top.style = 'double'
panel1.border.top.fill = 'lines'
panel1.border.top.width = 4
panel1.border.right.style = 'double'
panel1.border.right.fill = 'lines'
panel1.border.right.width = 3
panel1.border.bottom.style = 'double'
panel1.border.bottom.width = 0
panel1.border.left.style = 'double'
panel1.border.left.fill = 'lines'
panel1.border.left.width = 1

const panel2 = new Panel(panel1)
panel2.border.top.style = 'round'
panel2.border.top.left.color = 'red'
panel2.border.top.color = 'green'
panel2.border.top.right.color = 'blue'
panel2.border.top.width = 2
panel2.border.right.color = 'cyan'
panel2.border.right.width = 2
panel2.border.bottom.style = 'round'
panel2.border.bottom.left.color = 'yellow'
panel2.border.bottom.color = 'bright-yellow'
panel2.border.bottom.right.color = 'bright-cyan'
panel2.border.bottom.width = 2
panel2.border.left.color = 'bright-red'
panel2.border.left.width = 2
panel2.padding.top = 1
panel2.padding.right = 2
panel2.padding.bottom = 1
panel2.padding.left = 2
panel2.minWidth = 30
panel2.maxWidth = 70
panel2.color = '#FFD700'
panel2.wordWrap = true
panel2.innerText = flaskDesc

const redraw = () => {
	tui.erase().moveTo()
	panel1.draw()
	panel2.draw()
}

tui.on('resize', redraw)
.once('close', () => tui.cursorVisible())
.init().cursorVisible(false)
.on('data', data => {
	const keyName = KeyDB.default[data.join()]

	switch (keyName) {
		case 'ArrowUp':
			panel2.scroll += panel2.scrollDirection === 'up' ? 1 : -1
			break
		case 'ArrowDown':
			panel2.scroll += panel2.scrollDirection === 'down' ? 1 : -1
			break
		case 'ArrowLeft':
			panel2.scrollDirection = 'down'
			break
		case 'ArrowRight':
			panel2.scrollDirection = 'up'
			break
		default:
			return
	}

	redraw()
}).emit('resize', 0, 0)

// console.log(TUI.fitString(flaskDesc, 37, 37, true, 4, TUI.style({ color: '#FFD700' })))