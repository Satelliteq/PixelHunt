const { execSync } = require('child_process');
require('dotenv').config();

function deployToFirebase() {
  console.log('Deploying to Firebase...');
  
  try {
    // Build the application
    console.log('Building the application...');
    execSync('npm run build', { stdio: 'inherit' });
    
    // Deploy to Firebase
    console.log('Deploying to Firebase...');
    execSync('firebase deploy', { stdio: 'inherit' });
    
    console.log('Deployment complete!');
  } catch (error) {
    console.error('Error during deployment:', error);
    process.exit(1);
  }
}

deployToFirebase();