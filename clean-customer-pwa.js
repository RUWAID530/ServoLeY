const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// List of packages to keep for customer-pwa
const essentialPackages = [
  'axios',
  'react',
  'react-dom',
  'react-router-dom',
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
        console.log(`🗑️ Removed dependencies: ${removedDeps.join(', ')}`);
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
        console.log(`🗑️ Removed devDependencies: ${removedDeps.join(', ')}`);
      }
    }

    // Remove unwanted fields
    delete packageJson.repository;
    delete packageJson.bugs;
    delete packageJson.homepage;
    delete packageJson.funding;

    // Write back the cleaned package.json
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log(`✅ Cleaned package.json`);
  } catch (error) {
    console.error(`❌ Error cleaning package.json:`, error.message);
  }
}

// Function to remove node_modules directory
function removeNodeModules(dirPath) {
  const nodeModulesPath = path.join(dirPath, 'node_modules');

  if (fs.existsSync(nodeModulesPath)) {
    console.log(`🗑️ Removing node_modules directory...`);
    try {
      // For Windows
      exec(`rd /s /q "${nodeModulesPath}"`, { stdio: 'ignore' });
      console.log(`✅ Removed node_modules directory`);
    } catch (error) {
      console.error(`❌ Failed to remove node_modules:`, error.message);
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
function main() {
  console.log('🧹 Cleaning customer-pwa...');
  console.log('=====================================');

  const customerPwaPath = path.join(__dirname, 'customer-pwa');

  if (!fs.existsSync(customerPwaPath)) {
    console.error(`❌ Directory does not exist: ${customerPwaPath}`);
    return;
  }

  console.log(`📁 Processing directory: ${customerPwaPath}`);

  // Clean package.json
  const packageJsonPath = path.join(customerPwaPath, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    cleanPackageJson(packageJsonPath);
  }

  // Remove node_modules
  removeNodeModules(customerPwaPath);

  // Remove GitHub links
  removeGitHubLinks(customerPwaPath);

  console.log('\n=====================================');
  console.log('✅ customer-pwa cleaning completed!');
  console.log('\n📦 To reinstall dependencies, run:');
  console.log('cd customer-pwa && npm install');
}

// Run the main function
main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
