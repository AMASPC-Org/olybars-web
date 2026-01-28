import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import pc from 'picocolors';
import ora from 'ora';
import * as p from '@clack/prompts';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const STATUS_FILE = path.resolve(__dirname, '../hygiene-status.json');
const MIN_SCORE = 80;
const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours

// Environment
const isInteractive = process.stdout.isTTY && !process.env.CI;
const skipVerify = process.argv.includes('--no-verify');

if (skipVerify) {
  console.log(pc.dim('  • Health check skipped via --no-verify'));
  process.exit(0);
}

// Data Contract
interface HygieneStatus {
  score: number;
  generatedAt: string;
  issues: {
    unusedComponents: number;
    gcpViolations: number;
  };
}

async function main() {
  p.intro(pc.bgCyan(pc.black(' OLYBARS SYSTEM INTEGRITY ')));

  let status: HygieneStatus | null = null;
  let runJanitor = false;

  const s = ora('Checking hygiene status...').start();

  // 1. Load Data
  try {
    if (!fs.existsSync(STATUS_FILE)) {
      s.fail(pc.yellow('Hygiene status missing.'));
      runJanitor = true;
    } else {
      const fileContent = fs.readFileSync(STATUS_FILE, 'utf-8');
      status = JSON.parse(fileContent);

      // 2. Validate Freshness
      const generatedAt = new Date(status!.generatedAt).getTime();
      const age = Date.now() - generatedAt;

      if (age > STALE_THRESHOLD_MS) {
        s.fail(pc.yellow(`Hygiene report is stale (${Math.round(age / 3600000)}h old).`));
        runJanitor = true;
      } else {
        s.succeed(pc.green('Hygiene data is fresh.'));
      }
    }
  } catch (e) {
    s.fail(pc.red('Hygiene data corrupt.'));
    runJanitor = true;
  }

  // Auto-Remediation (Interactive Only)
  if (runJanitor) {
    if (isInteractive) {
      const shouldRun = await p.confirm({
        message: 'Run Janitor now to refresh hygiene status?',
        initialValue: true,
      });

      if (p.isCancel(shouldRun)) process.exit(0);

      if (shouldRun === true) {
        try {
          const janitorSpinner = ora('Running Janitor Audit...').start();
          try {
            execSync('npm run janitor', { stdio: 'pipe' });
            janitorSpinner.succeed(pc.green('Janitor completed successfully.'));
            // Reload content
            const newContent = fs.readFileSync(STATUS_FILE, 'utf-8');
            status = JSON.parse(newContent);
          } catch (error) {
            janitorSpinner.fail(pc.red('Janitor execution failed.'));
            console.error(pc.dim('Run `npm run janitor` manually to see full errors.'));
            process.exit(1);
          }
        } catch (e) {
          console.error(pc.red('\nUnexpected error running Janitor.'));
          process.exit(1);
        }
      } else {
        console.log(pc.yellow('Proceeding without fresh report. Caution advised.'));
        if (!!process.env.CI) {
          console.error(pc.red('CI Error: Hygiene report missing/stale. Run `npm run janitor`.'));
          process.exit(1);
        }
      }
    } else {
      console.error(pc.red('Error: Hygiene report is missing or stale. Run `npm run janitor` before committing.'));
      process.exit(1);
    }
  }

  // Step 3: Score Check
  if (status) {
    const score = status.score;
    const scoreColor = score >= MIN_SCORE ? pc.green : pc.red;

    p.note(
      `${scoreColor(score)} / 100\n` +
      pc.gray(`Unused Components: ${status.issues.unusedComponents}\n`) +
      pc.gray(`GCP Violations: ${status.issues.gcpViolations}`),
      'Vibe Hygiene Score'
    );

    if (score < MIN_SCORE) {
      if (isInteractive) {
        // Remediation Offer
        const runRemediation = await p.confirm({
          message: pc.yellow(`Score ${score} is low. Run Auto-Remediation Playbook?`),
          initialValue: true
        });

        if (!p.isCancel(runRemediation) && runRemediation) {
          // Run Remediation
          try {
            execSync('npm run remediate', { stdio: 'inherit' });
            // Upgrade: Reload status after fix
            const newContent = fs.readFileSync(STATUS_FILE, 'utf-8');
            const newStatus = JSON.parse(newContent);
            if (newStatus.score >= MIN_SCORE) {
              p.note(pc.green(`${newStatus.score} / 100`), 'New Score');
              p.outro(pc.green('Remediation Successful. Integrity Passed.'));
              process.exit(0);
            } else {
              p.note(pc.red(`${newStatus.score} / 100`), 'Still Failing');
            }
          } catch (e) {
            p.log.error('Remediation failed or cancelled.');
          }
        }

        const proceed = await p.confirm({
          message: pc.red(`Score is below threshold (${MIN_SCORE}). Commit anyway?`),
          initialValue: false,
        });

        if (p.isCancel(proceed) || proceed !== true) {
          p.cancel('Commit aborted.');
          process.exit(1);
        }
      } else {
        console.error(pc.red(`Error: Hygiene score ${score} < ${MIN_SCORE}. Fix issues or use --no-verify.`));
        process.exit(1);
      }
    }
  } else {
    // Logic gap catch-all
    if (!runJanitor) {
      p.warn(pc.yellow('Could not load score.'));
    }
  }

  p.outro(pc.green('Integrity Check Passed.'));
  process.exit(0);
}

main().catch(console.error);
