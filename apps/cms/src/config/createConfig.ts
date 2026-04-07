import { defaultConfig } from './items/default'

export type Config = typeof defaultConfig

export const createConfig = (config: Partial<Config> & Record<string, unknown>): Config => {
  return { ...defaultConfig, ...config }
}

