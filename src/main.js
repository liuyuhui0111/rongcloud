/* eslint-disable import/order */
import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import mixin from './mixin';
import COMMON_ENV from '@/config/env';

import './plugins/element';

import '@/assets/css/common.css';
import '@/assets/css/reset-element.css';
import '@/assets/iconfont/iconfont.css';


Vue.config.productionTip = false;
Vue.use(mixin);
window.vue = new Vue({
  router,
  store,
  render: h => h(App),
}).$mount('#app');
window.COMMON_ENV = COMMON_ENV;
