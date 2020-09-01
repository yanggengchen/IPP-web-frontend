<template>
  <div>
    <div id="map-component" tabindex="1"
         v-on:keydown.esc="keydown('esc')"
         v-on:keydown.ctrl.z="keydown('ctrlz')"
         v-on:keydown.shift="keydown('shift')"
         v-on:keydown.ctrl="keydown('ctrl')"
         v-on:keyup="keyup('shift')">
      <div id="map" class="map-container">
      </div>
      <div v-show="mapHint.show" id="map--hint">{{ mapHint.msg }}</div>
      <div v-show="zdiInfo.show" class="di--container">
        <ZoneDataInput
          v-bind:type="zdiInfo.type"
          v-bind:defaultValues="zdiInfo.defaultValues"
          v-bind:onsubmit="(arg) => { zdiInfo.show = false; zdiInfo.onSubmit(arg); }"
          v-bind:ondelete="(arg) => { zdiInfo.show = false; zdiInfo.onDelete(arg); }"
          v-bind:onclose="() => { zdiInfo.show = false; zdiInfo.onClose(); }"
        ></ZoneDataInput>
      </div>
      <div v-show="pdiInfo.show" class="di--container">
        <PinDataInput
          v-bind:type="pdiInfo.type"
          v-bind:defaultValues="pdiInfo.defaultValues"
          v-bind:onsubmit="(arg) => { pdiInfo.show = false; pdiInfo.onSubmit(arg); }"
          v-bind:ondelete="(arg) => { pdiInfo.show = false; pdiInfo.onDelete(arg); }"
          v-bind:onclose="() => { pdiInfo.show = false; pdiInfo.onClose(); }"
        ></PinDataInput>
      </div>
    </div>
    <div class="footer">
      {{ statusBar.status }}
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
import {PlanToolBar} from "./Map/olToolbar/toolbar"

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
import ZoneDataInput from "./Map/dataInputModule/zoneDataInput";
import PinDataInput from "./Map/dataInputModule/pinDataInput";

import pinImg from "@/assets/vendor/icon/pin.png"
import newPinImg from "@/assets/vendor/icon/newPin.png"

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

