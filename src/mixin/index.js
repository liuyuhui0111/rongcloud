import {
  mapGetters,
  mapMutations,
} from 'vuex';
import { login, loginout } from '@/api/apis';

export default {
  install(Vue) {
    Vue.mixin({
      data() {
        return {
          // token: '',
          publicPath: process.env.BASE_URL,
          isCanRequest: true, // 防止连续请求
        };
      },
      computed: {
        ...mapGetters([
          'token', // 登录token
        ]),
      },
      methods: {

        login() {
          login();
        },

        loginout() {
          this.setToken('');
          loginout();
        },


        routerGoBlank(path, q) {
          // 在新标签页打开
          let query = q || {};
          let routeUrl = this.$router.resolve(
            { path, query },
          );
          window.open(routeUrl.href, '_blank');
        },
        routerReplace(path, q) {
          // 路由跳转替换当前路由
          let query = q || {};
          this.$router.replace({ path, query });
        },
        routerGo(path, q) {
          // 路由跳转
          let query = q || {};
          this.$router.push({ path, query });
        },

        ...mapMutations([
          'setToken',
        ]),
      },

    });
  },
};
