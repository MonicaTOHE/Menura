const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Excluding android/ios build folders from the file watcher prevents Metro
 * from crashing with ENOENT on Windows when gradle deletes/recreates
 * intermediate directories during a build.
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    blockList: [
      /android\/build\/.*/,
      /android\/app\/build\/.*/,
      /android\/\.gradle\/.*/,
      /ios\/build\/.*/,
      /ios\/Pods\/.*/,
      /node_modules\/.*\/android\/build\/.*/,
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
