<template>
  <div class="dialog">
      <div class="modal" id="createOrder" tabindex="-1" role="dialog" aria-labelledby="label" aria-hidden="true"
           style="display: block">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h4 class="modal-title" id="label">飞机信息</h4>
              <button type="button" class="close" @click="event.emit('close');">x</button>
            </div>
            <form role="form" class="form-horizontal">
              <div class="modal-body">
                <div class="form-group form-row">
                  <label for="id">
                    飞机ID
                  </label>
                  <input type="text" class="form-control" name="id" id="id" disabled v-model="formdata.id"/>
                </div>
                <div class="form-group form-row">
                  <div class="col-form-label">
                    <label for="latitude">
                      当前经度
                    </label>
                    <input type="text" class="form-control" name="latitude" id="latitude" disabled v-model="formdata.longitude"/>
                  </div>
                  <div class="col-form-label">
                    <label for="longitude">
                      当前纬度
                    </label>
                    <input type="text" class="form-control" name="longitude" id="longitude" disabled v-model="formdata.latitude"/>
                  </div>
                  <div class="col-form-label">
                    <label for="height">
                      当前航高
                    </label>
                    <input type="text" class="form-control" name="height" id="height" disabled v-model="formdata.height"/>
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-block btn-secondary" @click="event.emit('close');">关闭</button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div class="blackdrop"></div>
    </div>
</template>

<script>
import axios from "axios"
import qs from "qs"

import {toLonLat} from "ol/proj"

export default {
  name: "dlgDrone",
  props: ["args", "event"],
  methods: {
  },
  data() {
    this.formdata = {
      id: "",
      longitude: "",
      latitude: "",
      height: ""
    };

    return {
      formdata: this.formdata
    }
  }
}
</script>

<style scoped>
  .blackdrop {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1040;
    width: 100vw;
    height: 100vh;
    background-color: black;
    opacity: .1;
  }

  .dialog {
    z-index: 100;
  }

  .modal-body {
    max-height: 75vh;
    overflow: scroll;
  }
</style>
