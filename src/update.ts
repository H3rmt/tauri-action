import { context } from '@actions/github'
import { GitHub } from '@actions/github/lib/utils'
import * as core from '@actions/core'

export async function update(
    github: InstanceType<typeof GitHub>,
    version: string, releaseId: number,
    gistId: string | null, fileName: string,
    notes: string, tagName: string,
    uploadToRelease: boolean) {
    const date = (await github.rest.repos.getRelease({
        owner: context.repo.owner,
        repo: context.repo.repo,
        release_id: releaseId
    })).data.published_at;

    const winsig = core.getInput('winsig', {required: true})
    const macsig = core.getInput('macsig', {required: true})
    const linsig = core.getInput('linsig', {required: true})

    const winupdate = core.getInput('winupdate', {required: true})
    const macupdate = core.getInput('macupdate', {required: true})
    const linupdate = core.getInput('linupdate', {required: true})

    const content = `{
    "version": "v${version}",
    "notes": "${notes}",
    "pub_date": "${date}",
    "platforms": {
        "darwin-x86_64": {
            "signature": "${macsig}",
            "url": "https://github.com/${context.repo.owner}/${context.repo.repo}/releases/download/${tagName}/${macupdate}"
        },
        "linux-x86_64": {
            "signature": "${linsig}",
            "url": "https://github.com/${context.repo.owner}/${context.repo.repo}/releases/download/${tagName}/${linupdate}"
        },
        "windows-x86_64": {
            "signature": "${winsig}",
            "url": "https://github.com/${context.repo.owner}/${context.repo.repo}/releases/download/${tagName}/${winupdate}"
        }
    }
}`;

    core.debug(content);

    if (gistId !== null) {
        core.info(`updating ${fileName} in gist with id: ${gistId} for tauri updater`)
        await github.rest.gists.update({
            gist_id: gistId,
            files: { [fileName]: { content: content } }
        })
    }

    if (uploadToRelease) {
        core.info(`uploading ${fileName} to release with id: ${releaseId}`)
        await github.rest.repos.uploadReleaseAsset({
            owner: context.repo.owner,
            repo: context.repo.repo,
            release_id: releaseId,
            name: fileName,
            data: content
        })
    }
}