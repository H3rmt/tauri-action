import { context } from '@actions/github'
import { GitHub } from '@actions/github/lib/utils'
import * as core from '@actions/core'
import { readFileSync, statSync } from 'fs'
import { basename } from 'path';
import { getType } from "mime";
import fetch from "node-fetch";

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
        const endpoint = new URL(data.upload_url);
        const { size, mime, data: body } = asset(artifact.path);
        endpoint.searchParams.append("name", artifact.name);

        core.info(`size:${size}, name: ${artifact.name}, mime:${mime}, path:${artifact.path}, endpoint: ${endpoint}, data.upload_url: ${data.upload_url}`)

        const resp = await fetch(endpoint, {
            headers: {
                "content-length": `${size}`,
                "content-type": mime,
                authorization: `token ${process.env.TOKEN}`,
            },
            method: "POST",
            body,
        });

        const json = await resp.json();
        if (resp.status !== 201) {
            throw new Error(
                `Failed to upload release asset ${artifact.name}. received status code ${resp.status}\n${json.message}\n${JSON.stringify(json.errors)}`
            );
        }
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