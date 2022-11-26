import * as core from '@actions/core'
import { resolve } from 'path'
import { buildProject, publish } from './utils'
import { getOctokit } from '@actions/github'
import { update } from './update'

async function run(): Promise<void> {
  try {
    if (core.getInput('gistId') !== '') {
      core.info("mode set to update gist")
      await action2()  // mode set to update gist
    } else {
      core.info("mode set to build and return sig")
      await action1()  // mode set to build and return sig
    }
  } catch (error) {
    if (error instanceof Error)
      core.setFailed(error.message)
    throw error
  }
}

async function action2() {
  if (process.env.GITHUB_TOKEN === undefined) {
    throw new Error('GITHUB_TOKEN is required')
  }
  const github = getOctokit(process.env.PAT || process.env.GITHUB_TOKEN)

  const releaseId = Number(core.getInput('releaseId'))
  core.debug(`releaseId: ${releaseId}`)

  const version = core.getInput('version')
  core.debug(`version: ${version}`)
  const name = core.getInput('name')
  core.debug(`name: ${name}`)

  const gistId = core.getInput('gistId')
  core.debug(`gistId: ${gistId}`)

  const fileName = core.getInput('fileName')
  core.debug(`fileName: ${fileName}`)

  const notes = core.getInput('notes')
  core.debug(`notes: ${notes}`)

  const tagName = core.getInput('tagName')
  core.debug(`tagName: ${tagName}`)

  await update(github, version, releaseId, gistId, fileName, notes, tagName)
}

async function action1() {
  const projectPath = resolve(
    process.cwd(), core.getInput('path'), 'src-tauri'
  )
  core.debug(`projectPath: ${projectPath}`)

  if (process.env.GITHUB_TOKEN === undefined) {
    throw new Error('GITHUB_TOKEN is required')
  }
  const github = getOctokit(process.env.PAT || process.env.GITHUB_TOKEN)

  const releaseId = Number(core.getInput('releaseId'))
  core.debug(`releaseId: ${releaseId}`)

  const version = core.getInput('version')
  core.debug(`version: ${version}`)
  const name = core.getInput('name')
  core.debug(`name: ${name}`)

  const artifacts = await buildProject(projectPath, version, name)
  core.info(artifacts.map(a => `${a.name}: ${a.path}`).reduce((f, n) => f + "\n" + n))

  await publish(github, releaseId, artifacts)
}

run()
