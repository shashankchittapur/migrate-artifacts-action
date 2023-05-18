/* eslint-disable github/array-foreach */
/* eslint-disable prettier/prettier */
import * as core from '@actions/core'
import * as github from '@actions/github'
import { Inputs } from './main'
import { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods/dist-types/generated/parameters-and-response-types'

export interface PackageVersion {
    id: number,
    name: string
}
export interface PackageNameAndRepo {
    packageName: string,
    repoName: string
}
export async function listPackageNamesFromGithub(inputs: Inputs): Promise<Map<PackageNameAndRepo, PackageVersion[]>> {
    core.debug('Listing packages started')
    const packageAndVersions: Map<PackageNameAndRepo, PackageVersion[]> = new Map<PackageNameAndRepo, PackageVersion[]>()
    const octakit = github.getOctokit(inputs.token)

    type Visibility =
        RestEndpointMethodTypes['packages']['listPackagesForOrganization']['parameters']['visibility']

    type Package_Type =
        RestEndpointMethodTypes['packages']['listPackagesForOrganization']['parameters']['package_type']

    const package_type = inputs.packageType as Package_Type

    const visibility: Visibility = "private" as Visibility

    const parameters = {
        org: inputs.orgName,
        package_type,
        visibility
    }

    const packages = await octakit.paginate(
        octakit.rest.packages.listPackagesForOrganization, parameters
    )
    core.debug(`Number of packages:${packages.length}`)
    const packageNames: PackageNameAndRepo[] = packages.map(pkg => {
        let repoName = pkg.repository?.name
        core.debug(`Repo Name:${repoName}`)
        if (!repoName) {
            repoName = "desktop-main"
        }

        const pkgNameAndRepoName: PackageNameAndRepo = {
            packageName: pkg.name,
            repoName
        }
        return pkgNameAndRepoName
    })

    for (const pkg of packageNames) {
        core.debug(`Listing versions for Package:${pkg.packageName} for repository ${pkg.repoName}`)
        const params = {
            org: inputs.orgName,
            package_type,
            package_name: pkg.packageName

        }
        const versions = await octakit.paginate(
            octakit.rest.packages.getAllPackageVersionsForPackageOwnedByOrg,
            params
        )
        const releaseVersions: PackageVersion[] = versions
            .filter(version => !(version.name.includes("SNAPSHOT")))
        if (releaseVersions.length > 0) {
            core.debug(`Package Name: ${pkg.packageName}`)
            core.debug(`Versions:`)
            releaseVersions.forEach(releaseVersion => {
                core.debug(`Version Name:${releaseVersion.name}`)
            })
            packageAndVersions.set(pkg, releaseVersions)
        }
    }
    return packageAndVersions
}