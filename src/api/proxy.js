// 各模块配置代理 统一引入这个文件
let path = require('path');
/*eslint-disable*/ 
const demoProxy = require(path.join(__dirname, '/demo/proxy.js'));

let pageProxy = {
	'/fatsapi': {
    target: 'http://wxkf.5ifapiao.com:8888',
    changeOrigin: true,
    pathRewrite: { '^/fatsapi': '/fatsapi' },
  },
  ...demoProxy,
};

module.exports = pageProxy;
