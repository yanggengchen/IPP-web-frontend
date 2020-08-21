import Vue from 'vue'
import Router from 'vue-router'
import Map from '@/components/Map'
import Order from '@/components/Order'

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: "/",
      name: "Hardware",
      component: null,
      meta: {title: "无人机物流-硬件管理", disp: "硬件管理"}
    },
    {
      path: "/map",
      name: "Map",
      component: Map,
      meta: {title: "无人机物流-地图规划", disp: "地图规划"}
    },
    {
      path: '/order',
      name: 'Order',
      component: Order,
      meta: {title: "无人机物流-订单管理", disp: "订单管理"}
    }
  ]
})
