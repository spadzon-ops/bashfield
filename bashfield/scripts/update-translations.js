// Script to automatically update all files to use comprehensive translations
const fs = require('fs')
const path = require('path')

// List of directories to scan
const directories = [
  'pages',
  'components',
  'hooks'
]

// Common text patterns that should be translated
const translationPatterns = [
  // Navigation
  { pattern: /(['"`])Home\1/g, replacement: "{t('Home')}" },
  { pattern: /(['"`])Messages\1/g, replacement: "{t('Messages')}" },
  { pattern: /(['"`])Favorites\1/g, replacement: "{t('Favorites')}" },
  { pattern: /(['"`])Profile\1/g, replacement: "{t('Profile')}" },
  { pattern: /(['"`])Admin\1/g, replacement: "{t('Admin')}" },
  { pattern: /(['"`])Login\1/g, replacement: "{t('Login')}" },
  { pattern: /(['"`])Logout\1/g, replacement: "{t('Logout')}" },
  { pattern: /(['"`])Sign In\1/g, replacement: "{t('Sign In')}" },
  { pattern: /(['"`])Sign Up\1/g, replacement: "{t('Sign Up')}" },
  
  // Common UI
  { pattern: /(['"`])Loading\.\.\.\1/g, replacement: "{t('Loading...')}" },
  { pattern: /(['"`])Save\1/g, replacement: "{t('Save')}" },
  { pattern: /(['"`])Cancel\1/g, replacement: "{t('Cancel')}" },
  { pattern: /(['"`])Edit\1/g, replacement: "{t('Edit')}" },
  { pattern: /(['"`])Delete\1/g, replacement: "{t('Delete')}" },
  { pattern: /(['"`])Update\1/g, replacement: "{t('Update')}" },
  { pattern: /(['"`])Search\1/g, replacement: "{t('Search')}" },
  { pattern: /(['"`])Filter\1/g, replacement: "{t('Filter')}" },
  { pattern: /(['"`])Clear\1/g, replacement: "{t('Clear')}" },
  { pattern: /(['"`])Apply\1/g, replacement: "{t('Apply')}" },
  { pattern: /(['"`])Submit\1/g, replacement: "{t('Submit')}" },
  { pattern: /(['"`])Back\1/g, replacement: "{t('Back')}" },
  { pattern: /(['"`])Next\1/g, replacement: "{t('Next')}" },
  { pattern: /(['"`])Previous\1/g, replacement: "{t('Previous')}" },
  { pattern: /(['"`])Yes\1/g, replacement: "{t('Yes')}" },
  { pattern: /(['"`])No\1/g, replacement: "{t('No')}" },
  { pattern: /(['"`])Close\1/g, replacement: "{t('Close')}" }
]

function updateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    let updated = false
    
    // Apply translation patterns
    translationPatterns.forEach(({ pattern, replacement }) => {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement)
        updated = true
      }
    })
    
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8')
      console.log(`Updated: ${filePath}`)
    }
    
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message)
  }
}

function scanDirectory(dir) {
  const fullPath = path.join(__dirname, '..', dir)
  
  if (!fs.existsSync(fullPath)) {
    console.log(`Directory not found: ${fullPath}`)
    return
  }
  
  const files = fs.readdirSync(fullPath, { withFileTypes: true })
  
  files.forEach(file => {
    const filePath = path.join(fullPath, file.name)
    
    if (file.isDirectory()) {
      scanDirectory(path.join(dir, file.name))
    } else if (file.name.endsWith('.js') || file.name.endsWith('.jsx')) {
      updateFile(filePath)
    }
  })
}

console.log('Starting comprehensive translation update...')

directories.forEach(dir => {
  console.log(`\nScanning ${dir}/...`)
  scanDirectory(dir)
})

console.log('\nTranslation update complete!')