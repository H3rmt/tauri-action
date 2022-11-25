export interface Artifact {
    path: string
    name: string
}

export interface Runner {
    runnerCommand: string
    runnerArgs: string[]
}