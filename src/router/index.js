import Vue from 'vue';
import Router from 'vue-router';
import NProgress from 'nprogress';
// import routes from './routeConf';
import 'nprogress/nprogress.css';
import store from '@/store';
import { getToken, login, loginout } from '@/api/apis';
import { getUrlParam } from '@/assets/utils/util';
import COMMON_ENV from '@/config/env';

Vue.use(Router);

NProgress.configure({
  easing: 'ease', // 动画方式
  speed: 500, // 递增进度条的速度
  showSpinner: false, // 是否显示加载ico
  trickleSpeed: 200, // 自动递增间隔
  minimum: 0.3, // 初始化时的最小百分比
});

const router = new Router({
  routes: [
    { name: '/', path: '/', redirect: '/index' },
    {
      path: '/index',
      name: '/index',
      meta: {
        isNotNeedLogin: true,
        title: '用户页面',
      },
      component: () => import('@/views/layout/index.vue'),
      // children: routes,
    }, {
      path: '/user',
      name: '/user',
      meta: {
        isNotNeedLogin: true,
        title: '客服页面',
      },
      component: () => import('@/views/layout/user.vue'),
      // children: routes,
    },
  ],
});

router.beforeEach(async (to, from, next) => {
  if (getUrlParam(COMMON_ENV.COMMON_REPLACE_URL)) {
    // C将COMMON_REPLACE_URL  替换会hash路由
    /*eslint-disable*/ 
    replaceFn();
     /* eslint-enable */
    return;
  }
  if (!to.meta.isHideProcess) {
    NProgress.start();
  }

  if (to.meta.isNotNeedLogin || store.getters.token) {
    // 如果无需登录标志为true 或者 token存在 进入页面
    next();
    return;
  }
  if (getUrlParam('code')) {
    // 如果有code  根据code获取token
    let res = await getToken({ code: getUrlParam('code') });
    console.log(res);
    if (res.data.code === 0) {
      // 获取token 成功
      store.commit('setToken', res.data.data.access_token);
      next();
    } else {
      loginout();
    }
  } else {
    login('login', to.fullPath);
  }
  // 如果没有token 去登录
  // login();
});

router.afterEach(async (to) => {
  document.title = to.meta.title || '加载中...';
  if (!to.meta.isHideProcess) {
    NProgress.done();
  }

  // ...
});

function replaceFn() {
  // 登录回跳地址转换成hash路由
  let href = window.location.href.substring(0, window.location.href.length - 2);
  let host = href.split('?')[0];
  let queryList = href.split('?')[1].split('&');
  let query = '';
  let path = '';
  if (queryList.length > 0) {
    let i = -1;
    queryList.forEach((item, index) => {
      if (item.indexOf(COMMON_ENV.COMMON_REPLACE_URL) === 0) {
        //
        path = decodeURIComponent(item.split('=')[1]);
        i = index;
      }
    });
    if (i !== -1) {
      queryList.splice(i, 1);
    }
  }
  query = queryList.join('&');
  console.log(`${host}#/${path}?${query}`);
  if (query) {
    window.location.href = `${host}#/${path}?${query}`;
  } else {
    window.location.href = `${host}#/${path}`;
  }
}

export default router;
