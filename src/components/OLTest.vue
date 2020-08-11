<template>
  <div id="oltest">
    <div id="map">

    </div>
  </div>
</template>

<script>
    import "ol/ol.css";
    import {Map, View} from "ol";
    import TileLayer from "ol/layer/Tile";
    import OSM from 'ol/source/OSM';

    export default {
        name: "OLTest",
        data() {
          return {
            map: null
          };
        },
        mounted() {
          this.map = new Map({
            target: "map",
            layers: [
              new TileLayer({
                source: new OSM()
              })
            ],
            view: new View({
              center: [0, 0],
              zoom: 0,
            })
          });
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

  #map {
    width: 100%;
    height: 100%;
  }

</style>
