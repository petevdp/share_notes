const path = import("path");
const root = path.resolve("../..");

module.exports = {
  extends: "../../tsconfig.json",
  compilerOptions: {
    // paths: {
    //   "*": [path.join(root, "node_modules")],
    // },
  },
  include: ["./"],
};
