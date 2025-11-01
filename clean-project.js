const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// List of packages to keep (essential packages)
const essentialPackages = [
  'axios',
  'bcryptjs',
  'cors',
  'dotenv',
  'express',
  'express-rate-limit',
  'helmet',
  'jsonwebtoken',
  'pg',
  'react',
  'react-dom',
  'react-router-dom',
  'socket.io',
  'socket.io-client',
  'vite',
  'typescript',
  '@types/react',
  '@types/react-dom',
  'autoprefixer',
  'postcss',
  'tailwindcss',
  '@vitejs/plugin-react'
];

// List of directories to clean
const projectDirectories = [
  path.join(__dirname),
  path.join(__dirname, 'customer-pwa'),
  path.join(__dirname, 'admin-web'),
  path.join(__dirname, 'provider-pwa')
];

// Function to check if a package is essential
function isEssentialPackage(packageName) {
  return essentialPackages.some(essential => 
    packageName === essential || 
    packageName.startsWith(`@${essential}/`) ||
    essential.includes(packageName)
  );
}

// Function to clean package.json
function cleanPackageJson(packageJsonPath) {
  try {
    const content = fs.readFileSync(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(content);

    // Clean dependencies
    if (packageJson.dependencies) {
      const originalDeps = Object.keys(packageJson.dependencies);
      packageJson.dependencies = Object.keys(packageJson.dependencies)
        .filter(dep => isEssentialPackage(dep))
        .reduce((obj, key) => {
          obj[key] = packageJson.dependencies[key];
          return obj;
        }, {});

      const removedDeps = originalDeps.filter(dep => !isEssentialPackage(dep));
      if (removedDeps.length > 0) {
        console.log(`🗑️ Removed dependencies from ${packageJsonPath}: ${removedDeps.join(', ')}`);
      }
    }

    // Clean devDependencies
    if (packageJson.devDependencies) {
      const originalDeps = Object.keys(packageJson.devDependencies);
      packageJson.devDependencies = Object.keys(packageJson.devDependencies)
        .filter(dep => isEssentialPackage(dep))
        .reduce((obj, key) => {
          obj[key] = packageJson.devDependencies[key];
          return obj;
        }, {});

      const removedDeps = originalDeps.filter(dep => !isEssentialPackage(dep));
      if (removedDeps.length > 0) {
        console.log(`🗑️ Removed devDependencies from ${packageJsonPath}: ${removedDeps.join(', ')}`);
      }
    }

    // Remove unwanted fields
    delete packageJson.repository;
    delete packageJson.bugs;
    delete packageJson.homepage;
    delete packageJson.funding;

    // Write back the cleaned package.json
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log(`✅ Cleaned ${packageJsonPath}`);
  } catch (error) {
    console.error(`❌ Error cleaning ${packageJsonPath}:`, error.message);
  }
}

// Function to remove node_modules directory
function removeNodeModules(dirPath) {
  const nodeModulesPath = path.join(dirPath, 'node_modules');

  if (fs.existsSync(nodeModulesPath)) {
    console.log(`🗑️ Removing ${nodeModulesPath}`);
    try {
      // For Windows
      execSync(`rd /s /q "${nodeModulesPath}"`, { stdio: 'ignore' });
      console.log(`✅ Removed ${nodeModulesPath}`);
    } catch (error) {
      console.error(`❌ Failed to remove ${nodeModulesPath}:`, error.message);
    }
  }
}

// Function to remove GitHub links from files
function removeGitHubLinks(dirPath) {
  function processDirectory(currentDir) {
    try {
      const files = fs.readdirSync(currentDir);

      files.forEach(file => {
        const filePath = path.join(currentDir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          // Skip node_modules and .git directories
          if (file !== 'node_modules' && file !== '.git') {
            processDirectory(filePath);
          }
        } else {
          try {
            const content = fs.readFileSync(filePath, 'utf8');

            // Remove GitHub URLs
            let updatedContent = content.replace(/https:\/\/github\.com\/[^\s",}]+/g, '');

            // Remove repository sections
            updatedContent = updatedContent.replace(/,\s*"repository":\s*{[^}]*}/g, '');

            // Remove funding sections
            updatedContent = updatedContent.replace(/,\s*"funding":\s*{[^}]*}/g, '');

            // Clean up any leftover commas
            updatedContent = updatedContent.replace(/,\s*}/g, '}');
            updatedContent = updatedContent.replace(/,\s*]/g, ']');

            // Only write if content changed
            if (content !== updatedContent) {
              fs.writeFileSync(filePath, updatedContent);
              console.log(`✅ Removed GitHub links from ${filePath}`);
            }
          } catch (error) {
            // Skip binary files
          }
        }
      });
    } catch (error) {
      console.error(`❌ Error processing directory ${currentDir}:`, error.message);
    }
  }

  processDirectory(dirPath);
}

// Main function
async function main() {
  console.log('🧹 Cleaning project...');
  console.log('=====================================');

  // Clean each project directory
  for (const dir of projectDirectories) {
    if (!fs.existsSync(dir)) {
      console.log(`⚠️ Directory does not exist: ${dir}`);
      continue;
    }

    console.log(`\n📁 Processing directory: ${dir}`);

    // Clean package.json
    const packageJsonPath = path.join(dir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      cleanPackageJson(packageJsonPath);
    }

    // Remove node_modules
    removeNodeModules(dir);

    // Remove GitHub links
    removeGitHubLinks(dir);
  }

  console.log('\n=====================================');
  console.log('✅ Project cleaning completed!');
  console.log('\n📦 To reinstall dependencies, run:');
  console.log('npm install');
  console.log('\n💡 Tip: You can run this script periodically to keep your project clean');
}

// Run the main function
main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
