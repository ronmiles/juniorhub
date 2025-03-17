module.exports = {
  apps: [
    {
      name: 'juniorhub-backend',
      script: './dist/apps/backend/main.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
}; 