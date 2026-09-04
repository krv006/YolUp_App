module.exports = function (api) {
  api.cache(true);
  return {
    presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }], "nativewind/babel"],
    plugins: [
      // Reanimated/worklets plugini HAR DOIM oxirgi bo'lishi shart.
      "react-native-worklets/plugin",
    ],
  };
};
