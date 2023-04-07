import { context } from '@actions/github'
import { GitHub } from '@actions/github/lib/utils'
import * as core from '@actions/core'
import { readFileSync, statSync } from 'fs'
import { getType } from "mime";

export async function upload(
    github: InstanceType<typeof GitHub>,
    releaseId: number,
    artifacts: { path: string, name: string }[]
) {
    const data = (await github.rest.repos.getRelease({
        owner: context.repo.owner,
        repo: context.repo.repo,
        release_id: releaseId
    })).data;
    core.debug(`uploading to release with id: ${data.id}`)

    for (const artifact of artifacts) {
        const { size, mime, data } = asset(artifact.path);

        core.info(`size:${size}, name: ${artifact.name}, mime:${mime}, path:${artifact.path}`)

        const headers = { 'content-type': mime, 'content-length': size };

        const d = await github.rest.repos.uploadReleaseAsset({
            owner: context.repo.owner,
            repo: context.repo.repo,
            release_id: releaseId,
            headers: headers,
            name: artifact.name,
            data: data.toString()
        });
    }
}

export const asset = (path: string): { mime: string, size: number, data: Buffer } => {
    return {
        mime: mimeOrDefault(path),
        size: statSync(path).size,
        data: readFileSync(path),
    };
};

export const mimeOrDefault = (path: string): string => {
    return getType(path) || "application/octet-stream";
};