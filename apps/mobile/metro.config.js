/* eslint-env node */
// Expo adds sibling workspace apps (e.g. apps/cms) to watchFolders for pnpm monorepos.
// Watching Next.js `.next` build output makes Metro's file watcher ENOENT on Windows when
// chunks appear/disappear during CMS dev — mobile does not import CMS source.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const { withUniwindConfig } = require('uniwind/metro');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);
const cmsRoot = path.resolve(projectRoot, '../cms');
config.watchFolders = (config.watchFolders ?? []).filter(
  (folder) => path.normalize(folder) !== path.normalize(cmsRoot)
);

// Uniwind docs: https://docs.uniwind.dev/quickstart — Expo (Metro).
// Do not wrap `withUniwindConfig`; it must be the outer Metro wrapper.
module.exports = withUniwindConfig(config, {
  cssEntryFile: './global.css',
  dtsFile: './uniwind-types.d.ts',
});
