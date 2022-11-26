import { Artifact } from "./def"
import { join } from 'path'
import { context } from '@actions/github'
import { platform } from 'os'
import { execa } from "execa"
import { GitHub } from '@actions/github/lib/utils'
import * as core from '@actions/core'
import { readFileSync, statSync } from 'fs'

export async function buildProject(
    root: string,
    version: string,
    name: string
): Promise<Artifact[]> {
    // install 
    await execa('yarn', ['install', '--frozen-lockfile'], {
        cwd: root,
        stdio: 'inherit'
    })

    // build
    await execa('yarn', ['run', 'tauri build'], {
        cwd: root,
        stdio: 'inherit'
    })

    const capName = name.charAt(0).toUpperCase() + name.slice(1)

    const artifactsPath = join(root, 'target', 'release', 'bundle')

    if (platform() === 'darwin') {
        return [
            { path: join(artifactsPath, `dmg/${capName}_${version}_x64.dmg`), name: `${name}_${version}_x64.dmg` },
            { path: join(artifactsPath, `macos/${capName}.app`), name: `${name}_${version}.app` },
            { path: join(artifactsPath, `macos/${capName}.app.tar.gz`), name: `${name}_${version}.app.tar.gz` },
            { path: join(artifactsPath, `macos/${capName}.app.tar.gz.sig`), name: `${name}_${version}.app.tar.gz.sig` }
        ]
    } else if (platform() === 'win32') {
        return [
            { path: join(artifactsPath, `msi/${capName}_${version}_x64_en-US.msi`), name: `${name}_${version}_x64_en-US.msi` },
            { path: join(artifactsPath, `msi/${capName}_${version}_x64_en-US.msi.zip`), name: `${name}_${version}_x64_en-US.msi.zip` },
            { path: join(artifactsPath, `msi/${capName}_${version}_x64_en-US.msi.zip.sig`), name: `${name}_${version}_x64_en-US.msi.zip.sig` }
        ]
    } else {
        return [
            { path: join(artifactsPath, `deb/${name}_${version}_amd64.deb`), name: `${name}_${version}_amd64.deb` },
            { path: join(artifactsPath, `appimage/${name}_${version}_amd64.AppImage`), name: `${name}_${version}_amd64.AppImage` },
            { path: join(artifactsPath, `appimage/${name}_${version}_amd64.AppImage.tar.gz`), name: `${name}_${version}_amd64.AppImage.tar.gz` },
            { path: join(artifactsPath, `appimage/${name}_${version}_amd64.AppImage.tar.gz.sig`), name: `${name}_${version}_amd64.AppImage.tar.gz.sig` }
        ]

    }
}

export async function publish(github: InstanceType<typeof GitHub>, releaseId: number, artifacts: Artifact[]) {
    // const existingAssets = (await github.rest.repos.listReleaseAssets({
    //     owner: context.repo.owner,
    //     repo: context.repo.repo,
    //     release_id: releaseId,
    //     per_page: 50
    // })).data

    for (const artifact of artifacts) {
        const headers = {
            'content-type': 'application/zip',
            'content-length': statSync(artifact.path).size
        }
        core.info(`headers["content-length"]:${headers["content-length"]}`)

        // const existingAsset = existingAssets.find((a) => a.name === artifact.name)
        // core.info(`existing: ${existingAsset}, name: ${artifact.name}`)

        // if (existingAsset) {
        //     core.info(`Deleting existing ${artifact.name}...`)
        //     await github.rest.repos.deleteReleaseAsset({
        //         owner: context.repo.owner,
        //         repo: context.repo.repo,
        //         asset_id: existingAsset.id
        //     })
        // }

        await github.rest.repos.uploadReleaseAsset({
            // headers,
            owner: context.repo.owner,
            repo: context.repo.repo,
            release_id: releaseId,
            name: artifact.name,
            data: readFileSync(artifact.path).toString(),
        })
    }

}