import sh from 'shelljs'
import fs from 'fs'

const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))

delete pkg.scripts
delete pkg.devDependencies

sh.exec('npm run build')
fs.writeFileSync('./dist/package.json', JSON.stringify(pkg, null, 2))
sh.exec('npm pack ./dist')
sh.exec('npm run clear')