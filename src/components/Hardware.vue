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
import "ol/ol.css"
import {Map, View} from "ol"

import TileLayer from "ol/layer/Tile"

import * as proj from "ol/proj"
import OSM from "ol/source/OSM"

import * as interaction from "ol/interaction"
import * as control from "ol/control"

import Collection from "ol/Collection"
import VectorLayer from "ol/layer/Vector"
import VectorSource from "ol/source/Vector"
import Feature from "ol/Feature"
import LineSting from "ol/geom/LineString"
import Point from "ol/geom/Point"
import Polygon from "ol/geom/Polygon"

import * as style from "ol/style"

import axios from "axios"
import qs from "qs"

import EventEmitter from "events"

import Dialog from "./hardwareManagement/components/dialog/Dialog"

import Garage from "./hardwareManagement/layers/Garage"

import dlgGarage from "./hardwareManagement/components/dialog/dlgGarage"

let dialog = new Dialog;

async function loadMap() {
  // 加载地图层
  let mapLayer = new TileLayer({
    source: new OSM(),
    projection: proj.get("EPSG:4326")
  });

  // 加载机库
  let garage = new Garage();

  // 加载航线
  let flightFeature = new Collection();
  let flightLayer = new VectorLayer({
    source: new VectorSource({
      feature: flightFeature
    }),
    style() {

    }
  });

  let map = new Map({
    target: "map",
    layers: [
      mapLayer,
      garage.garageLayer,
      flightLayer
    ],
    view: new View({
      center: [13519023.565173406, 3636438.266781322],
      rotation: /*Math.PI / 10*/ 0,
      zoom: 17.992819590157538,
    }),
    interactions: new interaction.defaults({
      doubleClickZoom: false,   //屏蔽双击放大事件
      shiftDragZoom: false
    }),
    controls: new control.defaults({
      rotate: false
    })
  });

  garage.registerParent(map);

  garage.on("click", (g) => {
    dialog.register(dlgGarage);
    dialog.trigger(g);
  });

  dialog.on("refreshGarage", () => {
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
