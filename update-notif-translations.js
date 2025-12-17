const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src/i18n/locales');
const enPath = path.join(localesDir, 'en.json');

// Read English translations
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// Get all locale files except en.json
const localeFiles = fs.readdirSync(localesDir)
  .filter(file => file.endsWith('.json') && file !== 'en.json');

console.log(`Replicating ai.notif keys from en.json to ${localeFiles.length} locale files...`);

// Copy ai.notif keys to each locale file
localeFiles.forEach(file => {
  const filePath = path.join(localesDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Ensure ai section exists
  if (!data.ai) {
    data.ai = {};
  }

  // Copy the notif section from English
  data.ai.notif = enData.ai.notif;

  // Write back with proper formatting
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`  ✓ ${file}`);
});

console.log('\nDone! All locale files updated with notification translations.');
