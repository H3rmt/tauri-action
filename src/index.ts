import * as core from '@actions/core'
import { resolve } from 'path'
import { getOctokit } from '@actions/github'
import { update } from './update'
import { GitHub } from '@actions/github/lib/utils'
import { build } from './build'
import { upload } from './upload'

async function run(): Promise<void> {
  try {
    const releaseId = Number(core.getInput('releaseId', { required: true }))
    core.debug(`releaseId: ${releaseId}`)
    const version = core.getInput('version', { required: true })
    core.debug(`version: ${version}`)
    const name = core.getInput('name', { required: true })
    core.debug(`name: ${name}`)

    if (process.env.TOKEN === undefined) {
      throw new Error('TOKEN is required')
    }
    const github = getOctokit(process.env.TOKEN)

    if (core.getInput('releaseTagName') !== '') {
      core.info("mode set to update gist")
      await action2(github, releaseId, version, name)  // mode set to update gist
    } else {
      core.info("mode set to build and return sig")
      await action1(github, releaseId, version, name)  // mode set to build and return sig
    }
  } catch (error) {
    if (error instanceof Error)
      core.setFailed(error.message)
    throw error
  }
}

async function action2(github: InstanceType<typeof GitHub>, releaseId: number, version: string, name: string) {
  const gistId: string | null = core.getInput('gistId') || null
  core.debug(`gistId: ${gistId}`)
  const fileName: string = core.getInput('fileName') || 'update.json'
  core.debug(`fileName: ${fileName}`)
  const notes: string = core.getInput('releaseNotes', { required: true })
  core.debug(`notes: ${notes}`)
  const tagName: string = core.getInput('releaseTagName', { required: true })
  core.debug(`tagName: ${tagName}`)
  const uploadToRelease: boolean = Boolean(core.getInput('uploadToRelease')) || true
  core.debug(`uploadToRelease: ${uploadToRelease}`)

  await update(github, version, releaseId, gistId, fileName, notes, tagName, uploadToRelease)
}

async function action1(github: InstanceType<typeof GitHub>, releaseId: number, version: string, name: string) {
  const projectPath = resolve(process.cwd(), core.getInput('path', { required: true }), 'src-tauri')
  core.debug(`projectPath: ${projectPath}`)

  const artifacts = await build(projectPath, version, name)
  core.info(artifacts.map(a => `${a.name}: ${a.path}`).reduce((f, n) => f + "\n" + n))

  await upload(github, releaseId, artifacts)
}

run()
