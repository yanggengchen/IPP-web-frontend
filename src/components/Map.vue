<template>
  <div id="map-component" tabindex="1"
       v-on:keydown.esc="keydown('esc')"
       v-on:keydown.ctrl.z="keydown('ctrlz')"
       v-on:keydown.shift="keydown('shift')"
       v-on:keydown.alt="keydown('alt')"
       v-on:keyup="keyup('shift')">
    <div id="map" class="map-container">
    </div>
    <div v-show="mapHint.show" id="map--hint">{{mapHint.msg}}</div>
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

  import axios from "axios"
  import qs from "qs"

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

  let mapHint = {
    show: false,
    msg: ""
  };

  function loadMap() {
    let routerParams = this.$route.params;

    // 加载原始地图层
    let mapLayer = new TileLayer({
      source: new OSM({
        attributions: "无人机物流——地图信息"
      }),
      projection: proj.get("EPSG:4326")
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

    // 初始化区域层
    let zonePoly = new Collection();

    let zoneLayer = new VectorLayer({
      source: new VectorSource({
        features: zonePoly
      }),
      style(feature) {
        if(feature.type === "restriction") {
          if(feature.minHeight === -1) {
            return new style.Style({
              image: new style.Circle({
                radius: 5,
                stroke: new style.Stroke({
                  color: "blue",
                  width: 1
                })
              }),
              stroke: new style.Stroke({
                color: "red",
                width: 1
              }),
              fill: new style.Fill({
                color: feature.highlight? 'rgba(255,255,255,0.4)' : 'rgba(255,0,0,0.4)'
              }),
              text: new style.Text({
                text: "禁飞",
                fill: new style.Fill({
                  color: "white"
                }),
              })
            })
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
                color: "yellow",
                width: 1
              }),
              fill: new style.Fill({
                color: 'rgba(255,' + (feature.minHeight / 500 * 255).toString() + ',' + (feature.minHeight / 500 * 255).toString() + ',0.4)'
              }),
              text: new style.Text({
                text: "航高>" + feature.minHeight.toString(),
                fill: new style.Fill({
                  color: "white"
                }),
              })
            })

          }
        }
      }
    });

    (async () => {
      let doc = (await axios.get("http://127.0.0.1:8000/map/zone")).data;
      doc.forEach((item) => {
        let poly = new Feature(new Polygon([item.vertex]));
        poly.type = (item.type === 0)? "restriction" : "garage";
        if(item.type === 0) poly.minHeight = item.minHeight;
        poly.id = item._id;
        zonePoly.push(poly);
      })
    })();

    let map = new Map({
      target: "map",
      layers: [
        mapLayer,
        zoneLayer,
        routineLayer,
        flightLayer,
        planLayer
      ],
      view: new View({
        center: [13519023.565173406, 3636438.266781322],
        rotation: Math.PI / 10,
        zoom: 17.992819590157538,
      }),
      interactions: new interaction.defaults({
        doubleClickZoom:false,   //屏蔽双击放大事件
        shiftDragZoom: false
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
        alt = false,
        tbMagnet = false,
        poly = false,
        mousepos = [],
        magMousepos = [],
        interestIndex = -1;

      let toolbarEvent = new EventEmitter();

      map.addControl(new ToolBar(toolbarEvent));

      // 工具栏事件
      toolbarEvent.on("clear", () => {
        kdEvents.emit("esc");
      });

      toolbarEvent.on("undo", () => {
        kdEvents.emit("ctrlz");
      });

      toolbarEvent.on("switchMagnet", () => {
        tbMagnet = !tbMagnet;
      });

      toolbarEvent.on("zone", () => {
        if(POIList.length < 3) {
          alert("需要大于等于3个点来创建一个区域");
          return;
        }

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
        poly = true;
      });

      toolbarEvent.on("map", async () => {
        if(!poly) {
          alert("必须先创建多边形区域");
          return;
        }

        await axios.post(
          "http://127.0.0.1:8000/map/zone",
          qs.stringify({
            type: "ban",
            vertex: POIList,
          })
        );

        let newItem = planPOI.item(0);
        newItem.type = "restriction";
        newItem.minHeight = -1;

        zonePoly.push(
          newItem
        );

        planPOI.clear();
        POIList = [];
      });

      // 鼠标事件
      map.on("dblclick", (e) => {
        let realCoordinate = e.coordinate;
        if(tbMagnet || magnet) realCoordinate = magMousepos;
        let point = new Feature(new Point(realCoordinate));
        if(!planStart) {
          for(let i = 0; i < zonePoly.getLength(); i++) {
            let item = zonePoly.item(i);
            if (item.highlight) {
              item.highlight = false;
              zonePoly.setAt(i, item);
            }
          }
          mapHint.show = false;

          POIList = [realCoordinate];
          point.type = "start";

          planPOI.clear();
        } else if(POIList.length === 2) {
          POIList.pop();
          planPOI.pop();
          return;
        } else if(POIList.length > 2) {
          POIList.pop();
          planPOI.pop();
          planPOI.pop();
          planPOI.pop(); // 单击时会多添加两个点

          if(realCoordinate[0] === POIList[0][0] && realCoordinate[1] === POIList[0][1])
            point.type = "terminal";
          else
            point.type = "end";
        } else return;

        planPOI.push(point);

        planStart = !planStart;
        poly = false;
      });

      map.on("click", (e) => {
        if(!planStart) return;
        let realCoordinate = e.coordinate;
        if (tbMagnet || magnet) realCoordinate = magMousepos;
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

        // 进行磁铁选择
        if(planStart && (tbMagnet || magnet || alt)) {
          let minindex = -1;
          let mindist = -1;
          for(let i = 0; i < planPOI.getLength(); i++) {
            let elt = planPOI.item(i);
            if(elt.getGeometry().getType() === "Point") {
              let coord = elt.getGeometry().getCoordinates();

              if(alt && (interestIndex !== -1) && (interestIndex !== i)) {
                let prevcoord = planPOI.item(interestIndex).getGeometry().getCoordinates();
                if(prevcoord[0] === coord[0] && prevcoord[1] === coord[1]) {
                  // 有BUG
                  // 把别的点拖到它上面有的时候会交换点
                  break;
                }
              }

              if((getDistance(coord, e.coordinate) < 1000000)) {
                if(minindex === -1) {
                  let POI = planPOI.item(i);
                  POI.interest = true;
                  planPOI.setAt(i, POI);
                  minindex = i;
                  interestIndex = i;
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
                  interestIndex = i;
                  mindist = getDistance(coord, e.coordinate);
                  magMousepos = coord;
                } else if(elt.interest) {
                  let POI = planPOI.item(i);
                  POI.interest = false;
                  planPOI.setAt(i, POI);
                  if(interestIndex === i) interestIndex = -1;
                }
              } else if(elt.interest) {
                let POI = planPOI.item(i);
                POI.interest = false;
                planPOI.setAt(i, POI);
                if(interestIndex === i) interestIndex = -1;
              }
            }
          }
        } else if(!planStart) { // 未开始新一轮规划，可查看区域信息
          for(let i = 0; i < zonePoly.getLength(); i++) {
            let item = zonePoly.item(i);
            if (item.getGeometry().intersectsCoordinate(mousepos)) {
              item.highlight = true;
              zonePoly.setAt(i, item);
              mapHint.show = true;
              mapHint.msg = "id: " + item.id;
            } else if(item.highlight) {
              item.highlight = false;
              zonePoly.setAt(i, item);
              if(mapHint.msg === "id: " + item.id) mapHint.show = false;
            }
          }
        }
      });

      map.on("pointerdrag", (e) => {
        if(!alt) return true;
        if(interestIndex !== -1) {
          let item = planPOI.item(interestIndex);
          item.getGeometry().setCoordinates(e.coordinate);
          planPOI.setAt(interestIndex, item);
          let POIIndex = Math.ceil(interestIndex / 2);
          POIList[POIIndex] = e.coordinate;

          if(interestIndex !== 0) {
            let line = planPOI.item(interestIndex - 1);
            let co = line.getGeometry().getCoordinates();
            co[1] = e.coordinate;
            planPOI.setAt(interestIndex - 1, new Feature(new LineSting(co)));
          }

          if(interestIndex !== planPOI.getLength() - 1) {
            let line = planPOI.item(interestIndex + 1);
            let co = line.getGeometry().getCoordinates();
            co[0] = e.coordinate;
            planPOI.setAt(interestIndex + 1, new Feature(new LineSting(co)));
          }
        }
        return false;
      });

      // 键盘快捷键
      kdEvents.on("esc", () => {
        planPOI.clear();
        POIList = [];
        planStart = false;
        poly = false;
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

      kdEvents.on("alt", () => {
        alt = true;
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
                  interestIndex = i;
                  mindist = getDistance(coord, mousepos);
                  magMousepos = coord;
                } else if (mindist > getDistance(coord, mousepos)) {
                  let POI = planPOI.item(minindex);
                  POI.interest = false;
                  planPOI.setAt(minindex, POI);
                  POI = planPOI.item(i);
                  POI.interest = true;
                  interestIndex = i;
                  planPOI.setAt(i, POI);
                  minindex = i;
                  mindist = getDistance(coord, mousepos);
                  magMousepos = coord;
                } else if (elt.interest) {
                  let POI = planPOI.item(i);
                  POI.interest = false;
                  planPOI.setAt(i, POI);
                  if(interestIndex === i) interestIndex = -1;
                }
              } else if (elt.interest) {
                let POI = planPOI.item(i);
                POI.interest = false;
                planPOI.setAt(i, POI);
                if(interestIndex === i) interestIndex = -1;
              }
            }
          }
        }
      });

      kuEvents.on("shift", () => {
        magnet = false;
        alt = false;
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
        },
        mapHint: mapHint
      };
    },
    mounted() {
      // 加载地图
      loadMap.call(this);

      // 全局鼠标事件
      $(document).on("mousemove", (e) => {
        $("#map--hint").css({
          top: e.clientY + 10,
          left: e.clientX + 10
        })
      })
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

  #map--hint {
    position: absolute;
    z-index: 999;
    -moz-user-select:none; /*火狐*/
    -webkit-user-select:none; /*webkit浏览器*/
    -ms-user-select:none; /*IE10*/
    -khtml-user-select:none; /*早期浏览器*/
    user-select:none;

    font-size: xx-small;

    padding-left: 5px;
    padding-right: 5px;

    border-radius: 5px;

    background-color: #383838;
    color: white;
  }

</style>