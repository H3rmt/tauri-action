import * as core from '@actions/core'
import { resolve } from 'path'
import { buildProject, publish } from './utils'
import { getOctokit } from '@actions/github'
import { readFileSync } from 'fs'

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
    process.cwd(), core.getInput('path'), 'src-tauri'
  )
  core.debug(`projectPath: ${projectPath}`)

  if (process.env.GITHUB_TOKEN === undefined) {
    throw new Error('GITHUB_TOKEN is required')
  }
  const github = getOctokit(process.env.GITHUB_TOKEN)

  const releaseId = Number(core.getInput('releaseId'))
  core.debug(`releaseId: ${releaseId}`)

  const version = core.getInput('version')
  core.debug(`version: ${version}`)
  const name = core.getInput('name')
  core.debug(`name: ${name}`)

  const artifacts = await buildProject(projectPath, version, name)
  core.info(artifacts.map(a => `${a.name}: ${a.path}`).reduce((f, n) => f + "\n" + n))

  await publish(github, releaseId, artifacts)
  core.setOutput('sigs', artifacts.filter(a => a.name.endsWith(".sig")).map(a => readFileSync(a.path).toString()))
}

run()
