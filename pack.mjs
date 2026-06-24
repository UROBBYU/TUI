import sh from 'shelljs'
import fs from 'fs'
import pkg from './package.json' with { type: 'json' }

delete pkg.scripts
delete pkg.devDependencies

sh.exec('npm run build')
fs.writeFileSync('./dist/package.json', JSON.stringify(pkg, null, 2))
sh.mv(sh.exec('npm pack ./dist').trim(), './package.tgz')
sh.exec('npm run clear')