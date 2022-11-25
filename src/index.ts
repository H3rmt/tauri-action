import { platform } from 'os'
import * as core from '@actions/core'
import { join, resolve, dirname, basename } from 'path'
import { existsSync } from 'fs'
import { buildProject } from './utils'

async function run(): Promise<void> {
  try {
    await action()
  } catch (error) {
    if (error instanceof Error)
      core.setFailed(error.message)
    throw error
  }
}

async function action() {
  const projectPath = resolve(
    process.cwd(),  'src-tauri'
  )
  core.info(projectPath)

  const configPath = join(
    projectPath, 'tauri.conf.json'
  )
  core.info(configPath)


  const releaseId = Number(core.getInput('releaseId'))
  core.info(`${releaseId}`)


  const version = core.getInput('version')

  const artifacts = await buildProject(projectPath, version)

  core.info(artifacts.map(a => `${a.name}: ${a.path}`).reduce((f, n) => f + n))
}

run()
