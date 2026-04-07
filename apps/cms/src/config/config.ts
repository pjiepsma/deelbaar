import { Config } from './createConfig'
import { defaultConfig } from './items/default'
import { productionConfig } from './items/production'
import { stagingConfig } from './items/staging'

export const configs: Record<string, Config> = {
  default: defaultConfig,
  staging: stagingConfig,
  production: productionConfig,
}

export const getConfig = () => {
  return configs[process.env.SELECTED_CONFIG || 'default']
}

export const config = getConfig()

