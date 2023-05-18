/* eslint-disable prettier/prettier */
import { JfrogClient } from 'jfrog-client-js'
import * as core from '@actions/core'

let jfrogClient: JfrogClient
export function createjfrogClient(
    serverlURL: string,
    username: string,
    password: string
): void {
    jfrogClient = new JfrogClient({
        platformUrl: serverlURL,
        username,
        password
    })
}

export async function getArtifactsFromArtifactory(): Promise<void> {
    const artifacts = await jfrogClient.artifactory()
        .search()
        .aqlSearch(
            'items.find({' +
            '"repo":"libs-release-local",' +
            '"path":{"$match":"*"}}' +
            ').include("name","repo","path","created").sort({"$desc":["created"]})'
        )
    core.debug(JSON.stringify(artifacts.results))
}
