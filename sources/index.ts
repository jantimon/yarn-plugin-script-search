import type { Plugin } from "@yarnpkg/core";
import { FuzySearchCommand } from "./FuzySearchCommand";

const plugin: Plugin = {
  commands: [FuzySearchCommand],
};
export default plugin;
