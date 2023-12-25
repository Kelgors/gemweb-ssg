import { program } from "commander";
import path from "node:path";
import { build } from "./build";
import { FormatType } from "./render";

void program
  .argument("<source>", "Directory containing your website in markdown")
  .argument("<destination>", "Directory you want to put your website in")
  .option('--html', 'Will output html from markdown', false)
  .option('--gmi', 'Will output gemini from markdown', false)
  .option('--author <name>', 'Define the site author')
  .option('--feed <path>', 'Define the relative path to generate rss,atom feeds')
  .option('--domain <domain>', 'Define the domain to use in feed')
  .action((source, destination, options) => {
    if (options.feed) {
      if (!options.author) throw 'You must provide --author= options when you generate a feed';
      if (!options.domain) throw 'You must provide --domain= options when you generate a feed';
    }
    return build(path.normalize(source), path.normalize(destination),
      {
        author: options.author || undefined,
        feed: options.feed || undefined,
        domain: options.domain || undefined,
        formats: [options.html ? 'html' : undefined, options.gmi ? 'gemini' : undefined].filter((d): d is FormatType => !!d)
      });
  })
  .parseAsync();
