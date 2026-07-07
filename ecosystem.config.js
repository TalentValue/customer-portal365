module.exports = {
  apps: [
    {
      name: 'clientportal365-server',
      cwd: __dirname + '/server',
      script: 'dist/index.js',
      env: {
        NODE_ENV: 'production',
      },
      restart_delay: 3000,
      max_restarts: 10,
    },
  ],
}
