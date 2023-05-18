/* eslint-disable @typescript-eslint/no-var-requires */
import * as core from '@actions/core'
// eslint-disable-next-line prettier/prettier
import { getMavenGithubPackages } from './listPackages'

export interface Inputs {
  sourceServer: string
  targetServer: string
  sourceServerURL: string
  targetServerURL: string
  token: string
}
async function run(): Promise<void> {
  try {
    const inputs: Inputs = {
      sourceServer: core.getInput('source-server'),
      targetServer: core.getInput('target-server'),
      sourceServerURL: core.getInput('source-server-url'),
      targetServerURL: core.getInput('source-server-url'),
      token: core.getInput('token')
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const util = require('util')
    core.debug(`Inputs: ${util.inspect(inputs)}`)
    const mavenPackagesFromGithub = await getMavenGithubPackages(inputs)
    // eslint-disable-next-line github/array-foreach
    mavenPackagesFromGithub.forEach(pkg =>
      core.info(
        `Package Name:${pkg.name} \n Package Repository:${pkg.repository?.name}`
      )
    )
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
