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
  }
}

async function action() {
  const projectPath = resolve(
    process.cwd(),  process.argv[2]
  )
  const configPath = join(
    projectPath, 'tauri.conf.json'
  )

  const releaseId = Number(core.getInput('releaseId') || 0)
  const version = core.getInput('version')

  const artifacts = await buildProject(projectPath, version)

  core.getInput
}

run()
