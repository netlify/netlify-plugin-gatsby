import { NetlifyPluginConstants } from '@netlify/build'
import { copy, copyFile, ensureDir, existsSync, rm, writeFile } from 'fs-extra'
import { resolve, join, relative } from 'pathe'

import { makeApiHandler, makeHandler } from '../templates/handlers'

import { getGatsbyRoot } from './config'

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

const writeApiFunction = async ({ appDir, functionDir }) => {
  const source = makeApiHandler(appDir)
  // This is to ensure we're copying from the compiled js, not ts source
  await copy(
    join(__dirname, '..', '..', 'lib', 'templates', 'api'),
    functionDir,
  )
  await writeFile(join(functionDir, '__api.js'), source)
}

export const writeFunctions = async ({
  INTERNAL_FUNCTIONS_SRC,
  PUBLISH_DIR,
}: NetlifyPluginConstants): Promise<void> => {
  const siteRoot = getGatsbyRoot(PUBLISH_DIR)
  const functionDir = resolve(INTERNAL_FUNCTIONS_SRC, '__api')
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

  await writeApiFunction({ appDir, functionDir })
}

export const deleteFunctions = async ({
  INTERNAL_FUNCTIONS_SRC,
}: NetlifyPluginConstants): Promise<void> => {
  for (const func of ['__api', '__ssr', '__dsg']) {
    const funcDir = resolve(INTERNAL_FUNCTIONS_SRC, func)
    if (existsSync(funcDir)) {
      await rm(funcDir, { recursive: true, force: true })
    }
  }
}
