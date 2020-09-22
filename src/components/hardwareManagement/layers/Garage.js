import Collection from "ol/Collection"
import VectorLayer from "ol/layer/Vector"
import VectorSource from "ol/source/Vector"

import axios from "axios"

import Feature from "ol/Feature"
import Point from "ol/geom/Point"
import Polygon from "ol/geom/Polygon"

import EventEmitter from "events"

import pinImg from "@/assets/vendor/icon/pin.png"
import newPinImg from "@/assets/vendor/icon/newPin.png"

import * as style from "ol/style";

const colorTable = [
  "rgba(0, 0, 255, 0.3)",
  "rgba(0, 200, 255, 0.3)",
  "rgba(200, 0, 255, 0.3)"
]

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

const Garage = (() => {
  let garage = [];
  let interestedGarage = -1;
  let garageFeature = new Collection();
  let dblInterval = -1;
  let eventEnabled = true;

  function search(coords) {
    for (let i = 0; i < garage.length; i += 1) {
      if (getDistance(garage[i].center.coordinate, coords) < 7) return i;
    }
    return -1;
  }

  class Garage extends EventEmitter {
    constructor() {
      super();
      this.layer = new VectorLayer({
        source: new VectorSource({
          features: garageFeature
        }),
        style: this.style
      });
      this.reload().then(() => {
        this.emit("load");
      }).catch((reason) => {
        this.emit("error", reason);
      })
    }

    async reload() {
      // 添加或移除机库时这里会出现问题,目前不影响但是以后最好要改
      eventEnabled = false;
      let garageList = (await axios.get(process.env.BUSINESS_API_ROOT + "/business/garage",
            {
              headers: {
                authorization: auth.token
              }
            })).data;
      for (let i = 0; i < garageList.length; i++) {
        let garage = garageList[i];
        let pinpoint = (await axios.get(process.env.MAP_API_ROOT + "/map/pinpoint/" + garage.center.$id,
            {
              headers: {
                authorization: auth.token
              }
            })).data;
        garage.center = pinpoint;
        let ppFeature = new Feature(new Point(pinpoint.coordinate));
        ppFeature.type = "pinpoint"
        ppFeature.index = i;
        ppFeature.new = pinpoint.new;
        garageFeature.push(ppFeature);

        for(let j = 0; j < garage.products.length; j++) {
          garage.products[j] = (await axios.get(process.env.BUSINESS_API_ROOT + "/business/product/" + garage.products[j].$id,
            {
              headers: {
                authorization: auth.token
              }
            })).data;
        }

        if (garage.hasOwnProperty("zone")) {
          let zone = (await axios.get(process.env.MAP_API_ROOT + "/map/zone/" + garage.zone,
            {
              headers: {
                authorization: auth.token
              }
            })).data;
          let zFeature = new Feature(new Polygon([zone.vertex]));
          zFeature.type = "zone"
          zFeature.index = i;
          garageFeature.push(zFeature);
        }
      }
      garage = garageList;
      eventEnabled = true;
    }

    style(feature) {
      if (feature.type === "pinpoint") {
        return new style.Style({
          image: new style.Icon({
            src: feature.new ? newPinImg : pinImg,
            scale: (interestedGarage === feature.index) ? 0.15 : 0.1,
            anchor: [0.55, 0.8]
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
            color: colorTable[feature.index % colorTable.length]
          })
        })
      }
    }

    refresh() {
      if(garageFeature.getLength())
        garageFeature.push(garageFeature.pop()); // TODO: 找到不那么暴力的刷新方法
      else {
        garageFeature.push(new Feature());
        garageFeature.pop();
      }
    }

    registerParent(map) {
      this.parent = map;
      map.on("pointermove", (e) => {
        this.onPointerMove(e);
      });
      map.on("click", (e) => {
        this.onClick(e);
      });
    }

    onPointerMove(e) {
      if(!eventEnabled) return;
      interestedGarage = search(e.coordinate);
      this.refresh();
    }

    onClick(e) {
      if(!eventEnabled) return;
      if (interestedGarage !== -1) {
        if(dblInterval === -1) {
          this.emit("click", garage[interestedGarage])
          dblInterval = setTimeout(() => { dblInterval = -1; this.emit("singleclick", garage[interestedGarage]); }, 50)
        } else {
          this.emit("dblclick", garage[interestedGarage]);
        }
      }
    }

    clearInterest() {
      interestedGarage = -1;
      this.refresh();
    }

    getInterest() {
      return garage[interestedGarage];
    }

    enableEvent() {
      eventEnabled = true;
    }

    disableEvent() {
      eventEnabled = false;
      interestedGarage = -1;
    }

    onUnmount() {
      this.removeAllListeners();
    }
  }

  return Garage;
})();

export default Garage;
