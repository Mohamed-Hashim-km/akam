const path = require('path');

module.exports = {
  apps: [
    {
      name: 'akam-digital-api',
      cwd: path.join(__dirname, 'backend'),
      script: 'dist/main.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3005,
      },
    },
    {
      name: 'akam-digital-web',
      cwd: path.join(__dirname, 'frontend'),
      script: '/usr/bin/npm',
      args: 'start -- -p 3004',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3004,
      },
    },
  ],
};
