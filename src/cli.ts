import { program } from "commander";
import path from "path";
import { build } from "./build";

void program
  .argument("<source>", "Directory containing your website in markdown")
  .argument("<destination>", "Directory you want to put your website in")
  .action((source, destination) => {
    return build(path.normalize(source), path.normalize(destination));
  })
  .parseAsync();
