import { join } from 'path'

import fs from 'fs-extra'

const SSR_FUNCTION = /* ts */ `
  import { getHandler } from "./handler"
  export const handler = getHandler('SSR')
`

const DSG_FUNCTION = /* ts */ `
  import { builder } from "@netlify/functions"
  import { getHandler } from "./handler"
  export const handler = builder(getHandler('DSG'))
`

export const generateFunctions = async ({
  functionsSrcDir,
}: {
  functionsSrcDir: string
}): Promise<void> => {
  // copying Netlify wrapper functions into functions directory

  await fs.copy(
    join(__dirname, '..', '..', 'src', 'templates', 'api'),
    join(functionsSrcDir, `__api`),
  )

  await fs.copy(
    join(__dirname, '..', '..', 'src', 'templates', 'shared'),
    join(functionsSrcDir, `__dsg`),
  )

  await fs.writeFile(join(functionsSrcDir, `__dsg`, '__dsg.ts'), DSG_FUNCTION)

  await fs.copy(
    join(__dirname, '..', '..', 'src', 'templates', 'shared'),
    join(functionsSrcDir, `__ssr`),
  )

  await fs.writeFile(join(functionsSrcDir, `__ssr`, '__ssr.ts'), SSR_FUNCTION)
}
