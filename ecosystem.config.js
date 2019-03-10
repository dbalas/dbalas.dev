module.exports = {
  apps: [{
    name: 'dbalas.dev',
    script: 'server/index.js',
    exec_mode: 'cluster', // enables clustering
    instances: 'max', // or an integer
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }]
};
