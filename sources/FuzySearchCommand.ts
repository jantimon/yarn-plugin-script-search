import { CatchAllCommand } from "./CatchAllCommand";
import { escapArgs, extractQuotedTexts } from "./escapeShell";
import { FuseAutoComplete } from "./fuseAutoComplete";
import { PackageContext, readCurrentPackage } from "./readCurrentPackage";
import InputPrompt from "enquirer/lib/prompts/input";

export class FuzySearchCommand extends CatchAllCommand {
  async execute() {
    try {
      // Run the current script name
      // e.g. yarn dev
      return await super.execute();
    } catch (e) {
      // Ignore unknown errors
      if (
        !(
          e instanceof Error &&
          e.message.startsWith("Couldn't find a script name")
        )
      ) {
        throw e;
      }
      // Prompt the user for a new script
      const { cmd, args } = await this.askForScriptName();
      this.scriptName = cmd;
      this.args = args;
      if (cmd) {
        // Execute the script
        this.execute();
      }
    }
  }

  private async askForScriptName(): Promise<{ cmd: string; args: string[] }> {
    const packageContext = await readCurrentPackage(this);

    // Ignore search as scriptName to allow `yarn search` or `yarn search baz`
    const cliArgs = process.argv.slice(this.scriptName !== "search" ? 2 : 3);
    const input = cliArgs.shift() || "";

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

    const cmd = await prompt.run().catch(() => null);
    if (cmd === null) {
      return { cmd: "", args: [] };
    }

    if (cmd) {
      await this.renderDocs(packageContext, cmd);
    }

    const initialArgs = escapArgs(cliArgs);
    const argPrompt = new InputPrompt({
      name: "🔥 Press [Enter] to run",
      initial: initialArgs,
    });
    argPrompt.cursor = initialArgs.length;

    const args = await argPrompt.run().catch(() => null);
    if (args === null) {
      this.scriptName = input;
      return { cmd: "", args: [] };
    }

    return {
      cmd,
      args: extractQuotedTexts(args),
    };
  }

  private async renderDocs(packageContext: PackageContext, scriptName: string) {
    const { documentation } = packageContext.pluginConfig;
    // Allow to ouput script documentation by defining a script
    // in the projects package.json yarn-plugin-script-search documentation
    if (documentation) {
      this.scriptName = documentation;
      this.args = [scriptName];
      try {
        await this.execute();
      } catch (e) {
        // ignore
      }
    }
  }
}
