import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const PACKAGES_DIR = join(__dirname,'..', 'packages');
const ROOT_PACKAGE_JSON = join(__dirname, '..','package.json');
const SUPPORTED_TS_VERSIONS = ['5.3', '5.4', '5.5', '5.6', '5.7', '5.8'];
const LATEST_TS_VERSION = SUPPORTED_TS_VERSIONS[SUPPORTED_TS_VERSIONS.length - 1];

/**
 * @param {string} packagePath 
 */
function updatePackageJson(packagePath) {
    const packageJsonPath = join(packagePath, 'package.json');
    if (!existsSync(packageJsonPath)) return;

    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    packageJson.scripts = packageJson.scripts || {};

    const scriptKeys = Object.keys(packageJson.scripts);
    const updatedScripts = { ...packageJson.scripts };
    
    scriptKeys.forEach(key => {
        if (key.startsWith('test:types:')) {
            delete updatedScripts[key];
        }
    });

    let insertIndex = scriptKeys.findIndex(key => key.startsWith('test:types:'));
    if (insertIndex === -1) insertIndex = scriptKeys.length;
    /**
     * @type {Record<string, string>}
     */
    const newScripts = {};
    scriptKeys.forEach((key, index) => {
        if (index === insertIndex) {
            SUPPORTED_TS_VERSIONS.forEach((version, i) => {
                const scriptKey = `test:types:ts${version.replace('.', '')}`;
                newScripts[scriptKey] = i === SUPPORTED_TS_VERSIONS.length - 1
                    ? 'tsc'
                    : `node ../../node_modules/typescript${version.replace('.', '')}/lib/tsc.js`;
            });
        }
        if (!key.startsWith('test:types:')) {
            newScripts[key] = packageJson.scripts[key];
        }
    });

    packageJson.scripts = newScripts;
    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log(`Updated ${packageJsonPath}`);
}

function updateRootPackageJson() {
    if (!existsSync(ROOT_PACKAGE_JSON)) {
        throw new Error('root package.json not found');
    }
    
    const rootPackageJson = JSON.parse(readFileSync(ROOT_PACKAGE_JSON, 'utf8'));
    rootPackageJson.devDependencies = rootPackageJson.devDependencies || {};
    
    rootPackageJson.devDependencies['typescript'] = `^${LATEST_TS_VERSION}`;
    
    Object.keys(rootPackageJson.devDependencies).forEach(dep => {
        if (dep.startsWith('typescript') && dep !== 'typescript') {
            delete rootPackageJson.devDependencies[dep];
        }
    });

    SUPPORTED_TS_VERSIONS.slice(0, -1).forEach(version => {
        rootPackageJson.devDependencies[`typescript${version.replace('.', '')}`] = `npm:typescript@${version}`;
    });
    
    writeFileSync(ROOT_PACKAGE_JSON, JSON.stringify(rootPackageJson, null, 2) + '\n');
    console.log(`Updated ${ROOT_PACKAGE_JSON}`);
}

function updateAllPackages() {
    if (!existsSync(PACKAGES_DIR)) {
        console.error('Packages directory not found');
        return;
    }
    
    const packageDirs = readdirSync(PACKAGES_DIR).map(name => join(PACKAGES_DIR, name)).filter(dir => statSync(dir).isDirectory());
    packageDirs.forEach(updatePackageJson);

    updateRootPackageJson();
}



updateAllPackages();
