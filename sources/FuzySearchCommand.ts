import { CatchAllCommand } from "./CatchAllCommand";
import { FuseAutoComplete } from "./fuseAutoComplete";
import { readCurrentPackage } from "./readCurrentPackage";

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
      const scriptName = await this.askForScriptName();
      this.scriptName = scriptName;
      if (scriptName) {
        // Execute the script
        this.execute();
      }
    }
  }

  private async askForScriptName(): Promise<string> {
    const packageContext = await readCurrentPackage(this);

    const input = this.scriptName !== "search" ? this.scriptName : "";
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

    return await prompt.run().catch(() => "");
  }
}
