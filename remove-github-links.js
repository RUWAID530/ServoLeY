const fs = require('fs');
const path = require('path');

// Function to remove funding sections from package-lock.json files
function removeFundingLinks(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // Remove funding sections
    let updatedContent = content.replace(/,\s*"funding":\s*{[^}]*}/g, '');

    // Remove repository sections
    updatedContent = updatedContent.replace(/,\s*"repository":\s*{[^}]*}/g, '');

    // Remove any remaining github.com URLs
    updatedContent = updatedContent.replace(/https:\/\/github\.com\/[^\s",}]+/g, '');

    // Clean up any leftover commas
    updatedContent = updatedContent.replace(/,\s*}/g, '}');
    updatedContent = updatedContent.replace(/,\s*]/g, ']');

    fs.writeFileSync(filePath, updatedContent);
    console.log(`✅ Removed GitHub links from ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Function to process all files in a directory
function processDirectory(dirPath, extensions = ['.json', '.md', '.js', '.ts', '.tsx']) {
  try {
    const files = fs.readdirSync(dirPath);

    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        // Skip node_modules directories
        if (file !== 'node_modules') {
          processDirectory(filePath, extensions);
        }
      } else if (extensions.includes(path.extname(file))) {
        // Process files with specified extensions
        if (file === 'package-lock.json') {
          removeFundingLinks(filePath);
        } else {
          try {
            const content = fs.readFileSync(filePath, 'utf8');

            // Remove any github.com URLs
            const updatedContent = content.replace(/https:\/\/github\.com\/[^\s",}]+/g, '');

            // Only write if content changed
            if (content !== updatedContent) {
              fs.writeFileSync(filePath, updatedContent);
              console.log(`✅ Removed GitHub links from ${filePath}`);
            }
          } catch (error) {
            console.error(`❌ Error processing ${filePath}:`, error.message);
          }
        }
      }
    });
  } catch (error) {
    console.error(`❌ Error processing directory ${dirPath}:`, error.message);
  }
}

// Main execution
console.log('🔍 Starting to remove GitHub links...');
console.log('=====================================');

// Process the main directory
processDirectory(path.join(__dirname));

// Process the packages directory if it exists

console.log('=====================================');
console.log('✅ GitHub links removal process completed!');
