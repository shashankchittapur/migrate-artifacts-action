/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable github/array-foreach */
/* eslint-disable @typescript-eslint/no-var-requires */
import * as core from '@actions/core'
import { listPackageNamesFromGithub, PackageVersion, PackageNameAndRepo } from './githubPackages'
import { createjfrogClient, getArtifactsFromArtifactory } from './artifactory'

export interface Artifact {
  groupId: string
  artifactId: string
  version: PackageVersion
}

export interface Inputs {
  token: string
  packageType: string
  orgName: string
  jFrogURL: string
  jfrog_username: string
  jfrog_password: string
  jfrog_certificate_file: string
}
async function run(): Promise<void> {

  const https = require('https')
  const rootCas = require('ssl-root-cas').create()
  const path = require('path')

  try {
    const inputs: Inputs = {
      token: core.getInput('token'),
      packageType: core.getInput('packageType'),
      orgName: core.getInput('organization'),
      jFrogURL: core.getInput('jfrogURL'),
      jfrog_username: core.getInput('jfrog-username'),
      jfrog_password: core.getInput('jfrog-password'),
      jfrog_certificate_file: core.getInput('jfrog_certificate_file')
    }
    const util = require('util')
    core.info(`Inputs: ${util.inspect(inputs)}`)
    rootCas.addFile(path.resolve(inputs.jfrog_certificate_file))

    https.globalAgent.options.ca = rootCas

    const githubPackagesPerRepo = await getPackagesPerRepoFromGithubPackages(inputs)
    core.info(`Repo Name\tGroup Id\tArtifact ID\tVersion`)
    githubPackagesPerRepo.forEach((artifacts: Artifact[], repoName: string) => {
      artifacts.forEach(artifact => {
        core.info(`${repoName}\t${artifact.groupId}\t${artifact.artifactId}\t${artifact.version.name}`)
      })
    })


    createjfrogClient(
      inputs.jFrogURL,
      inputs.jfrog_username,
      inputs.jfrog_password
    )
    getArtifactsFromArtifactory()
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

async function getPackagesPerRepoFromGithubPackages(
  inputs: Inputs
): Promise<Map<string, Artifact[]>> {
  const mavenPackagesFromGithub = await listPackageNamesFromGithub(inputs)
  const githubArtifactsPerRepo: Map<string, Artifact[]> = new Map<
    string,
    Artifact[]
  >()
  core.debug('Grouping packages as artifacts per repository map')
  mavenPackagesFromGithub.forEach(
    (versions: PackageVersion[], pkg: PackageNameAndRepo) => {
      let artifacts: Artifact[] = []
      versions.forEach(version => {
        const pkgName = pkg.packageName
        const groupId = pkgName.substring(0, pkgName.lastIndexOf('.'))
        const artifactId = pkgName.substring(
          pkgName.lastIndexOf('.') + 1,
          pkgName.length
        )
        const artifact = {
          groupId,
          artifactId,
          version
        }
        artifacts.push(artifact)
      })
      if (githubArtifactsPerRepo.has(pkg.repoName)) {
        artifacts = artifacts.concat(githubArtifactsPerRepo.get(pkg.repoName)!)
      }
      githubArtifactsPerRepo.set(pkg.repoName, artifacts)
    }
  )
  return githubArtifactsPerRepo
}

run()
