
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import pc from 'picocolors';
import ora from 'ora';
import * as p from '@clack/prompts';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const STATUS_FILE = path.join(ROOT_DIR, 'hygiene-status.json');
const JANITOR_IGNORE = path.join(ROOT_DIR, '.janitorignore');
const GCLOUD_IGNORE = path.join(ROOT_DIR, '.gcloudignore');

interface HygieneStatus {
  score: number;
  issues: {
    details: {
      unused: { component: string; file: string }[];
      gcp: string[];
    };
  };
}

async function main() {
  p.intro(pc.bgMagenta(pc.black(' ✨ OLYBARS AUTO-REMEDIATION ')));

  if (!fs.existsSync(STATUS_FILE)) {
    p.cancel('No hygiene status found. Run `npm run janitor` first.');
    process.exit(1);
  }

  const status: HygieneStatus = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf-8'));

  // --- Phase 1: GCP Fixes ---
  if (status.issues.details.gcp.length > 0) {
    p.note(pc.yellow('Found GCP Integrity Issues. Fixing these adds +15 points!'), 'Phase 1: Security');

    // Check specifically for the .gcloudignore issue we know how to fix
    const hasIgnoreIssue = status.issues.details.gcp.some(i => i.includes('.gcloudignore'));

    if (hasIgnoreIssue) {
      const fixGcp = await p.confirm({
        message: 'Fix missing .gcloudignore? (Safely appends rules)',
        initialValue: true,
      });

      if (!p.isCancel(fixGcp) && fixGcp) {
        const rules = ['\n# OlyBars Standard Exclusions', 'tests/', 'docs/', 'src/', 'tsconfig.json'];
        try {
          if (fs.existsSync(GCLOUD_IGNORE)) {
            fs.appendFileSync(GCLOUD_IGNORE, rules.join('\n'));
          } else {
            fs.writeFileSync(GCLOUD_IGNORE, rules.join('\n'));
          }
          p.log.success(pc.green('Fixed .gcloudignore'));
        } catch (e) {
          p.log.error(pc.red('Failed to write .gcloudignore'));
        }
      }
    }
  }

  // --- Phase 2: Component Cleanup ---
  const unused = status.issues.details.unused;
  if (unused.length > 0) {
    p.note(pc.blue(`Found ${unused.length} Unused Components. (+3 points each)`), 'Phase 2: Clutter');

    for (const item of unused) {
      const action = await p.select({
        message: `Unused: ${pc.bold(item.component)} in ${pc.dim(item.file)}`,
        options: [
          { value: 'delete', label: 'Delete File', hint: 'Permanently remove' },
          { value: 'ignore', label: 'Safelist', hint: 'Add to .janitorignore' },
          { value: 'skip', label: 'Skip', hint: 'Decide later' },
        ],
      });

      if (p.isCancel(action)) {
        p.outro('Exiting remediation.');
        process.exit(0);
      }

      if (action === 'delete') {
        try {
          const fullPath = path.join(ROOT_DIR, item.file);
          fs.unlinkSync(fullPath);
          p.log.success(pc.red(`Deleted ${item.file}`));
        } catch (e) {
          p.log.error(`Failed to delete: ${e}`);
        }
      } else if (action === 'ignore') {
        try {
          fs.appendFileSync(JANITOR_IGNORE, `\n${item.file.replace(/\\/g, '/')}`);
          p.log.success(pc.dim('Added to safelist.'));
        } catch (e) {
          p.log.error('Failed to update ignore list.');
        }
      }
    }
  } else {
    p.log.message(pc.green('No unused components to clean.'));
  }

  // --- Verification ---
  const s = ora('Re-running Janitor to verify score...').start();
  execSync('npm run janitor', { stdio: 'ignore' });
  const newStatus: HygieneStatus = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf-8'));
  s.succeed(pc.green(`New Score: ${newStatus.score}/100`));

  p.outro('Remediation Complete.');
}

main().catch(console.error);
