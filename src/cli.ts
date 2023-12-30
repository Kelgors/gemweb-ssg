import { program } from 'commander';
import path from 'node:path';
import { build } from './build';
import { FormatType } from './render';

void program
  .argument('<source>', 'Directory containing your website in markdown')
  .argument('<destination>', 'Directory you want to put your website in')
  .option('--html', 'Will output html from markdown', false)
  .option('--gmi', 'Will output gemini from markdown', false)
  .option('--author <name>', 'Define the default author if missing from metadata')
  .option('--feed <path>', 'Define the relative path to generate rss,atom feeds')
  .option('--feed-title <title>', 'Define the title of your feed')
  .option('--feed-desc <description>', 'Define the description of your feed')
  .option('--feed-domain <domain>', 'Define the domain to use in feed (feed)')
  .action((source, destination, options) => {
    if (options.feed) {
      if (!options.feedTitle) throw 'You must provide --feed-title= options when you generate a feed';
      if (!options.feedDomain) throw 'You must provide --feed-domain= options when you generate a feed';
    }
    return build(path.normalize(source), path.normalize(destination), {
      feed: {
        path: options.feed || undefined,
        title: options.feedTitle || undefined,
        description: options.feedDesc || undefined,
        domain: options.feedDomain || undefined,
      },
      author: options.author || undefined,
      formats: [options.html ? 'html' : undefined, options.gmi ? 'gemini' : undefined].filter(
        (d): d is FormatType => !!d,
      ),
    });
  })
  .parseAsync();
