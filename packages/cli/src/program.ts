import { CATEGORIES } from "@mailhearth/core";
import { Command } from "commander";

export function buildProgram(): Command {
  const program = new Command();

  program
    .name("hearth")
    .description("Privacy-first, local AI email organizer. Your mail never leaves your machine.")
    .version("0.0.0");

  program
    .command("categories")
    .description("List the categories mailhearth sorts mail into")
    .action(() => {
      for (const category of CATEGORIES) console.log(category);
    });

  program
    .command("scan")
    .description("Scan a mail source and print a category report (not implemented yet)")
    .argument("<source>", "path to an .mbox file")
    .action((source: string) => {
      console.error(`scan is not implemented yet (source: ${source}).`);
      process.exitCode = 1;
    });

  return program;
}
