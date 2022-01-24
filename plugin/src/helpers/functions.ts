import process from 'process'

import { NetlifyPluginConstants } from '@netlify/build'
import { copy, copyFile, ensureDir, writeFile } from 'fs-extra'
import { resolve, join, relative } from 'pathe'

import { makeHandler } from '../templates/handlers'

const writeFunction = async ({
  renderMode,
  handlerName,
  appDir,
  functionsSrc,
}) => {
  const source = makeHandler(appDir, renderMode)
  await ensureDir(join(functionsSrc, handlerName))
  await writeFile(join(functionsSrc, handlerName, `${handlerName}.js`), source)
  await copyFile(
    join(__dirname, '..', '..', 'lib', 'templates', 'utils.js'),
    join(functionsSrc, handlerName, 'utils.js'),
  )
}

export const writeFunctions = async ({
  INTERNAL_FUNCTIONS_SRC,
  PUBLISH_DIR,
}: NetlifyPluginConstants): Promise<void> => {
  const siteRoot = resolve(process.cwd(), PUBLISH_DIR, '..')
  const functionDir = join(process.cwd(), INTERNAL_FUNCTIONS_SRC, '__api')
  const appDir = relative(functionDir, siteRoot)

  await writeFunction({
    renderMode: 'SSR',
    handlerName: '__ssr',
    appDir,
    functionsSrc: INTERNAL_FUNCTIONS_SRC,
  })

  await writeFunction({
    renderMode: 'DSG',
    handlerName: '__dsg',
    appDir,
    functionsSrc: INTERNAL_FUNCTIONS_SRC,
  })

  await copy(
    join(__dirname, '..', '..', 'lib', 'templates', 'api'),
    functionDir,
  )
}
