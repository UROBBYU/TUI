import assert from 'node:assert/strict'
import sh from 'shelljs'
import pkg from './package.json' with { type: 'json' }

const tscRes = sh.exec('npx tsc --noEmit')
if (tscRes.code) process.exit(tscRes.code)

const tagName = `v${pkg.version}`
const releaseBranch = `release/${tagName}`
const branches = sh.exec('git branch', { silent: true }).split('\n')
let curBranch
for (let i = 0; i < branches.length; i++) {
	let name = branches[i].trim()

	if (!name) {
		branches.splice(i, 1)
		continue
	}

	if (name.startsWith('* ')) {
		curBranch = name = name.substring(2)
	}

	branches[i] = name
}

assert.equal(curBranch, 'main', 'All releases should be created from the main branch.')
assert(!branches.includes(releaseBranch), `Release branch ${releaseBranch} already exists.`)

const gitLog = sh.exec('git log', { silent: true })
const resolves = Array.from(new Set(Array.from(gitLog.split('\n    Bumped version to ')[0]?.matchAll(/\s+Resolves:? (#\d+)\s+/g) ?? []).map(m => m[1])))

const tagMessage = resolves.length ? `Resolved: ${resolves.join(', ')}` : ''

sh.exec(`git checkout -b ${releaseBranch}`)
sh.exec('git add .')
sh.exec(`git commit -m "Bumped version to ${pkg.version}"`)
sh.exec(`git tag ${tagName} -m "${tagMessage}"`)
sh.exec('git checkout main')
sh.exec(`git merge ${releaseBranch}`)
sh.exec(`git push origin ${releaseBranch}`)
sh.exec(`git push origin tag ${tagName}`)
sh.exec('git push origin main')