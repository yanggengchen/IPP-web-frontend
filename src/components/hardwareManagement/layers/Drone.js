import Collection from "ol/Collection"
import VectorLayer from "ol/layer/Vector"
import VectorSource from "ol/source/Vector"

import axios from "axios"

import Feature from "ol/Feature"
import Point from "ol/geom/Point"

import EventEmitter from "events"

import * as style from "ol/style";

import drone_4 from "@/assets/vendor/icon/drone-4.png"
import drone_6 from "@/assets/vendor/icon/drone-6.png"

const colorTable = [
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

const Drone = (() => {
  let drone = [];
  let feature = new Collection();
  let eventEnabled = false;
  let interest = -1;
  let object;

  function search(coords) {
    for (let i = 0; i < drone.length; i += 1) {
      if (getDistance(drone[i].status.coordinates, coords) < 20) return i;
    }
    return -1;
  }

  class Drone extends EventEmitter {
    constructor() {
      super();
      object = this;
      this.layer = new VectorLayer({
        source: new VectorSource({
          features: feature
        }),
        style: this.style
      });
      this.reload().then(() => {
        this.emit("load");
      }).catch((reason) => {
        this.emit("error", reason);
      });
      setInterval(() => {
        this.reload().then(() => {
          this.emit("load");
        }).catch((reason) => {
          this.emit("error", reason);
        });
      }, 1000);
    }

    async reload() {
      let _event_enabled = eventEnabled;
      eventEnabled = false;
      let droneCollection = await axios.get(process.env.BUSINESS_API_ROOT + "/business/drone");
      let droneArray = droneCollection.data;
      for(let i = 0; i < droneArray.length; i++) {
        feature.clear();
        drone.push(droneArray[i]);
        let point = new Feature(new Point(droneArray[i].status.coordinates));
        point.type = "drone";
        feature.push(point);
        eventEnabled = _event_enabled
      }
    }

    refresh() {
      feature.push(feature.pop()); // TODO: 找到不那么暴力的刷新方法
    }

    style(feature) {
      if(feature.type === "drone") {
        return new style.Style({
          image: new style.Icon({
            src: drone_6,
            scale: 0.2,
            anchor: [0.5, 0.5]
          })
        })
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
      let _interest = search(e.coordinate);
      if(_interest !== -1 && _interest !== interest) {
        interest = _interest;
        this.emit("load-flight", drone[_interest]._id);
      }
    }

    onClick(e) {

    }

    clearInterest() {
      interest = -1;
    }

    getInterest() {
      if(interest === -1) return;
      return drone[interest];
    }

    enableEvent() {
      eventEnabled = true;
    }

    disableEvent() {
      eventEnabled = false;
      interest = -1;
    }

    getDroneList() {
      return drone;
    }
  }

  return Drone;
})();

export default Drone;
