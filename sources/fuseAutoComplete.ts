import AutoComplete from "enquirer/lib/prompts/AutoComplete";
import Fuse from "fuse.js";

export class FuseAutoComplete extends AutoComplete {
  constructor(options) {
    super({
      suggest: (input: string, choices: { message: string }[]) => {
        const fuse = new Fuse(choices, { keys: ["message"] });
        const result = input.length
          ? fuse.search(input).map((item) => item)
          : choices;
        return result;
      },
      ...options,
    });

    // Patch the initial state to allow setting an initial value
    (this as any).state.cursor = (options.input || "").length;
  }

  async run() {
    const result = super.run();
    setTimeout(() => {
      (this as any).complete().catch(() => {
        setTimeout(() => {
          (this as any).complete();
        }, 20);
      });
    }, 20);
    return result;
  }
}
