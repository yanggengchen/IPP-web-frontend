import Collection from "ol/Collection"
import VectorLayer from "ol/layer/Vector"
import VectorSource from "ol/source/Vector"

import EventEmitter from "events"

import axios from "axios"

import Feature from "ol/Feature"
import Point from "ol/geom/Point"
import LineString from "ol/geom/LineString"

import * as style from "ol/style";

import arrow from "@/assets/vendor/icon/arrow.png"

export var Flight = (() => {
  let feature = new Collection();
  let visible = false;

  return class Flight extends EventEmitter {
    constructor() {
      super();
      this.layer = new VectorLayer({
        source: new VectorSource({
          features: feature
        }),
        style: this.style
      });
    }

    style(feature) {
      if(!visible) return;

      // 参考openlayers官网
      let geometry = feature.getGeometry();
      let styles = [
        // linestring
        new style.Style({
          stroke: new style.Stroke({
            color: '#ffcc33',
            width: 2,
          }),
        })];

      geometry.forEachSegment(function (start, end) {
        let dx = end[0] - start[0];
        let dy = end[1] - start[1];
        let rotation = Math.atan2(dy, dx);
        // arrows
        styles.push(
          new style.Style({
            geometry: new Point(end),
            image: new style.Icon({
              src: arrow,
              anchor: [0.75, 0.5],
              rotateWithView: true,
              rotation: -rotation,
            }),
          })
        );
      });

      return styles;
    }

    refresh() {
      this.layer.changed();
    }

    /**
     * 加载某个无人机的航路信息
     * @param id
     * @returns {Promise<>}
     */
    async load(id) {
      let result = await axios.get(process.env.BUSINESS_API_ROOT + "/business/status/" + id + "?limit=600");
      let dataArray = result.data;

      if(dataArray) feature.clear();
      else return;

      let last = [];
      for(let i = 0; i < dataArray.length; i++) {
        if(last !== []) {
          feature.push(new Feature(new LineString([last, dataArray[i].coordinates])))
        }
        last = dataArray[i].coordinates;
      }
    }

    show() {
      visible = true;
      this.refresh();
    }

    hide() {
      visible = false;
      this.refresh();
    }

    onUnmount() {
      this.removeAllListeners();
    }
  }
})();

export default Flight;
