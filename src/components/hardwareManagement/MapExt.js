import "ol/ol.css"
import {Map, View} from "ol"
import * as interaction from "ol/interaction";
import * as control from "ol/control";

import EventEmitter from "events"

export var MapExt = (() => {
  let dblClickTimeout = 0;
  let layers, controls = [];

  return class MapExt extends EventEmitter {
    constructor(_target, _layers) {
      super()
      layers = _layers;
      this.map = new Map({
        target: _target,
        layers: _layers,
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

      this.map.on("pointermove", (e) => {
        this.emit("pointermove", e);
      });

      this.map.on("click", (e) => {
        this.emit("click", e);
        if(dblClickTimeout === 0) {
          dblClickTimeout = setTimeout(() => {
            this.map.once("click", () => {
              this.emit("dblclick", e);
              clearInterval(dblClickTimeout);
              dblClickTimeout = 0;
            })
            this.emit("singleclick", e);
          }, 500);
        }
      });
    }

    addControl(control) {
      this.map.addControl(control);
      controls.push(control);
    }

    getZoom() {
      return this.map.getView().getZoom();
    }

    unmount() {
      this.emit("unmount");
      this.removeAllListeners();
      controls.forEach((item) => {
        item.event.removeAllListeners();
      })
    }
  }
})();

export default MapExt;