let statusBar = {
  status: "加载完毕"
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
let pdiInfo = {
  show: false,
  type: "setting",
  defaultValues: {
    id: "",
    type: "",
    height: 0
  },
  onSubmit(args) {
  },
  onDelete(args) {
  },
  onClose() {
  }
};

function loadMap() {

  // 加载原始地图层
  let mapLayer = new TileLayer({
    source: new OSM(),
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

  // 初始化图钉层
  let pinFeature = new Collection();
  let pinCoord = [];

  let pinLayer = new VectorLayer({
    source: new VectorSource({
      features: pinFeature
    }),
    style(feature) {
      if (feature.type === "terminal")
        return new style.Style({
          image: new style.Icon({
            src: feature.new ? newPinImg : pinImg,
            scale: feature.interest ? 0.15 : 0.1,
            anchor: [0.55, 0.8]
          })
        });
      else return new style.Style({
        image: new style.Circle({
          radius: feature.interest ? 7 : 5,
          fill: new style.Fill({
            color: "orange",
            width: 1
          })
        })
      })
    }
  });

  async function refreshPin() {
    let result = await axios.get(
      process.env.MAP_API_ROOT + "/map/pinpoint", {
        headers: {
          authorization: auth.token
        }
      }
    );
    pinFeature.clear();
    pinCoord = [];

    result.data.forEach((point) => {
      let feature = new Feature(new Point(point.coordinate));
      feature.id = point._id;
      feature.type = point.type;
      feature.new = point.new;
      feature.height = point.coordinate[2];
      pinFeature.push(feature);
      pinCoord.push(point.coordinate);
    })
  }

  refreshPin();

  function clearPinInterest() {
    pinSelection = [];
    pinFeature.forEach((v, cnt) => {
      v.interest = false;
      pinFeature.setAt(cnt, v);
    })
  }

  // 初始化路径层
  let routinePOI = new Collection();
  let routineID = "";

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
    let doc = (await axios.get(process.env.MAP_API_ROOT + "/map/zone", {
      headers: {
        authorization: auth.token
      }
    })).data;
    zonePoly.clear();
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
      pinLayer,
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

  let POIList = [],
    planStart = false,
    magnet = false,
    ctrl = false,
    tbMagnet = false,
    tbEdit = false,
    pen = false,
    pin = false,
    freeze = false,
    poly = false,
    mousepos = [],
    magMousepos = [],
    interestIndex = -1,
    zoneindex = -1;

  function createZDI(type, defaultValues, onSubmit, onDelete, onClose) {
    zdiInfo.type = type;
    zdiInfo.defaultValues = defaultValues;
    zdiInfo.onSubmit = (arg) => {
      freeze = false;
      onSubmit.call(zdiInfo, arg);
    };
    zdiInfo.onDelete = (arg) => {
      freeze = false;
      onDelete.call(zdiInfo, arg);
      mapHint.show = false;
    };
    zdiInfo.onClose = () => {
      freeze = false;
      onClose.call(zdiInfo);
    };
    freeze = true;
    zdiInfo.show = true;
  }

  function createPDI(type, defaultValues, onSubmit, onDelete, onClose) {
    routinePOI.clear();
    pdiInfo.type = type;
    pdiInfo.defaultValues = defaultValues;
    pdiInfo.onSubmit = (arg) => {
      freeze = false;
      onSubmit.call(pdiInfo, arg);
    };
    pdiInfo.onDelete = (arg) => {
      freeze = false;
      onDelete.call(pdiInfo, arg);
    };
    pdiInfo.onClose = () => {
      freeze = false;
      onClose.call(pdiInfo);
    };
    freeze = true;
    pdiInfo.show = true;
  }

  let toolbarEvent = new EventEmitter();
  let toolbar = new PlanToolBar(toolbarEvent);

  map.addControl(toolbar);

  // 工具栏事件
  toolbarEvent.on("clear", () => {
    kdEvents.emit("esc");
  });

  toolbarEvent.on("undo", () => {
    kdEvents.emit("ctrlz");
  });

  toolbarEvent.on("toggleZone", () => {
    clearPinInterest();
    pin = false;
    pen = false;
    planStart = false;
    POIList = [];
    planPOI.clear();
    statusBar.status = "区域编辑模式";
  });

  toolbarEvent.on("togglePin", () => {
    clearPinInterest();
    POIList = [];
    planPOI.clear();
    pin = true;
    pen = false;
    planStart = false;
    statusBar.status = "地图钉模式";
  });

  toolbarEvent.on("togglePen", () => {
    clearPinInterest();
    POIList = [];
    planPOI.clear();
    pen = true;
    pin = false;
    statusBar.status = "画笔模式";
  });

  toolbarEvent.on("toggleEdit", () => {
    tbEdit = !tbEdit;
    if (tbEdit) statusBar.status = "编辑路径点";
    else if (statusBar.status === "编辑路径点") statusBar.status = "";
  });

  toolbarEvent.on("toggleMagnet", () => {
    tbMagnet = !tbMagnet;
    if (tbMagnet) statusBar.status = "开启吸附";
    else if (statusBar.status === "开启吸附") statusBar.status = "关闭吸附";
  });

  let pinSelection = [], pinSelectMode = false;
  toolbarEvent.on("selection", () => {
    if (!pin) return;
    pinSelectMode = !pinSelectMode;
    if (pinSelectMode) {
      pinSelection = [];
      planPOI.clear();
    }
  });

  let viewRoutine = true;
  toolbarEvent.on("toggleViewRoutine", () => {
    viewRoutine = !viewRoutine;
  });

  let optInterval = 0;
  toolbarEvent.on("optimize", async () => {
    if (pen) {
      clearInterval(optInterval);
      statusBar.status = "正在规划路径";
      let result = await axios.post(
        process.env.MAP_API_ROOT + "/map/routine?multi=true",
        qs.stringify({
          POI: POIList
        }), {
          headers: {
            authorization: auth.token
          }
        }
      );

      optInterval = setInterval(async () => {
        let routine;
        try {
          routine = await axios.get(
            process.env.MAP_API_ROOT + "/map/routine/" + result.data.id, {
              headers: {
                authorization: auth.token
              }
            }
          );
        } catch (e) {
          statusBar.status = "规划路径失败";
          clearInterval(optInterval);
          return;
        }

        if (routine.data.status === "OK") {
          routinePOI.clear();
          routineID = result.data.id;

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
          statusBar.status = "规划路径完成";
          clearInterval(optInterval);
        }
      }, 500);
    } else if (pin && pinSelectMode) {
      if (pinSelection.length === 2) {
        clearInterval(optInterval);
        statusBar.status = "正在规划路径";
        let result = await axios.post(
          process.env.MAP_API_ROOT + "/map/routine?multi=true",
          qs.stringify({
            POI: [pinCoord[pinSelection[0]], pinCoord[pinSelection[1]]]
          }), {
            headers: {
              authorization: auth.token
            }
          }
        );

        optInterval = setInterval(async () => {
          let routine;
          try {
            routine = await axios.get(
              process.env.MAP_API_ROOT + "/map/routine/" + result.data.id, {
                headers: {
                  authorization: auth.token
                }
              }
            );
          } catch (e) {
            statusBar.status = "规划路径失败";
            clearInterval(optInterval);
            return;
          }

          if (routine.data.status === "OK") {
            planPOI.clear();
            routinePOI.clear();
            routineID = result.data.id;

            let LINE = new Feature(new LineSting([pinCoord[pinSelection[0]], routine.data.routine[0]]));
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

            LINE = new Feature(new LineSting([routine.data.routine[routine.data.routine.length - 1], pinCoord[pinSelection[1]]]));
            LINE.height = routine.data.height[routine.data.routine.length - 1] / 2;
            routinePOI.push(LINE);
            statusBar.status = "规划路径完成";
            clearInterval(optInterval);
          }
        }, 500);
      }
    }
  });

  toolbarEvent.on("store", async () => {
    if (!pin || !pinSelectMode || pinSelection.length !== 2 || !routineID) return;
    try {
      let result = await axios.post(
        process.env.MAP_API_ROOT + "/map/path",
        qs.stringify({
          routine: routineID,
          from: pinFeature.item(pinSelection[0]).id,
          to: pinFeature.item(pinSelection[1]).id
        }), {
          headers: {
            authorization: auth.token
          }
        }
      );
    } catch (e) {
      statusBar.status = "路径已存在"
    }

    routinePOI.clear();
    clearPinInterest();
    await refreshPin();
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
          process.env.MAP_API_ROOT + "/map/zone",
          qs.stringify({
            type: type,
            vertex: POIList,
            "min-height": minHeight
          }), {
            headers: {
              authorization: auth.token
            }
          }
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
    if (freeze) return;
    if (pen) {
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

        statusBar.status = "EPSG3857: " + realCoordinate[0].toString() + ", " + realCoordinate[1].toString() +
          ", EPSG4326: " + proj.transform(realCoordinate, "EPSG:3857", "EPSG:4326").join(", ")

        planPOI.clear();
        routinePOI.clear();
        routineID = "";
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
    } else if (pin && !pinSelectMode) {
      createPDI("new", {
          type: "terminal"
        },
        async (arg) => {
          let result = await axios.post(
            process.env.MAP_API_ROOT + "/map/pinpoint",
            qs.stringify({
              coordinate: [e.coordinate[0], e.coordinate[1], parseFloat(arg.height)],
              type: arg.type
            }), {
              headers: {
                authorization: auth.token
              }
            }
          );

          await refreshPin();
        },
        () => {
        },
        () => {
        }
      );
    }
  });

  map.on("click", (e) => {
    if (freeze) return;
    if (!pen && !pin) {
      if (mapHint.show) { // 点击在某个区域内
        let zone = zonePoly.item(zoneindex);
        createZDI("setting", {
            id: zone.id,
            type: (zone.type === "restriction" && zone.minHeight === -1) ? "ban" : zone.type,
            minHeight: zone.minHeight
          },
          async ({id: id, type: type, "min-height": minHeight}) => {
            await axios.patch(
              process.env.MAP_API_ROOT + "/map/zone/" + id,
              qs.stringify({
                type: type,
                "min-height": minHeight
              }), {
                headers: {
                  authorization: auth.token
                }
              }
            );

            await refreshZone();
          },
          async ({id: id}) => {
            await axios.delete(
              process.env.MAP_API_ROOT + "/map/zone/" + id, {
                headers: {
                  authorization: auth.token
                }
              }
            );

            refreshZone();
          },
          () => {
          }
        );
      }
    } else if (pen) {
      if (!planStart) return;
      let realCoordinate = e.coordinate;
      if (tbMagnet || magnet) realCoordinate = magMousepos;
      let point = new Feature(new Point(realCoordinate));
      let line = new Feature(new LineSting([POIList[POIList.length - 1], realCoordinate]));

      statusBar.status = "EPSG3857: " + realCoordinate[0].toString() + ", " + realCoordinate[1].toString() +
          ", EPSG4326: " + proj.transform(realCoordinate, "EPSG:3857", "EPSG:4326").join(", ");
      point.type = "POI";
      POIList.push(realCoordinate);
      planPOI.push(line);
      planPOI.push(point);
    } else if (pinSelectMode && interestIndex !== -1 && pinSelection.length < 2) {
      if (pinSelection.indexOf(interestIndex) === -1) {
        pinSelection.push(interestIndex);
        if (pinSelection.length === 2) { // 选择两个点，连接临时路径
          planPOI.clear();
          planPOI.push(new Feature(new LineSting([pinCoord[pinSelection[0]], pinCoord[pinSelection[1]]])));
        }
      }
    } else if (pinSelectMode && pinSelection.length === 2) {
      planPOI.clear();
      pinSelection.forEach((index) => {
        let POI = pinFeature.item(index);
        POI.interest = false;
        pinFeature.setAt(index, POI);
      });
      pinSelection = [];
    }
  });

  map.on("singleclick", () => {
    if (freeze) return;
    if (pin && !pinSelectMode && interestIndex !== -1) {
      createPDI("setting", {
        id: pinFeature.item(interestIndex).id,
        type: pinFeature.item(interestIndex).type,
        height: pinFeature.item(interestIndex).height
      }, async (arg) => {
        await axios.patch(
          process.env.MAP_API_ROOT + "/map/pinpoint/" + pinFeature.item(interestIndex).id,
          qs.stringify({
            type: arg.type,
            coordinate: [pinCoord[interestIndex][0], pinCoord[interestIndex][1], parseFloat(arg.height)]
          }), {
            headers: {
              authorization: auth.token
            }
          }
        );

        await refreshPin();

      }, async () => {
        await axios.delete(
          process.env.MAP_API_ROOT + "/map/pinpoint/" + pinFeature.item(interestIndex).id, {
            headers: {
              authorization: auth.token
            }
          }
        );

        refreshPin();
      }, () => {
      })
    }
  });

  map.on("pointermove", (e) => {
    if (freeze) return;

    // 这段好像有很多BUG
    mousepos = e.coordinate;
    magMousepos = mousepos;

    // 进行磁铁选择
    if (pen && planStart && (((tbMagnet || magnet) && pen) || ctrl || tbEdit)) {
      let minindex = -1;
      let mindist = -1;
      for (let i = 0; i < planPOI.getLength(); i++) {
        let elt = planPOI.item(i);
        if (elt.getGeometry().getType() === "Point") {
          let coord = elt.getGeometry().getCoordinates();

          if ((ctrl || tbEdit) && (interestIndex !== -1) && (interestIndex !== i)) {
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
    } else if (pin) {
      let minindex = -1;
      let mindist = -1;
      let preindex = interestIndex;
      for (let i = 0; i < pinFeature.getLength(); i++) {
        let elt = pinFeature.item(i);
        if (elt.getGeometry().getType() === "Point") {
          let coord = elt.getGeometry().getCoordinates();

          if ((ctrl || tbEdit) && (interestIndex !== -1) && (interestIndex !== i)) {
            let prevcoord = pinFeature.item(interestIndex).getGeometry().getCoordinates();
            if (prevcoord[0] === coord[0] && prevcoord[1] === coord[1]) {
              // 有BUG
              // 把别的点拖到它上面有的时候会交换点
              break;
            }
          }

          if ((getDistance(coord, e.coordinate) < 10)) {
            if (minindex === -1) {
              let POI = pinFeature.item(i);
              POI.interest = true;
              pinFeature.setAt(i, POI);
              minindex = i;
              interestIndex = i;
              mindist = getDistance(coord, e.coordinate);
              magMousepos = coord;
            } else if (mindist > getDistance(coord, e.coordinate)) {
              if (!pinSelectMode || pinSelection.indexOf(minindex) === -1) {
                let POI = pinFeature.item(minindex);
                POI.interest = false;
                pinFeature.setAt(minindex, POI);
              }
              let POI = pinFeature.item(i);
              POI.interest = true;
              pinFeature.setAt(i, POI);
              minindex = i;
              interestIndex = i;
              mindist = getDistance(coord, e.coordinate);
              magMousepos = coord;
            } else if (elt.interest && (!pinSelectMode || pinSelection.indexOf(i) === -1)) {
              let POI = pinFeature.item(i);
              POI.interest = false;
              pinFeature.setAt(i, POI);
              if (interestIndex === i) interestIndex = -1;
            }
          } else if (elt.interest && (!pinSelectMode || pinSelection.indexOf(i) === -1)) {
            let POI = pinFeature.item(i);
            POI.interest = false;
            pinFeature.setAt(i, POI);
            if (interestIndex === i) interestIndex = -1;
          }
        }
      }
      if (interestIndex === -1) {
        routinePOI.clear();
      }
      if (viewRoutine) {
        setTimeout(async () => {
          if (interestIndex !== preindex && interestIndex !== -1) {
            let result = await axios.get(
              process.env.MAP_API_ROOT + "/map/path/" + pinFeature.item(interestIndex).id, {
                headers: {
                  authorization: auth.token
                }
              }
            );

            routinePOI.clear();
            routineID = "";
            result.data.forEach(async (path) => {
              let routine = await axios.get(
                process.env.MAP_API_ROOT + "/map/routine/" + path.routine.$id, {
                  headers: {
                    authorization: auth.token
                  }
                }
              );

              let LINE = new Feature(new LineSting([routine.data.POI[0], routine.data.routine[0]]));
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

              LINE = new Feature(new LineSting([routine.data.routine[routine.data.routine.length - 1], routine.data.POI[1]]));
              LINE.height = routine.data.height[routine.data.routine.length - 1] / 2;
              routinePOI.push(LINE);
            })
          }
        });
      }
    } else if (!pin && !pen) { // 未开始新一轮规划，可查看区域信息
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

  $(document).on("mousemove", (e) => {
    if (freeze) return;
    $("#map--hint").css({
      top: e.clientY - 10,
      left: e.clientX + 10
    })
  });

  $(window).on("resize", () => {
    mapHint.show = false;
  });

  map.on("pointerdrag", (e) => {
    if (pen && (ctrl || tbEdit)) {
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
    }
    return true;
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
    if (planStart && pen) {
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

  kdEvents.on("ctrl", () => {
    ctrl = true;
    if (planStart && pen) {
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
    ctrl = false;
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
}

export default {
  name: "Map",
  components: {ZoneDataInput, PinDataInput},
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
      mapHint,
      zdiInfo,
      pdiInfo,
      statusBar
    };
  },
  mounted() {
    $(document).off("mousemove");

    // 加载地图
    loadMap.call(this);
  }
}
</script>

<style scoped>
#map-component {
  position: absolute;
  left: 0;
  width: 100%;
  height: calc(100% - 4.5rem);
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

.di--container {
  position: absolute;

  z-index: 999;

  top: 50%;
  left: 50%;

  transform: translate(-50%, -50%);
}

.footer {
  position: absolute;
  top: calc(100% - 1.5rem);
  left: 0;
  height: 1.5rem;
  width: 100%;

  font-size: small;

  background-color: #eee;
  padding-left: 1rem;
}

</style>
