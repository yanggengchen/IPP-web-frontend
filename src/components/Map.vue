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
    <div v-show="zdiInfo.show" class="zdi--container">
      <ZoneDataInput
        v-bind:type="zdiInfo.type"
        v-bind:defaultValues="zdiInfo.defaultValues"
        v-bind:onsubmit="(arg) => { zdiInfo.show = false; zdiInfo.onSubmit(arg); }"
        v-bind:ondelete="(arg) => { zdiInfo.show = false; zdiInfo.onDelete(arg); }"
        v-bind:onclose="() => { zdiInfo.show = false; zdiInfo.onClose(); }"
      ></ZoneDataInput>
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

  import axios from "axios"
  import qs from "qs"

  import EventEmitter from "events"
  import ZoneDataInput from "./zoneDataInput";

  let kdEvents = new EventEmitter();
  let kuEvents = new EventEmitter();

  function getDistance(p1, p2) {
    let R = 6378137;
    p1 = {
      x: p1[0] * Math.PI / 20037508.3427892,
      y: p1[1] * Math.PI / 20037508.3427892
    };
    p2 = {
      x: p2[0] * Math.PI / 20037508.3427892,
      y: p2[1] * Math.PI / 20037508.3427892
    };

    let p1ll = {
        lambda: p1.x,
        phi: Math.atan(Math.sinh(p1.y))
      },
      p2ll = {
        lambda: p2.x,
        phi: Math.atan(Math.sinh(p2.y))
      };

    let C = Math.cos(p1ll.phi) * Math.cos(p2ll.phi) * Math.cos(p1ll.lambda - p2ll.lambda) + Math.sin(p1ll.phi) * Math.sin(p2ll.phi);
    return R * Math.acos(C);
  }

  let mapHint = {
    show: false,
    msg: ""
  };

  let zdiInfo = {
    show: false,
    type: "setting",
    defaultValues: {
      id: "",
      type: "ban",
      minHeight: -1
    },
    onSubmit(args) {

    },
    onDelete(args) {

    },
    onClose() {

    }
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
        if (feature.hasOwnProperty("type") && feature.type === "start") {
          color = "green";
        } else if (feature.hasOwnProperty("type") && feature.type === "end") {
          color = "red";
        } else {
          color = "blue";
        }
        if (feature.hasOwnProperty("interest") && feature.interest) {
          return new style.Style({
            image: new style.Circle({
              radius: 8,
              fill: new style.Fill({
                color: "blue",
                width: 1
              })
            })
          });
        } else if ((feature.hasOwnProperty("type") && (feature.type === "start" || feature.type === "end" || feature.type === "terminal"))) {
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
      }),
      style(feature) {
        return new style.Style({
          image: new style.Circle({
            radius: 5,
            fill: new style.Fill({
              color: 'rgb(' + (0xff * feature.height / 200).toString() + ',0,' + (0xff - 0xff * feature.height / 200).toString() + ')',
              width: 1
            })
          }),
          stroke: new style.Stroke({
            color: 'rgb(' + (0xff * feature.height / 200).toString() + ',0,' + (0xff - 0xff * feature.height / 200).toString() + ')',
            width: 1
          }),
        })
      }
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
        if (feature.type === "restriction") {
          if (feature.minHeight === -1) {
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
                color: feature.highlight ? 'rgba(255,255,255,0.4)' : 'rgba(255,0,0,0.4)'
              }),
              text: new style.Text({
                text: "禁飞",
                fill: new style.Fill({
                  color: feature.highlight ? "black" : "white"
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
                color: feature.highlight ? 'rgba(255,255,255,0.4)' : 'rgba(255,' + (255 - feature.minHeight / 500 * 255).toString() + ',' + (255 - feature.minHeight / 500 * 255).toString() + ',0.4)'
              }),
              text: new style.Text({
                text: "航高>" + feature.minHeight.toString(),
                fill: new style.Fill({
                  color: feature.highlight ? "black" : "white"
                }),
              })
            })
          }
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
              color: "green",
              width: 1
            }),
            fill: new style.Fill({
              color: feature.highlight ? 'rgba(255,255,255,0.4)' : 'rgba(0, 0, 255,0.4)'
            }),
            text: new style.Text({
              text: "机库停机坪",
              fill: new style.Fill({
                color: feature.highlight ? "black" : "white"
              }),
            })
          });
        }
      }
    });

    let refreshZone = async () => {
      zonePoly.clear();
      let doc = (await axios.get(process.env.API_ROOT + "/map/zone")).data;
      doc.forEach((item) => {
        let poly = new Feature(new Polygon([item.vertex]));
        poly.type = (item.type === 0) ? "restriction" : "garage";
        if (item.type === 0) poly.minHeight = item.minHeight;
        poly.id = item._id;
        zonePoly.push(poly);
      })
    };

    refreshZone();

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

    // 事件
    if (!routerParams.hasOwnProperty("flightID")) {
      // 进入规划模式
      mapLayer.getSource().setAttributions("无人机物流——规划模式");

      let POIList = [],
        planStart = false,
        magnet = false,
        alt = false,
        tbMagnet = false,
        freeze = false,
        poly = false,
        mousepos = [],
        magMousepos = [],
        interestIndex = -1,
        zoneindex = -1;

      function createZDI(type, defaultValues, onSubmit, onDelete, onClose) {
        zdiInfo.type = type;
        zdiInfo.defaultValues = defaultValues;
        zdiInfo.onSubmit = onSubmit;
        zdiInfo.onDelete = onDelete;
        zdiInfo.onClose = () => {
          freeze = false;
          onClose.call(zdiInfo);
        };
        freeze = true;
        zdiInfo.show = true;
      }

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

      let optInterval = 0;

      toolbarEvent.on("optimize", async () => {
        clearInterval(optInterval);
        let result = await axios.post(
          process.env.API_ROOT + "/map/routine?multi=true",
          qs.stringify({
            POI: POIList
          })
        );

        optInterval = setInterval(async () => {
          let routine;
          try {
            routine = await axios.get(
              process.env.API_ROOT + "/map/routine/" + result.data.id
            );
          } catch (e) {
            clearInterval(optInterval);
            return;
          }

          if (routine.data.status === "OK") {
            routinePOI.clear();

            let LINE = new Feature(new LineSting([POIList[0], routine.data.routine[0]]));
            LINE.height = routine.data.height[0] / 2;
            routinePOI.push(LINE);

            routine.data.routine.forEach((r, index) => {
              let POI = new Feature(new Point(r));
              POI.height = routine.data.height[index];
              routinePOI.push(POI);

              if (index !== (routine.data.routine.length - 1)) {
                let LINE = new Feature(new LineSting([r, routine.data.routine[index + 1]]));
                LINE.height = (routine.data.height[index] + routine.data.height[index + 1]) / 2;
                routinePOI.push(LINE);
              }
            });

            LINE = new Feature(new LineSting([routine.data.routine[routine.data.routine.length - 1], POIList[POIList.length - 1]]));
            LINE.height = routine.data.height[routine.data.routine.length - 1] / 2;
            routinePOI.push(LINE);
            clearInterval(optInterval);
          }
        }, 500);
      });

      toolbarEvent.on("zone", async () => {
        if (POIList.length < 3) {
          alert("需要大于等于3个点来创建一个区域");
          return;
        }

        if ((POIList[0][0] === POIList[POIList.length - 1][0]) && (POIList[0][1] === POIList[POIList.length - 1][1])) {
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

        createZDI("create", {type: "ban"},
          async ({type: type, "min-height": minHeight}) => {
            await axios.post(
              process.env.API_ROOT + "/map/zone",
              qs.stringify({
                type: type,
                vertex: POIList,
                "min-height": minHeight
              })
            );

            refreshZone();
          },
          () => {
          },
          () => {
          }
        );
      });

      // 鼠标事件
      map.on("dblclick", (e) => {
        let realCoordinate = e.coordinate;
        if (tbMagnet || magnet) realCoordinate = magMousepos;
        let point = new Feature(new Point(realCoordinate));
        if (!planStart) {
          for (let i = 0; i < zonePoly.getLength(); i++) {
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
          routinePOI.clear();
        } else if (POIList.length > 2) {
          POIList.pop();
          planPOI.pop();
          planPOI.pop();
          planPOI.pop(); // 单击时会多添加两个点

          if (realCoordinate[0] === POIList[0][0] && realCoordinate[1] === POIList[0][1])
            point.type = "terminal";
          else
            point.type = "end";
        } else return;

        planPOI.push(point);

        planStart = !planStart;
        poly = false;
      });

      map.on("click", (e) => {
        if (!planStart) return;
        let realCoordinate = e.coordinate;
        if (tbMagnet || magnet) realCoordinate = magMousepos;
        let point = new Feature(new Point(realCoordinate));
        let line = new Feature(new LineSting([POIList[POIList.length - 1], realCoordinate]));
        point.type = "POI";
        POIList.push(realCoordinate);
        planPOI.push(line);
        planPOI.push(point);
      });

      map.on("singleclick", (e) => {
        if (mapHint.show) { // 点击在某个区域内
          let zone = zonePoly.item(zoneindex);
          createZDI("setting", {
              id: zone.id,
              type: (zone.type === "restriction" && zone.minHeight === -1) ? "ban" : zone.type,
              minHeight: zone.minHeight
            },
            async ({id: id, type: type, "min-height": minHeight}) => {
              await axios.patch(
                process.env.API_ROOT + "/map/zone/" + id,
                qs.stringify({
                  type: type,
                  "min-height": minHeight
                })
              );

              refreshZone();
            },
            async ({id: id}) => {
              await axios.delete(
                process.env.API_ROOT + "/map/zone/" + id
              );

              refreshZone();
            },
            () => {
            }
          );
        }
      });

      map.on("pointermove", (e) => {
        // 这段好像有很多BUG
        mousepos = e.coordinate;
        magMousepos = mousepos;

        // 进行磁铁选择
        if (planStart && (tbMagnet || magnet || alt)) {
          let minindex = -1;
          let mindist = -1;
          for (let i = 0; i < planPOI.getLength(); i++) {
            let elt = planPOI.item(i);
            if (elt.getGeometry().getType() === "Point") {
              let coord = elt.getGeometry().getCoordinates();

              if (alt && (interestIndex !== -1) && (interestIndex !== i)) {
                let prevcoord = planPOI.item(interestIndex).getGeometry().getCoordinates();
                if (prevcoord[0] === coord[0] && prevcoord[1] === coord[1]) {
                  // 有BUG
                  // 把别的点拖到它上面有的时候会交换点
                  break;
                }
              }

              if ((getDistance(coord, e.coordinate) < 10)) {
                if (minindex === -1) {
                  let POI = planPOI.item(i);
                  POI.interest = true;
                  planPOI.setAt(i, POI);
                  minindex = i;
                  interestIndex = i;
                  mindist = getDistance(coord, e.coordinate);
                  magMousepos = coord;
                } else if (mindist > getDistance(coord, e.coordinate)) {
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
                } else if (elt.interest) {
                  let POI = planPOI.item(i);
                  POI.interest = false;
                  planPOI.setAt(i, POI);
                  if (interestIndex === i) interestIndex = -1;
                }
              } else if (elt.interest) {
                let POI = planPOI.item(i);
                POI.interest = false;
                planPOI.setAt(i, POI);
                if (interestIndex === i) interestIndex = -1;
              }
            }
          }
        } else if (!planStart) { // 未开始新一轮规划，可查看区域信息
          // TODO: 需要解决一下重叠区域的问题
          for (let i = 0; i < zonePoly.getLength(); i++) {
            let item = zonePoly.item(i);
            if (item.getGeometry().intersectsCoordinate(mousepos)) {
              item.highlight = true;
              zonePoly.setAt(i, item);
              zoneindex = i;
              mapHint.show = true;
              mapHint.msg = "id: " + item.id;
            } else if (item.highlight) {
              item.highlight = false;
              zonePoly.setAt(i, item);
              if (mapHint.msg === "id: " + item.id) {
                zoneindex = -1;
                mapHint.show = false;
              }
            }
          }
        }
      });

      map.on("pointerdrag", (e) => {
        if (!alt) return true;
        if (interestIndex !== -1) {
          let item = planPOI.item(interestIndex);
          item.getGeometry().setCoordinates(e.coordinate);
          planPOI.setAt(interestIndex, item);
          let POIIndex = Math.ceil(interestIndex / 2);
          POIList[POIIndex] = e.coordinate;

          if (interestIndex !== 0) {
            let line = planPOI.item(interestIndex - 1);
            let co = line.getGeometry().getCoordinates();
            co[1] = e.coordinate;
            planPOI.setAt(interestIndex - 1, new Feature(new LineSting(co)));
          }

          if (interestIndex !== planPOI.getLength() - 1) {
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
        if (!planStart && POIList.length === 0) return;
        if (POIList.length === 1) {
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
              if ((getDistance(coord, mousepos) < 10)) {
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
              if ((getDistance(coord, mousepos) < 10)) {
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
                  if (interestIndex === i) interestIndex = -1;
                }
              } else if (elt.interest) {
                let POI = planPOI.item(i);
                POI.interest = false;
                planPOI.setAt(i, POI);
                if (interestIndex === i) interestIndex = -1;
              }
            }
          }
        }
      });

      kuEvents.on("shift", () => {
        magnet = false;
        alt = false;
        for (let i = 0; i < planPOI.getLength(); i++) {
          let elt = planPOI.item(i);
          if (elt.getGeometry().getType() === "Point") {
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
    components: {ZoneDataInput},
    method: {},
    data() {
      return {
        map: null,
        keydown(key) {
          kdEvents.emit(key);
        },
        keyup(key) {
          kuEvents.emit(key);
        },
        mapHint: mapHint,
        zdiInfo: zdiInfo
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
    z-index: 500;
    -moz-user-select: none; /*火狐*/
    -webkit-user-select: none; /*webkit浏览器*/
    -ms-user-select: none; /*IE10*/
    -khtml-user-select: none; /*早期浏览器*/
    user-select: none;

    font-size: xx-small;

    padding-left: 5px;
    padding-right: 5px;

    border-radius: 5px;

    background-color: #383838;
    color: white;
  }

  .zdi--container {
    position: absolute;

    z-index: 999;

    top: 50%;
    left: 50%;

    transform: translate(-50%, -50%);
  }

</style>
