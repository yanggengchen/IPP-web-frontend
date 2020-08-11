<template>
  <div id="map-component" tabindex="1"
       v-on:keydown.esc="keydown('esc')"
       v-on:keydown.ctrl.z="keydown('ctrlz')"
       v-on:keydown.shift="keydown('shift')"
       v-on:keyup="keyup('shift')">
    <div id="map" class="map-container">

    </div>
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
  import {ToolBar} from "./olToolbar/toolbar"

  import Collection from "ol/Collection"
  import VectorLayer from "ol/layer/Vector"
  import VectorSource from "ol/source/Vector"
  import Feature from "ol/Feature"
  import LineSting from "ol/geom/LineString"
  import Point from "ol/geom/Point"
  import Polygon from "ol/geom/Polygon"

  import * as style from "ol/style"

  import EventEmitter from "events"

  let kdEvents = new EventEmitter();
  let kuEvents = new EventEmitter();

  function getDistance(p1, p2) {
    let r = 6378137;
    let x1 = p1[0] * Math.PI / 180;
    let x2 = p2[0] * Math.PI / 180;
    let y1 = p1[1] * Math.PI / 180;
    let y2 = p2[1] * Math.PI / 180;
    let dx = Math.abs(x1 - x2);
    let dy = Math.abs(y1 - y2);
    let p = Math.pow(Math.sin(dx / 2), 2) + Math.cos(x1) * Math.cos(x2) * Math.pow(Math.sin(dy / 2), 2);
    return r * 2 * Math.asin(Math.sqrt(p));
  }



  function loadMap() {
    let routerParams = this.$route.params;

    // 加载原始地图层
    let mapLayer = new TileLayer({
      source: new OSM({
        attributions: "无人机物流——地图信息"
      }),
      projection: proj.get("ESPG:4326")
    });

    // 初始化规划层
    let planPOI = new Collection();

    let planLayer = new VectorLayer({
      source: new VectorSource({
        features: planPOI
      }),
      style(feature) {
        let color;
        if(feature.hasOwnProperty("type") && feature.type === "start") {
          color = "green";
        } else if(feature.hasOwnProperty("type") && feature.type === "end") {
          color = "red";
        } else {
          color = "blue";
        }
        if(feature.hasOwnProperty("interest") && feature.interest) {
          return new style.Style({
            image: new style.Circle({
              radius: 8,
              fill: new style.Fill({
                color: "blue",
                width: 1
              })
            })
          });
        } else if((feature.hasOwnProperty("type") && (feature.type === "start" || feature.type === "end" || feature.type === "terminal"))) {
          return new style.Style({
            image: new style.Circle({
              radius: 5,
              fill: new style.Fill({
                color: color,
                width: 1
              })
            })
          });
        } else {
          return new style.Style({
            image: new style.Circle({
              radius: 5,
              stroke: new style.Stroke({
                color: "blue",
                width: 1
              })
            }),
            stroke: new style.Stroke({
              color: "blue",
              width: 1
            }),
            fill: new style.Fill({
              color: 'rgba(255,255,255,0.4)'
            })
          })
        }
      }
    });

    // 初始化路径层
    let routinePOI = new Collection();

    let routineLayer = new VectorLayer({
      source: new VectorSource({
        features: routinePOI
      })
    });

    // 初始化航线层
    let flightPOI = new Collection();

    let flightLayer = new VectorLayer({
      source: new VectorSource({
        features: flightPOI
      })
    });

    // 初始化天气层
    let weatherPoly = new Collection();

    let weatherLayer = new VectorLayer({
      source: new VectorSource({
        features: weatherPoly
      })
    });

    let map = new Map({
      target: "map",
      layers: [
        mapLayer,
        planLayer,
        routineLayer,
        flightLayer,
        weatherLayer
      ],
      view: new View({
        center: [13519023.565173406, 3636438.266781322],
        rotation: Math.PI / 10,
        zoom: 17.992819590157538,
      }),
      interactions: new interaction.defaults({
        doubleClickZoom:false,   //屏蔽双击放大事件
      }),
      controls: new control.defaults({
        rotate: false
      })
    });

    // 事件
    if(!routerParams.hasOwnProperty("flightID")) {
      // 进入规划模式
      mapLayer.getSource().setAttributions("无人机物流——规划模式");

      let POIList = [],
        planStart = false,
        magnet = false,
        tbMagnet = false,
        mousepos = [],
        magMousepos = [];

      let toolbarEvent = new EventEmitter();

      map.addControl(new ToolBar(toolbarEvent));

      // 工具栏事件
      toolbarEvent.on("clear", () => {
        planPOI.clear();
        POIList = [];
        planStart = false;
      });

      toolbarEvent.on("undo", () => {
        kdEvents.emit("ctrlz");
      });

      toolbarEvent.on("switchMagnet", () => {
        tbMagnet = !tbMagnet;
      });

      toolbarEvent.on("area", () => {
        if((POIList[0][0] === POIList[POIList.length - 1][0]) && (POIList[0][1] === POIList[POIList.length - 1][1])) {
          let temp = POIList;
          temp.pop();
          let shape = new Polygon([temp]);
          planPOI.clear();
          planPOI.push(new Feature(shape));
        } else {
          let shape = new Polygon([POIList]);
          planPOI.clear();
          planPOI.push(new Feature(shape));
        }
        planStart = false;
      });

      // 鼠标事件
      map.on("dblclick", (e) => {
        let realCoordinate = e.coordinate;
        if(tbMagnet || magnet) realCoordinate = magMousepos;
        let point = new Feature(new Point(realCoordinate));
        if(!planStart) {
          POIList = [realCoordinate];
          point.type = "start";

          planPOI.clear();
        } else {
          POIList.pop();
          planPOI.pop();
          planPOI.pop();
          planPOI.pop(); // 单击时会多添加两个点
          // TODO: 发送消息

          if(realCoordinate[0] === POIList[0][0] && realCoordinate[1] === POIList[0][1])
            point.type = "terminal";
          else
            point.type = "end";
        }

        planPOI.push(point);
        planStart = !planStart;
      });
      map.on("click", (e) => {
        if(!planStart) return;
        let realCoordinate = e.coordinate;
        if(tbMagnet || magnet) realCoordinate = magMousepos;
        let point = new Feature(new Point(realCoordinate));
        let line = new Feature(new LineSting([POIList[POIList.length - 1], realCoordinate]));
        point.type = "POI";
        POIList.push(realCoordinate);
        planPOI.push(line);
        planPOI.push(point);
      });

      map.on("pointermove", (e) => {
        // 这段好像有BUG
        mousepos = e.coordinate;
        magMousepos = mousepos;
        if(planStart && (tbMagnet || magnet)) {
          let minindex = -1;
          let mindist = -1;
          for(let i = 0; i < planPOI.getLength(); i++) {
            let elt = planPOI.item(i);
            if(elt.getGeometry().getType() === "Point") {
              let coord = elt.getGeometry().getCoordinates();
              if((getDistance(coord, e.coordinate) < 1000000)) {
                if(minindex === -1) {
                  let POI = planPOI.item(i);
                  POI.interest = true;
                  planPOI.setAt(i, POI);
                  minindex = i;
                  mindist = getDistance(coord, e.coordinate);
                  magMousepos = coord;
                } else if(mindist > getDistance(coord, e.coordinate)) {
                  let POI = planPOI.item(minindex);
                  POI.interest = false;
                  planPOI.setAt(minindex, POI);
                  POI = planPOI.item(i);
                  POI.interest = true;
                  planPOI.setAt(i, POI);
                  minindex = i;
                  mindist = getDistance(coord, e.coordinate);
                  magMousepos = coord;
                } else if(elt.interest) {
                  let POI = planPOI.item(i);
                  POI.interest = false;
                  planPOI.setAt(i, POI);
                }
              } else if(elt.interest) {
                let POI = planPOI.item(i);
                POI.interest = false;
                planPOI.setAt(i, POI);
              }
            }
          }
        }
      });

      // 键盘快捷键
      kdEvents.on("esc", () => {
        planPOI.clear();
        POIList = [];
        planStart = false;
      });

      kdEvents.on("ctrlz", () => {
        if(!planStart && POIList.length === 0) return;
        if(POIList.length === 1) {
          planPOI.clear();
          POIList = [];
          planStart = false;
        } else {
          planPOI.pop();
          planPOI.pop();
          POIList.pop();
          planStart = true;
        }
      });

      kdEvents.on("shift", () => {
        magnet = true;
        if (planStart) {
          let minindex = -1;
          let mindist = -1;
          for (let i = 0; i < planPOI.getLength(); i++) {
            let elt = planPOI.item(i);
            if (elt.getGeometry().getType() === "Point") {
              let coord = elt.getGeometry().getCoordinates();
              if ((getDistance(coord, mousepos) < 1000000)) {
                if (minindex === -1) {
                  let POI = planPOI.item(i);
                  POI.interest = true;
                  planPOI.setAt(i, POI);
                  minindex = i;
                  mindist = getDistance(coord, mousepos);
                  magMousepos = coord;
                } else if (mindist > getDistance(coord, mousepos)) {
                  let POI = planPOI.item(minindex);
                  POI.interest = false;
                  planPOI.setAt(minindex, POI);
                  POI = planPOI.item(i);
                  POI.interest = true;
                  planPOI.setAt(i, POI);
                  minindex = i;
                  mindist = getDistance(coord, mousepos);
                  magMousepos = coord;
                } else if (elt.interest) {
                  let POI = planPOI.item(i);
                  POI.interest = false;
                  planPOI.setAt(i, POI);
                }
              } else if (elt.interest) {
                let POI = planPOI.item(i);
                POI.interest = false;
                planPOI.setAt(i, POI);
              }
            }
          }
        }
      });
      kuEvents.on("shift", () => {
        magnet = false;
        for(let i = 0; i < planPOI.getLength(); i++) {
          let elt = planPOI.item(i);
          if(elt.getGeometry().getType() === "Point") {
            if (elt.interest) {
              let POI = planPOI.item(i);
              POI.interest = false;
              planPOI.setAt(i, POI);
            }
          }
        }
      });
    } else {
      // 进入实时模式
      mapLayer.getSource().setAttributions("无人机物流——实时模式");
    }
  }

  export default {
    name: "Map",
    method: {
    },
    data() {
      return {
        map: null,
        keydown(key) {
          kdEvents.emit(key);
        },
        keyup(key) {
          kuEvents.emit(key);
        }
      };
    },
    mounted() {
      // 加载地图
      loadMap.call(this);
    }
  }
</script>

<style scoped>
  #map-component {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

</style>
