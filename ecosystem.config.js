module.exports = {
  apps: [
    {
      name: 'servoley-server',
      script: 'server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      merge_logs: true,
      env: {
        NODE_ENV: 'development',
        PORT: 8084
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 8084,
        LOG_LEVEL: 'info',
        LOG_TO_FILE: 'true'
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000
    }
  ]
};
