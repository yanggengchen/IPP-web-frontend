<template>
  <div id="oltest">
    <div id="map" class="map-container">

    </div>
  </div>
</template>

<script>
    import "ol/ol.css"
    import {Map, View} from "ol"
    import proj from "ol/proj"
    import Projection from "ol/proj/Projection"
    import TileLayer from "ol/layer/Tile"
    import OSM from 'ol/source/OSM'

      export default {
        name: "OLTest",
        data() {
          return {
            map: null
          };
        },
        mounted() {
          let map = new Map({
            target: "map",
            layers: [
              new TileLayer({
                source: new OSM()
              })
            ],
            view: new View({
              center: [13517795.178894024, 3636271.15076982],
              zoom: 16,
            })
          });

          map.on('click', function (e) {
            console.log(e.coordinate);
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
