module.exports = {
  apps: [
    {
      name: 'coresight-backend',
      script: 'server.js',
      env: {
        NODE_ENV: 'production',
      },
      watch: false,
      instances: 1,
      autorestart: true,
      max_memory_restart: '1G',
      error_file: 'logs/error.log',
      out_file: 'logs/output.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
    {
      name: 'coresight-health',
      script: 'health.js',
      env: {
        NODE_ENV: 'production',
        HEALTH_PORT: 3001
      },
      watch: false,
      instances: 1,
      autorestart: true,
      max_memory_restart: '1G',
      error_file: 'logs/health-error.log',
      out_file: 'logs/health-output.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    }
  ]
} 