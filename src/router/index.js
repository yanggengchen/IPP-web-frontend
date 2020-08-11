import Vue from 'vue'
import Router from 'vue-router'
import HelloWorld from '@/components/HelloWorld'
import OLTest from '@/components/OLTest'

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Hello',
      component: HelloWorld,
      meta: {title: "无人机"}
    },
    {
      path: '/oltest',
      name: 'OLTest',
      component: OLTest,
      meta: {title: "无人机"}
    }
  ]
})
