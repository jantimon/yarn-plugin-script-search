import type { RunCommand } from "@yarnpkg/plugin-essentials";
import { BaseCommand } from "@yarnpkg/cli";
// Hack around crazy compiler optimizations which break the import 🤷‍♂️
import * as essentialsPlugin from "@yarnpkg/plugin-essentials";

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
};

const getCommonCommands = () => {
    // Yarns build process tries to resolve ESM default exports which breaks the import.
    // We work around this with a string literal:
    const essentialPluginCommands = essentialsPlugin["def" + "ault"].commands;
    return essentialPluginCommands.map((cmd) => (cmd?.paths || []).map((l) => l && l[0])).flat().filter(Boolean)
}

/**
 * Create a yarn fallback command which runs if no other command matches.
 *
 * By now yarn has no official API for this, so the underlying implementation is quite fragile.
 * It might break with future yarn versions.
 */
export const createCatchAllCommand = (
  scriptNames: string[],
  executeFallback: (scriptName: string, command: BaseCommand) => Promise<void>
) => {
  const commands: (new () => BaseCommand)[] = [];

  class DirectCommand extends BaseCommand {
    static paths = [scriptNames];
    async execute() {
      executeFallback(scriptName, this);
    }
  }

  if (scriptNames.length) {
    commands.push(DirectCommand);
  }

  const scriptName = process.argv[2];
  if (!scriptName || getCommonCommands().includes(scriptName)) {
    return commands;
  }
  const RunCommandClass = getRunCommandClass();
  if (!RunCommandClass) {
    console.warn("heuristic module detection failed, fallback will not work");
    return commands;
  }
  class FallbackScriptCommand extends RunCommandClass {
    static paths = [[scriptName]];

    constructor() {
      super();
    }

    scriptName = scriptName;

    async execute() {
      try {
        return await super.execute();
      } catch (e) {
        if (
          e instanceof Error &&
          e.message.startsWith("Couldn't find a script name")
        ) {
          await executeFallback(scriptName, this);
          return;
        }
        throw e;
      }
    }
  }

  commands.push(FallbackScriptCommand);
  return commands;
};
