<template>
  <div id="app">
    <div id="map" class="map-container">

    </div>
      <component
        :is="dialog.component"
        :args="dialog.arguments"
        :event="dialog"
        v-if="dialog.show"
      ></component>
  </div>
</template>

<script>
import TileLayer from "ol/layer/Tile"

import * as proj from "ol/proj"
import OSM from "ol/source/OSM"

import Toolbar from "./olComponents/toolbar/toolbar"

import MapExt from "./hardwareManagement/MapExt"

import Garage from "./hardwareManagement/layers/Garage"
import Drone from "./hardwareManagement/layers/Drone"
import Flight from "./hardwareManagement/layers/Flight"

import Dialog from "./hardwareManagement/components/dialog/Dialog"
import dlgGarage from "./hardwareManagement/components/dialog/dlgGarage"
import dlgDrone from "./hardwareManagement/components/dialog/dlgDrone";
let dialog = new Dialog;
let map;

async function loadMap() {
  // 加载地图层
  let mapLayer = new TileLayer({
    source: new OSM(),
    projection: proj.get("EPSG:4326")
  });

  // 加载机库
  let garage = new Garage();
  let flight = new Flight();
  let drone = new Drone();

  // 加载地图
  map = new MapExt("map", [
      mapLayer,
      garage,
      flight,
      drone
    ])

  // 加载工具栏
  let toolbar = new Toolbar({
    elements: [
      {
        type: "button",
        icon: "wrench",
        event: "hardware",
        radioGroup: "function",
        exact: false,
        hint: "硬件信息"
      },
      {
        type: "button",
        icon: "tag",
        event: "order",
        radioGroup: "function",
        hint: "订单信息",
        association: "order"
      },
      {
        type: "button",
        icon: "send",
        event: "drone",
        radioGroup: "function",
        hint: "无人机信息",
        association: "drone"
      },
      {type: "ws"},
      {
        type: "group",
        name: "drone",
        elements: [
          {
            type: "button",
            icon: "search",
            event: "search-drone",
            hint: "查询无人机"
          }
        ]
      },
      {
        type: "group",
        name: "order",
        elements: [
          {
            type: "button",
            icon: "search",
            event: "search-order",
            hint: "查询订单"
          }
        ]
      }
    ]
  });
  map.addControl(toolbar);
  toolbar.event.on("hardware", () => {
    garage.enableEvent();
    drone.disableEvent();
  });
  toolbar.event.on("order", () => {
    garage.disableEvent();
    drone.disableEvent();
  });
  toolbar.event.on("drone", () => {
    garage.disableEvent();
    drone.enableEvent();
  });
  toolbar.event.on("search-drone", () => {

  })

  // 注册图层
  garage.registerParent(map);
  drone.registerParent(map);

  // 图层事件
  garage.on("click", (g) => {
    dialog.register(dlgGarage);
    dialog.trigger(g);
  });
  drone.on("load-flight", (id) => {
    flight.load(id).then(() => {
      flight.show();
    })
  })

  // 对话框事件
  dialog.on("refresh-garage", () => {
    garage.reload().then(() => {
      dialog.trigger(garage.getInterest());
    });
  })
  dialog.on("close", () => {
    garage.clearInterest();
  })

}

export default {
  name: "Hardware",
  data() {
    return {
      dialog
    }
  },
  mounted() {
    loadMap()
  },
  destroyed() {
    map.unmount();
    dialog.removeAllListeners();
  }
}
</script>

<style scoped>
#app {
  position: absolute;
  left: 0;
  width: 100%;
  height: calc(100% - 4.5rem);
}

</style>
