import { BaseCommand } from "@yarnpkg/cli";
import { Project, Configuration } from "@yarnpkg/core";

export type PackageContext = {
  name: string;
  scriptNames: string[];
  pluginConfig: {
    documentation?: string;
  };
};

export const readCurrentPackage = async (
  cmd: BaseCommand
): Promise<PackageContext> => {
  const configuration = await Configuration.find(
    cmd.context.cwd,
    cmd.context.plugins
  );
  const { project, locator } = await Project.find(
    configuration,
    cmd.context.cwd
  );
  const effectiveLocator = (cmd as BaseCommand & { topLevel?: boolean })
    .topLevel
    ? project.topLevelWorkspace.anchoredLocator
    : locator;
  const manifest = project.getWorkspaceByLocator(effectiveLocator).manifest;
  const scripts = manifest.scripts || new Map<string, string>();
  const pluginConfig = manifest.raw["yarn-plugin-script-search"] || {};

  // Ignore scripts starting with #
  const scriptNames = [...scripts.keys()].filter(
    (scriptName) =>
      scriptName &&
      typeof scriptName === "string" &&
      !scriptName.startsWith("#")
  );

  return {
    name: effectiveLocator.name,
    scriptNames,
    pluginConfig,
  };
};
