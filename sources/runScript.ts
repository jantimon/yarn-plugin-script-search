import { BaseCommand } from "@yarnpkg/cli";
import { execute } from "@yarnpkg/shell";

export const runScript = async (scriptName: string, cmd: BaseCommand) => {
  process.exitCode = await execute(`yarn`, [scriptName], {
    cwd: cmd.context.cwd,
    stdin: cmd.context.stdin,
    stdout: cmd.context.stdout,
    stderr: cmd.context.stderr,
  });
};
