/* eslint-disable prettier/prettier */
import * as github from '@actions/github'
import { Inputs } from './main'
import { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods/dist-types/generated/parameters-and-response-types'

interface Package {
    id: number
    name: string
    repository?: {
        id: number
        name: string
    }
}


// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export async function getMavenGithubPackages(inputs: Inputs) {
    const octokit = github.getOctokit(inputs.token)

    type Visibility =
        RestEndpointMethodTypes['packages']['listPackagesForOrganization']['parameters']['visibility']

    type PackageType =
        RestEndpointMethodTypes['packages']['listPackagesForOrganization']['parameters']['package_type']

    const visibility: Visibility = "private" as Visibility
    const package_type: PackageType = "maven" as PackageType
    const params = {
        package_type,
        org: 'Solibri',
        visibility
    }
    const packages = await octokit.paginate(
        octokit.rest.packages.listPackagesForOrganization,
        params)

    const releasePackages = packages.filter(pkg => !pkg.name.includes('SNAPSHOT') && pkg.repository != null && pkg.repository?.name)
    return releasePackages
}
