const fs = require('fs');
const path = require('path');

// Create public directory if it doesn't exist
if (!fs.existsSync('public')) {
  fs.mkdirSync('public');
}

// Copy individual files
const filesToCopy = [
  'index.html', 'login.html', 'courses.html', 'learn.html', 'instructors.html',
  'community.html', 'about.html', 'notices.html', 'ai.html', 'contact.html',
  'exams.html', 'data.js', 'MonthlyQuizExam/style.css'
];

filesToCopy.forEach(file => {
  if (fs.existsSync(file)) {
    fs.copyFileSync(file, path.join('public', path.basename(file)));
  }
});

// Copy directories
const dirsToCopy = ['api', 'Company_disipline', 'MonthlyQuizExam', 'Safety'];

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  entries.forEach(entry => {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

dirsToCopy.forEach(dir => {
  copyDir(dir, path.join('public', dir));
});

console.log('Build completed successfully!');
