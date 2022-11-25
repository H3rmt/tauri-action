import { Artifact } from "./def"
import { join, resolve, dirname, basename } from 'path'
import { platform } from 'os'
import { execa } from "execa"


export async function buildProject(
    root: string,
    version: string,
): Promise<Artifact[]> {

    // build
    await execa('yarn', ['run', 'build'], {
        cwd: root,
        stdio: 'inherit'
    })

    const artifactsPath = join('target', 'release', 'bundle')

    if (platform() === 'darwin') {
        return [
            { path: join(artifactsPath, `dmg/Grades_${version}_x64.dmg`), name: `grades_${version}_x64.dmg` },
            { path: join(artifactsPath, `macos/Grades.app`), name: `grades_${version}.app` },
            { path: join(artifactsPath, `macos/Grades.app.tar.gz`), name: `grades_${version}.app.tar.gz` },
            { path: join(artifactsPath, `macos/Grades.app.tar.gz.sig`), name: `grades_${version}.app.tar.gz.sig` }
        ]
    } else if (platform() === 'win32') {
        return [
            { path: join(artifactsPath, `msi/Grades_${version}_x64_en-US.msi`), name: `grades_${version}_x64_en-US.msi` },
            { path: join(artifactsPath, `msi/Grades_${version}_x64_en-US.msi.zip`), name: `grades_${version}_x64_en-US.msi.zip` },
            { path: join(artifactsPath, `msi/Grades_${version}_x64_en-US.msi.zip.sig`), name: `grades_${version}_x64_en-US.msi.zip.sig` }
        ]
    } else {
        return [
            { path: join(artifactsPath, `deb/grades_${version}_amd64.deb`), name: `grades_${version}_amd64.deb` },
            { path: join(artifactsPath, `appimage/grades_${version}_amd64.AppImage`), name: `grades_${version}_amd64.AppImage` },
            { path: join(artifactsPath, `appimage/grades_${version}_amd64.AppImage.tar.gz`), name: `grades_${version}_amd64.AppImage.tar.gz` },
            { path: join(artifactsPath, `appimage/grades_${version}_amd64.AppImage.tar.gz.sig`), name: `grades_${version}_amd64.AppImage.tar.gz.sig` }
        ]

    }
}