/* eslint-env node */
// Expo 55 automatically handles pnpm monorepo watchFolders + nodeModulesPaths.
// No manual overrides needed — they can break native module resolution (e.g. @rnmapbox/maps).
const { getDefaultConfig } = require('expo/metro-config');

module.exports = getDefaultConfig(__dirname);
