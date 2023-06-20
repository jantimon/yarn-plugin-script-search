import type { RunCommand } from "@yarnpkg/plugin-essentials";
import { BaseCommand } from "@yarnpkg/cli";
// Hack around crazy compiler optimizations which break the import 🤷‍♂️
import * as essentialsPlugin from "@yarnpkg/plugin-essentials";

// Right now there is no other way to ignore other 3rd party plugins
const ignoreList = ["leaf"];

/**
 * The Fallback Command is `yarn run`.
 * It is part of the `@yarnpkg/plugin-essentials` module.
 *
 * Unfortunately, the `@yarnpkg/plugin-essentials` module does not export the `RunCommand` class.
 *
 * Therefore we extract it from the plugin object.
 * This quite fragile as it depends on implementation details of the RunCommand class.
 *
 * If anything fails this function will NOT break yarn but return undefined.
 */
const getRunCommandClass = (): (new () => RunCommand) | undefined => {
  try {
    // Yarns build process tries to resolve ESM default exports which breaks the import.
    // We work around this with a string literal:
    const essentialPluginCommands = essentialsPlugin["def" + "ault"].commands;
    const RunCommandClass = essentialPluginCommands.find(
      (e) =>
        e.paths &&
        e.usage &&
        e.paths[0][0] === "run" &&
        e.usage.description === "run a script defined in the package.json"
    );
    return RunCommandClass as new () => RunCommand;
  } catch (e) {}
  return class extends BaseCommand {
    constructor() {
      super();
      throw new Error("heuristic module detection failed");
    }
    async execute(): Promise<number | void> {}
  } as unknown as new () => RunCommand;
};

const getCommonCommands = () => {
  // Yarns build process tries to resolve ESM default exports which breaks the import.
  // We work around this with a string literal:
  const essentialPluginCommands = essentialsPlugin["def" + "ault"].commands;
  return [...essentialPluginCommands, ...ignoreList]
    .map((cmd) => (cmd?.paths || []).map((l) => l && l[0]))
    .flat()
    .filter(Boolean);
};

const getCurrentPath = () => {
  const scriptName = process.argv[2];
  if (
    !scriptName ||
    scriptName.startsWith("-") ||
    getCommonCommands().includes(scriptName)
  ) {
    return "__";
  }
  return scriptName;
};

/**
 * This command will execute if no other script or essential plugin was called.
 *
 * Unfortunately it might conflict with other custom plugins.
 */
export abstract class CatchAllCommand extends getRunCommandClass() {
  static paths = [[getCurrentPath()]];

  constructor() {
    super();
  }

  // Overwrite RunCommand scriptName
  scriptName = getCurrentPath();
}
