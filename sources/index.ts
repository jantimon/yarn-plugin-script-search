import type { Plugin } from "@yarnpkg/core";
import { createCatchAllCommand } from "./createCatchAllCommand";
import { FuseAutoComplete } from "./fuseAutoComplete";
import { readCurrentPackage } from "./readCurrentPackage";
import { runScript } from "./runScript";

const commandName = "script";

const plugin: Plugin = {
  commands: createCatchAllCommand([commandName], async (scriptName, command) => {
    const packageContext = await readCurrentPackage(command);

    const input = scriptName !== commandName ? scriptName : "";
    if (input) {
      console.log(`"yarn ${input}" not found in ${packageContext.name}\n\n`);
    }

    const prompt = new FuseAutoComplete({
      name: "scriptToRun",
      message: "🔍 search for a command",
      limit: 10,
      choices: packageContext.scriptNames,
      input,
    });
    const result = await prompt.run().catch(() => "");
    if (result === "") {
      return;
    }
    await runScript(result, command);
  }),
};
export default plugin;
