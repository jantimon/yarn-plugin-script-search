export function extractQuotedTexts(input: string) {
  const regex = /'([^']*)'|"((?:[^"\\]|\\.)*)"|(\S+)/g;
  const matches = [];
  let match;

  while ((match = regex.exec(input)) !== null) {
    const [, singleQuotes, doubleQuotes, word] = match;
    if (singleQuotes) {
      matches.push(singleQuotes);
    } else if (doubleQuotes) {
      matches.push(doubleQuotes.replace(/\\(.)/g, "$1"));
    } else {
      matches.push(word);
    }
  }

  return matches;
}

export function escapArgs(args: string[]) {
  return args.map(escapeArg).join(" ");
}

function escapeArg(arg: string) {
  if (arg === "") return `""`;
  if (!/[^%+,-.\/:=@_0-9A-Za-z]/.test(arg)) return arg;
  return JSON.stringify(arg);
}
