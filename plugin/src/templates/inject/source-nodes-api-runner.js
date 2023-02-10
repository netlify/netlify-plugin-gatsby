/**
 * This file is used to override node sourcing in Gatsby core so we can add decoupled sourcing to Gatsby
 * This file was copied from Gatsby core and modified and will be copied back into node_modules/gatsby when Netlify does a cold-cache build.
 * See 'helpers/files.ts'
 */

const GatsbyCacheLmdb = require(`./cache-lmdb`).default
const { getDataStore } = require(`../datastore`)
const reporter = require(`gatsby-cli/lib/reporter`)

const SOURCE_PLUGIN_ALLOW_LIST = [
  `gatsby-source-wordpress`,
  `gatsby-source-drupal`,
  `gatsby-source-contentful`,
  `gatsby-source-shopify`,
]

let synchronizerCache
let originalSourceNodesApiRunner
let isFirstSource = true

exports.sourceNodesApiRunner = async function sourceNodesApiRunner(args) {
  const usingMerlin =
    process.env.DECOUPLED_SOURCING === `true` ||
    process.env.DECOUPLED_SOURCING === `1`

  if (!originalSourceNodesApiRunner) {
    originalSourceNodesApiRunner = require(`${__filename}.original`)
  }

  if (!usingMerlin) {
    return originalSourceNodesApiRunner.sourceNodesApiRunner(args)
  }

  process.env.SITE_AUTH_JWT ||= process.env.RESOURCE_AUTH_JWT

  const { synchronize } = require(`@gatsby-cloud-pkg/merlin-synchronizer`)
  const { store } = require(`../redux`)

  const reportContentHubSourcedLog = (
    sourcedFromContentHub = [],
    sourcedFromGatsby = [],
  ) => {
    reporter.info(
      `[Gatsby] Finished sourcing data from Content Hub.\nPlugins sourced from Content Hub: ${sourcedFromContentHub}.\nPlugins sourced in Gatsby: ${sourcedFromGatsby.join(
        `, `,
      )}`,
    )
  }

  synchronizerCache =
    synchronizerCache ||
    new GatsbyCacheLmdb({
      name: `ledger-cache`,
      encoding: `string`,
    }).init()

  const siteId = process.env.CONTENT_CLOUD_ID
  if (!siteId) {
    throw new Error(`Couldn't find CONTENT_CLOUD_ID`)
  }

  const sourcePluginAllowList = SOURCE_PLUGIN_ALLOW_LIST
  if (process.env.EXPERIMENTAL_PLUGIN_ALLOW_LIST) {
    sourcePluginAllowList.push(
      ...process.env.EXPERIMENTAL_PLUGIN_ALLOW_LIST.split(`,`),
    )
  }

  const supportedMerlinSourcePlugins = new Set()
  const unsupportedMerlinSourcePlugins = new Set()
  const sourceAllPlugins = !args.pluginName
  const merlinAlreadySourcedPlugin = sourcePluginAllowList.includes(
    args.pluginName,
  )

  store
    .getState()
    .flattenedPlugins.forEach((plugin) =>
      sourcePluginAllowList.includes(plugin.name)
        ? supportedMerlinSourcePlugins.add(plugin.name)
        : unsupportedMerlinSourcePlugins.add(plugin.name),
    )

  if (isFirstSource) {
    for (const node of getDataStore().iterateNodes()) {
      if (supportedMerlinSourcePlugins.has(node.internal.owner)) {
        store.dispatch({
          type: `TOUCH_NODE`,
          payload: node.id,
        })
      }
    }
    isFirstSource = false
  }

  let totalActions = 0

  const contentHubSourcingActivity = reporter.activityTimer(
    `Sourcing From Content Hub`,
  )
  contentHubSourcingActivity.start()

  const { ledgerExists, lastSourcingUlid, sourcingConfigurationId } =
    await synchronize({
      cache: synchronizerCache,
      gatsbySitePath: process.cwd(),
      siteId,
      // each action is dispatched immediately after it is received
      handleAction: (action) => {
        store.dispatch(action)
        if (!action?.type?.startsWith(`SYNCHRONIZER`)) {
          totalActions++
        }
      },
    })

  contentHubSourcingActivity.end()

  if (process.send) {
    process.send({ type: `MERLIN_ACTION`, payload: { ledgerExists } })
  }
  if (ledgerExists) {
    reporter.info(
      `Sourced successfully from Content Hub.\nTotal Gatsby Actions applied: ${totalActions}.\nSourcing Configuration Hash: ${sourcingConfigurationId}.\nSourced up to ledger id: ${lastSourcingUlid}`,
    )
    // if we are sourcing ALL plugins (no pluginName is provided) OR the provided plugin is supported
    if (sourceAllPlugins || merlinAlreadySourcedPlugin) {
      const gatsbyDBSyncingActivity = reporter.activityTimer(
        `Syncing Data to Gatsby DB`,
      )

      gatsbyDBSyncingActivity.start()
      // always run the internal data bridge plugin
      const sourceNodesPromises = [
        originalSourceNodesApiRunner.sourceNodesApiRunner({
          ...args,
          webhookBody: {},
          pluginName: `internal-data-bridge`,
        }),
      ]

      // source all unsupported plugins if we are sourcing all plugins
      // If merlinAlreadySourcedPlugin, we don't need to source any plugins other than the internal data bridge
      if (sourceAllPlugins) {
        sourceNodesPromises.push(
          ...[...unsupportedMerlinSourcePlugins].map((pluginName) =>
            originalSourceNodesApiRunner.sourceNodesApiRunner({
              ...args,
              webhookBody: {},
              pluginName,
            }),
          ),
        )
      }
      await Promise.all(sourceNodesPromises)
      gatsbyDBSyncingActivity.end()
      sourceAllPlugins
        ? reportContentHubSourcedLog(
            [...supportedMerlinSourcePlugins],
            [...unsupportedMerlinSourcePlugins],
          )
        : reportContentHubSourcedLog([args.pluginName, `internal-data-bridge`])
    } else {
      // Update from a non supported plugin
      originalSourceNodesApiRunner.sourceNodesApiRunner(args)
      reportContentHubSourcedLog([], [args.pluginName])
    }
  } else {
    reporter.info(
      `Unable to pull data from Content Hub. Sourcing Configuration Hash: ${sourcingConfigurationId}. Attempting to source in Gatsby now...`,
    )
    // when no ledger exists, run original sourcing - better luck next time
    return originalSourceNodesApiRunner.sourceNodesApiRunner(args)
  }
}
