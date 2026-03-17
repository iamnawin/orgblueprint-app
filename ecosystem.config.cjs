module.exports = {
  apps: [
    {
      name: 'orgblueprint-3000',
      cwd: './apps/web',
      script: 'node_modules/next/dist/bin/next',
      args: 'dev -p 3000',
      interpreter: 'C:/Program Files/nodejs/node.exe',
      env: {
        NODE_ENV: 'development',
      },
    },
  ],
};
