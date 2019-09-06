import Vue from 'vue';
import Router from 'vue-router';
import NProgress from 'nprogress';
// import routes from './routeConf';
import 'nprogress/nprogress.css';

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
        title: '优税专家',
      },
      component: () => import('@/views/layout/index.vue'),
      // children: routes,
    }, {
      path: '/init',
      name: 'init',
      meta: {
        isNotNeedLogin: true,
        title: '优税专家',
      },
      component: () => import('@/views/layout/user.vue'),
      // children: routes,
    },
  ],
});

router.beforeEach(async (to, from, next) => {
  NProgress.start();
  next();
});

router.afterEach(async (to) => {
  document.title = to.meta.title || '优税专家';
  NProgress.done();

  // ...
});


export default router;
