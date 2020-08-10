// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import './assets/style.css'
import './assets/vendor/Hint.css'
import App from './App'
import router from './router'
// 兼容IE, Safari10的Promise
import 'babel-polyfill'
import Promise from 'es6-promise'
require("es6-promise").polyfill();


Vue.config.productionTip = false

router.beforeEach((to, from, next) => {
  /* 路由发生变化修改页面title */
  if (to.meta.title) {
    document.title = to.meta.title
  }
  next()
})

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  components: { App },
  template: '<App/>'
})
