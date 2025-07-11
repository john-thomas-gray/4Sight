import fs from "fs";
import path from "path";

const assetDirs = {
  icons: "./assets/icons",
  images: "./assets/images",
  backgrounds: "./assets/backgrounds",
  banners: "./assets/banners",
  logos: "./assets/logos"
};

const outputFilePath = "./constants/index.ts";

function toCamelCase(fileName: string): string {
  return fileName
    .replace(/\.[^/.]+$/, "") // Remove extension
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase()) // kebab/snake to camelCase
    .replace(/^[^a-zA-Z]+/, ""); // remove invalid starting characters
}

/**
 * Recursively read files from directory and return all asset files found
 * ignoring folder structure.
 */
function readAssetFilesRecursively(dir: string): string[] {
  let results: string[] = [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue; // skip hidden files/folders

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Recurse into subfolder
      results = results.concat(readAssetFilesRecursively(fullPath));
    } else {
      // Check extension
      const ext = path.extname(entry.name).toLowerCase();
      if ([".png", ".jpg", ".jpeg", ".svg"].includes(ext)) {
        results.push(fullPath);
      }
    }
  }

  return results;
}

function generateImportsAndExports() {
  const importLines: string[] = [];
  const exportGroups: Record<string, string[]> = {
    icons: [],
    images: [],
    backgrounds: [],
    banners: [],
    logos: []
  };

  for (const [group, dir] of Object.entries(assetDirs)) {
    const fullDir = path.resolve(dir);
    const assetFiles = readAssetFilesRecursively(fullDir);

    for (const filePath of assetFiles) {
      const fileName = path.basename(filePath);
      const varName = toCamelCase(fileName);
      if (!varName) continue; // skip if no valid name

      // Create import path relative to outputFilePath location
      // Assuming outputFilePath is relative to project root
      let relativeImportPath = path.relative(
        path.dirname(outputFilePath),
        filePath
      );

      // Normalize path separators to posix style for imports
      relativeImportPath = relativeImportPath.split(path.sep).join("/");

      // Prepend './' if it does not start with '.' or '/'
      if (
        !relativeImportPath.startsWith(".") &&
        !relativeImportPath.startsWith("/")
      ) {
        relativeImportPath = "./" + relativeImportPath;
      }

      importLines.push(`import ${varName} from "${relativeImportPath}";`);
      exportGroups[group].push(varName);
    }
  }

  const exportLines = Object.entries(exportGroups).map(
    ([groupName, identifiers]) => {
      const items = identifiers.map(id => `  ${id},`).join("\n");
      return `export const ${groupName} = {\n${items}\n};`;
    }
  );

  const fullOutput = [...importLines, "", ...exportLines].join("\n\n");

  fs.writeFileSync(outputFilePath, fullOutput);
  console.log(`✅ Asset file written to ${outputFilePath}`);
}

generateImportsAndExports();
