import { context } from '@actions/github'
import { GitHub } from '@actions/github/lib/utils'
import * as core from '@actions/core'
import { readFileSync } from 'fs'

export async function upload(
    github: InstanceType<typeof GitHub>,
    releaseId: number,
    artifacts: { path: string, name: string }[]
) {
    for (const artifact of artifacts) {
        core.info(`uploading: ${artifact.name}: ${artifact.path}`)
        await github.rest.repos.uploadReleaseAsset({
            owner: context.repo.owner,
            repo: context.repo.repo,
            release_id: releaseId,
            name: artifact.name,
            data: readFileSync(artifact.path).toString(),
        })
    }
}