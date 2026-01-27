
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';

// --- Configuration ---
export const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SRC_DIR = path.join(ROOT_DIR, 'src');
export const REPORT_FILE = path.join(ROOT_DIR, 'hygiene-report.md');

// --- Helpers ---

export function getAllFiles(dir: string, extensions: string[] = ['.ts', '.tsx', '.js', '.jsx']): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(filePath, extensions));
    } else {
      if (extensions.includes(path.extname(file))) {
        results.push(filePath);
      }
    }
  }
  return results;
}

// --- AST Parsing ---

export interface FileAnalysis {
  filePath: string;
  exports: string[];
  imports: string[]; // Imported module paths
  identifiers: Set<string>; // All identifiers used in the file
}

export function analyzeFile(filePath: string): FileAnalysis {
  const content = fs.readFileSync(filePath, 'utf-8');
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true
  );

  const exports: string[] = [];
  const imports: string[] = [];
  const identifiers = new Set<string>();

  function visit(node: ts.Node) {
    // Collect all identifiers for loose matching fallback
    if (ts.isIdentifier(node)) {
      identifiers.add(node.text);
    }

    // Collect Imports
    if (ts.isImportDeclaration(node)) {
      if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        imports.push(node.moduleSpecifier.text);
      }
    }

    // Collect Exports
    // export const/function/class ...
    if (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node) || ts.isVariableStatement(node) || ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node) || ts.isEnumDeclaration(node)) {
      if (node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
        if (ts.isVariableStatement(node)) {
          node.declarationList.declarations.forEach(d => {
            if (ts.isIdentifier(d.name)) exports.push(d.name.text);
          });
        } else if (node.name && ts.isIdentifier(node.name)) {
          exports.push(node.name.text);
        }
      }
    }
    // export { ... }
    if (ts.isExportDeclaration(node)) {
      if (node.exportClause && ts.isNamedExports(node.exportClause)) {
        node.exportClause.elements.forEach(e => {
          exports.push(e.name.text);
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return { filePath, exports, imports, identifiers };
}

// --- Analysis Logic ---

export function findUnusedComponents(files: string[]) {
  const analysisMap = new Map<string, FileAnalysis>();

  // 1. Analyze all files
  for (const file of files) {
    analysisMap.set(file, analyzeFile(file));
  }

  const unusedComponents: { file: string, component: string }[] = [];

  // 2. Check src/components specifically
  const componentFiles = files.filter(f => f.includes(path.join(SRC_DIR, 'components')));

  for (const compFile of componentFiles) {
    const analysis = analysisMap.get(compFile);
    if (!analysis || analysis.exports.length === 0) continue;

    // For each export in a component file, check if it is used ANYWHERE else
    for (const exportedName of analysis.exports) {
      let isUsed = false;

      // Check all other files
      for (const [otherPath, otherAnalysis] of analysisMap.entries()) {
        if (otherPath === compFile) continue;

        // Strict Check: specific import? (Hard with simple AST)
        // Loose Check: Is the identifier mentioned?
        if (otherAnalysis.identifiers.has(exportedName)) {
          // Refine: Component names are usually unique enough.
          // If 'Button' is used, it might be granular.
          // But 'ListingManagementTab' is specific.
          isUsed = true;
          break;
        }
      }

      if (!isUsed) {
        // Double check index exports (barrel files often re-export)
        // If it's a default export, the name might be 'default', so we check usage of the FILENAME
        if (exportedName === 'default') {
          // Check if file path is imported
          // This is tricky without resolving.
          // We'll skip default exports for this safety pass to avoid false positives.
          continue;
        }

        unusedComponents.push({ file: compFile, component: exportedName });
      }
    }
  }

  return unusedComponents;
}

// --- GCP Guardrails ---
export function checkGcpGuardrails() {
  const issues: string[] = [];
  const serverDir = path.join(ROOT_DIR, 'server');
  // Guard against running in envs where server dir might not exist (e.g. tests)
  // but typically it should.
  if (!fs.existsSync(serverDir)) return issues;

  // Check for unnecessary dirs in server/ that might be deployed
  // This is a naive check of what EXISTS, not what is bundled.
  // Real check would be .gcloudignore

  const gcloudIgnorePath = path.join(ROOT_DIR, '.gcloudignore');
  if (fs.existsSync(gcloudIgnorePath)) {
    const content = fs.readFileSync(gcloudIgnorePath, 'utf-8');
    if (!content.includes('tests/') && !content.includes('docs/')) {
      issues.push('⚠️ .gcloudignore might be missing exclusions for tests/ or docs/');
    }
  } else {
    // Only report if we expect it to exist (might not in minimal test env)
    // But for OlyBars it strictly should.
    issues.push('⚠️ No .gcloudignore found in root. GCP might bundle everything.');
  }
  return issues;
}


// --- Main ---

export function main() {
  console.log('🧹 OlyBars Janitor Starting...');

  if (!fs.existsSync(SRC_DIR)) {
    console.error(`Error: src directory not found at ${SRC_DIR}`);
    process.exit(1);
  }

  const files = getAllFiles(SRC_DIR);
  console.log(`Analyzed ${files.length} source files.`);

  const unused = findUnusedComponents(files);
  const gcpIssues = checkGcpGuardrails();

  // Generate Report
  let report = '# 🧹 Janitor Hygiene Report\n\n';
  report += `**Generated:** ${new Date().toISOString()}\n\n`;

  report += '## 1. Potentially Unused Components\n';
  report += '> [!WARNING]\n> These components appear to be exported but not imported or referenced by name in the codebase. Verify manually before deleting.\n\n';

  if (unused.length === 0) {
    report += '_No unused components found._\n';
  } else {
    unused.forEach(({ file, component }) => {
      const relPath = path.relative(ROOT_DIR, file);
      report += `- [ ] **${component}** in \`${relPath}\`\n`;
    });
  }

  report += '\n## 2. GCP Deployment Guardrails\n';
  if (gcpIssues.length === 0) {
    report += '✅ GCP configuration looks clean.\n';
  } else {
    gcpIssues.forEach(issue => report += `- ${issue}\n`);
  }

  fs.writeFileSync(REPORT_FILE, report);
  console.log(`Report generated at: ${REPORT_FILE}`);
}

// Only execute if running directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
