import { context } from '@actions/github'
import { GitHub } from '@actions/github/lib/utils'
import * as core from '@actions/core'

export async function update(github: InstanceType<typeof GitHub>, version: string, releaseId: number, gistId: string, fileName: string, notes: string, tagName: string) {
    const date = (await github.rest.repos.getRelease({
        owner: context.repo.owner,
        repo: context.repo.repo,
        release_id: releaseId
    })).data.published_at;

    const winsig = core.getInput('winsig')
    const macsig = core.getInput('macsig')
    const linsig = core.getInput('linsig')

    const winupdate = core.getInput('winupdate')
    const macupdate = core.getInput('macupdate')
    const linupdate = core.getInput('linupdate')

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

    core.notice(content);

    await github.rest.gists.update({
        gist_id: gistId,
        files: {
            fileName: {
                content: content
            }
        }
    })

    core.notice(`updated ${fileName} for tauri updater`)
}