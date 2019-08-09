import axios from '@/api/axios';
import COMMON_ENV from '@/config/env';
import {
  replaceCode,
} from '@/assets/utils/util';

const BASE_URL = '/fatsapi/tax';
// 公共接口
export function login(type, path) {
  // 登录注册
  const REDIRECT_URI = encodeURIComponent(replaceCode(path));
  // alert(replaceCode())
  // 去登录页 去登录的时候本地缓存 REDIRECT_URI 获取token传参无需编码，直接存href
  window.localStorage.setItem('REDIRECT_URI', replaceCode(path));

  let url = `/oauth/authorize?client_id=${COMMON_ENV.CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}`;
  // let flag = confirm(`登录REDIRECT_URI地址是${replaceCode()}`);
  // if (!flag) {
  //     return;
  // }
  if (type === 'reg') {
    // 注册
    url = `/oauth/authorize?page=register&client_id=${COMMON_ENV.CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}`;
  }
  window.location.href = COMMON_ENV.SSO_URL + url;
}
export function loginout() {
  // 退出登录
  const REDIRECT_URI = encodeURIComponent(replaceCode());
  window.localStorage.setItem('REDIRECT_URI', replaceCode());
  const url = `/course_authentication/h5/logout?redirect_uri=${REDIRECT_URI}`;
  window.location.href = COMMON_ENV.SSO_URL + url;
}

export function getToken(params) {
  // alert(window.localStorage.getItem('REDIRECT_URI'))
  const url = '/course_authentication/oauth/token';
  // // 获取token 从本地获取上一次REDIRECT_URI
  const formData = {
    client_id: COMMON_ENV.CLIENT_ID, // 为COMMON_ENV.CLIENT_ID:secret，分配一个即可
    grant_type: 'authorization_code', // 固定取值authorization_code
    redirect_uri: window.localStorage.getItem('REDIRECT_URI'), // 重定向地址,跟登录重定向地址保持一致
    code: params.code, // 登录成功后，重定向回来的页面url中获取
    client_secret: COMMON_ENV.CLIENT_ID,
  };

  return axios.post(url, formData);
}


export function getUserInfo(params) {
  // 获取用户信息
  const url = `${BASE_URL}/getUserInfo`;
  return axios.post(url, params || {});
}

export function getTokenByRongim() {
  const url = 'http://api-cn.ronghub.com/user/getToken';
  return axios.post(url, {
    userId: '111',
    name: '111',
    portraitUri: '111',
  } || {});
}
