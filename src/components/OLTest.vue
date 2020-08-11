<template>
  <div id="oltest">
    <div id="map" class="map-container">

    </div>
  </div>
</template>

<script>
  import "ol/ol.css"
  import {Map, View} from "ol"
  import TileLayer from "ol/layer/Tile"
  import VectorLayer from "ol/layer/Vector"
  import VectorSource from "ol/source/Vector"
  import Feature from "ol/Feature"
  import LineSting from "ol/geom/LineString"
  import Point from "ol/geom/Point"
  import * as proj from "ol/proj"
  import OSM from "ol/source/OSM"
  import * as interaction from "ol/interaction"

  let lastpoint = [];
  let pointList = [];

  export default {
    name: "OLTest",
    data() {
      return {
        map: null
      };
    },
    mounted() {

      let mapLayer = new TileLayer({
        source: new OSM(),
        projection: proj.get("ESPG:4326")
      });

      let vectorLayer = new VectorLayer({
        source: new VectorSource({
          features: []
        })
      });

      let map = new Map({
        target: "map",
        layers: [
          mapLayer,
          vectorLayer
        ],
        view: new View({
          center: [13519023.565173406, 3636438.266781322],
          rotation: Math.PI / 10,
          zoom: 17.992819590157538,
        }),
        interactions:new interaction.defaults({
          doubleClickZoom:false,   //屏蔽双击放大事件
        })
      });

      map.on('click', function (e) {
        let arrFeatures = map.getLayers().getArray()[1].getSource().getFeatures();

        if (lastpoint.length === 0)
          arrFeatures.push(new Feature(new Point(e.coordinate)));
        else
          arrFeatures.push(new Feature(new LineSting([lastpoint, e.coordinate])));
        lastpoint = e.coordinate;

        map.getLayers().setAt(1, new VectorLayer({
          source: new VectorSource({
            features: arrFeatures
          }),
        }));

        map.render();
      });

      map.on('dblclick', function (e) {
        let arrFeatures = map.getLayers().getArray()[1].getSource().getFeatures();

        arrFeatures.push(new Feature(new Point(e.coordinate)));
        lastpoint = e.coordinate;

        map.getLayers().setAt(1, new VectorLayer({
          source: new VectorSource({
            features: arrFeatures
          }),
        }));

        map.render();
      })
    }
  }
</script>

<style scoped>
  #oltest {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

</style>
