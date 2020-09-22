<template>
  <div class="dialog">
      <div class="modal" id="createOrder" tabindex="-1" role="dialog" aria-labelledby="label" aria-hidden="true"
           style="display: block">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h4 class="modal-title" id="label">机库信息</h4>
              <button type="button" class="close" @click="event.emit('close');">x</button>
            </div>
            <form role="form" class="form-horizontal">
              <div class="modal-body">
                <div class="form-group form-row">
                  <label for="id">
                    机库ID
                  </label>
                  <input type="text" class="form-control" name="id" id="id" disabled v-model="formdata.id"/>
                </div>
                <div class="form-group form-row">
                  <div class="col-form-label">
                    <label for="latitude">
                      经度
                    </label>
                    <input type="text" class="form-control" name="latitude" id="latitude" disabled v-model="formdata.longitude"/>
                  </div>
                  <div class="col-form-label">
                    <label for="longitude">
                      纬度
                    </label>
                    <input type="text" class="form-control" name="longitude" id="longitude" disabled v-model="formdata.latitude"/>
                  </div>
                </div>
                <div class="form-group form-row">
                  <div class="col-form-label">
                    库存
                  </div>
                  <div class="col-form-label">
                    <button id="append" type="button" class="btn btn-sm btn-dark" @click="append">手动添加</button>
                  </div>
                </div>
                <div class="form-group form-row">
                  <table class="table" v-if="args.products.length"  style="overflow:scroll;">
                    <tr v-for="product in args.products">
                      <td>
                        {{product._id}}
                      </td>
                      <td>
                        {{{"waiting": "等待中", "onboard": "运送中", "arrived": "待收货", "fetched": "已收货"}[product.status]}}
                      </td>
                      <td>
                        <button type="button" class="btn btn-sm btn-dark" @click="del(product._id)">手动删除</button>
                      </td>
                    </tr>
                  </table>
                  <div v-else>
                    无库存
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
  name: "dlgGarage",
  props: ["args", "event"],
  methods: {
    submit() {
      console.log(this.args);
      this.event.emit("submit");
    },
    async append() {
      let response = await axios.post(process.env.BUSINESS_API_ROOT + "/business/product",
        qs.stringify({
          garage: this.args._id
        }),
          {
            headers: {
              authorization: auth.token
            }
          }
      );
      this.event.emit("refresh-garage");
    },
    async del(id) {
      let response = await axios.delete(process.env.BUSINESS_API_ROOT + "/business/product/" + id,
          {
            headers: {
              authorization: auth.token
            }
          }
      );
      this.event.emit("refresh-garage");
    }
  },
  data() {
    let long = toLonLat(this.args.center.coordinate, "EPSG:3857")[0];
    let lat = toLonLat(this.args.center.coordinate, "EPSG:3857")[1];
    this.formdata = {
      id: this.args._id,
      longitude: Math.abs(Math.round(long * 100) / 100).toString() + ((long > 0) ? "°E" : "°W"),
      latitude: Math.abs(Math.round(lat * 100) / 100).toString() + ((lat > 0) ? "°N" : "°S")
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
