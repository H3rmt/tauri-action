import { join } from 'path'
import { platform } from 'os'
import { execa } from "execa"
import * as core from '@actions/core'
import { readFileSync } from 'fs'

export async function build(
    root: string,
    version: string,
    name: string
): Promise<{ path: string, name: string }[]> {
    // install 
    core.info("yarn installing dependencies")
    await execa('yarn', ['install', '--frozen-lockfile'], {
        cwd: root,
        stdio: 'inherit'
    })


    // install 2
    core.info("cargo installing dependencies")
    await execa('cargo', ['fetch'], {
        cwd: root,
        stdio: 'inherit'
    })

    // build
    core.info("yarn running tauri build")
    await execa('yarn', ['run', 'tauri build'], {
        cwd: root,
        stdio: 'inherit'
    })

    const artifactsPath = join(root, 'target', 'release', 'bundle')

    if (platform() === 'darwin') {
        core.info("darwin platform")
        core.setOutput('macupdate', `${name}_${version}.app.tar.gz`)
        core.setOutput('macsig', readFileSync(join(artifactsPath, `macos/${name}.app.tar.gz.sig`)).toString())
        return [
            { path: join(artifactsPath, `dmg/${name}_${version}_x64.dmg`), name: `${name}_${version}_x64.dmg` },
            { path: join(artifactsPath, `macos/${name}.app.tar.gz`), name: `${name}_${version}.app.tar.gz` },
            { path: join(artifactsPath, `macos/${name}.app.tar.gz.sig`), name: `${name}_${version}.app.tar.gz.sig` }
        ]
    } else if (platform() === 'win32') {
        core.info("win platform")
        core.setOutput('winupdate', `${name}_${version}_x64_en-US.msi.zip`)
        core.setOutput('winsig', readFileSync(join(artifactsPath, `msi/${name}_${version}_x64_en-US.msi.zip.sig`)).toString())
        return [
            { path: join(artifactsPath, `msi/${name}_${version}_x64_en-US.msi`), name: `${name}_${version}_x64_en-US.msi` },
            { path: join(artifactsPath, `msi/${name}_${version}_x64_en-US.msi.zip`), name: `${name}_${version}_x64_en-US.msi.zip` },
            { path: join(artifactsPath, `msi/${name}_${version}_x64_en-US.msi.zip.sig`), name: `${name}_${version}_x64_en-US.msi.zip.sig` }
        ]
    } else {
        const {stdout} = await execa('openssl', ['version'], {
            cwd: root,
        })

        core.info(stdout);
        const sslVersion = stdout.substring(8,1)
        
    
        if (sslVersion == "1") {
            core.info("linux platform (ssl1)")
            return [
                { path: join(artifactsPath, `deb/${name}_${version}_amd64.deb`), name: `${name}_${version}_amd64_ssl1.deb` },
            ]
        } else if (sslVersion == "3") {
            core.info("linux platform (ssl3)")
            core.setOutput('linupdate', `${name}_${version}_amd64.AppImage.tar.gz`)
            core.setOutput('linsig', readFileSync(join(artifactsPath, `appimage/${name}_${version}_amd64.AppImage.tar.gz.sig`)).toString())
            return [
                { path: join(artifactsPath, `deb/${name}_${version}_amd64.deb`), name: `${name}_${version}_amd64_ssl3.deb` },
                { path: join(artifactsPath, `appimage/${name}_${version}_amd64.AppImage`), name: `${name}_${version}_amd64.AppImage` },
                { path: join(artifactsPath, `appimage/${name}_${version}_amd64.AppImage.tar.gz`), name: `${name}_${version}_amd64.AppImage.tar.gz` },
                { path: join(artifactsPath, `appimage/${name}_${version}_amd64.AppImage.tar.gz.sig`), name: `${name}_${version}_amd64.AppImage.tar.gz.sig` }
            ]
        } else {
            throw Error("Error detecting ssl version")
        }

    }
}