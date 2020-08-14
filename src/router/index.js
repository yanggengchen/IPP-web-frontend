import Vue from 'vue'
import Router from 'vue-router'
import HelloWorld from '@/components/HelloWorld'
import OLTest from '@/components/OLTest'
import Map from '@/components/Map'

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Hello',
      component: HelloWorld,
      meta: {title: "无人机物流-订单管理", disp: "订单管理"}
    },
    {
      path: "/flight",
      name: "Flight",
      component: null,
      meta: {title: "无人机物流-航路情况", disp: "航路情况"}
    },
    {
      path: "/map",
      name: "Map",
      component: Map,
      meta: {title: "无人机物流-地图规划", disp: "地图规划"}
    },
    {
      path: "/weather",
      name: "Weather",
      component: null,
      meta: {title: "无人机物流-天气分析", disp: "天气分析"}
    }
  ]
})
