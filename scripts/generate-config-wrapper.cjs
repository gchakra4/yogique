const { existsSync } = require('fs');
const { join } = require('path');

const devtoolsGenerator = join(process.cwd(), 'devtools', 'scripts', 'generate-config.js');

if (existsSync(devtoolsGenerator)) {
  console.log('Found devtools generator, running it...');
  require(devtoolsGenerator);
} else {
  console.log('No devtools generator found at', devtoolsGenerator);
}
