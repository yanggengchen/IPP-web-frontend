// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import VueCookie from 'vue-cookie'
Vue.use(VueCookie);
import './assets/style.css'
import './assets/vendor/Hint.css'
import App from './App'
import router from './router'

import $ from 'jquery'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.min'

// 兼容IE, Safari10的Promise
import 'babel-polyfill'
import Promise from 'es6-promise'
require("es6-promise").polyfill();

import axios from "axios"

window.auth = {
  token: "",
};

setInterval(async () => {
  if(auth.token) {
    let result = await axios.get(
      process.env.AUTH_API_ROOT + "/auth?json=true&update=true&token=" + auth.token
    );
    if(result.data.token) {
      auth.token = result.data.token;
      auth.expires = result.data.expires;
    } else {
      auth.token = "";
    }
  }
}, 5000);


Vue.config.productionTip = false;

router.beforeEach((to, from, next) => {
  /* 路由发生变化修改页面title */
  if (to.meta.title) {
    document.title = to.meta.title
  }
  next()
});

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  components: { App },
  template: '<App/>'
});
