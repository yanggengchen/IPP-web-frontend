<template>
  <div class="main">
    <div class="row">
      <table class="table table-striped">
        <thead>
        <tr>
          <td>单号</td>
          <td>发起人</td>
          <td>接收人</td>
          <td>出发地</td>
          <td>目的地</td>
          <td>货号</td>
          <td>操作</td>
        </tr>
        </thead>
        <tbody>
        <tr v-for="order in orders">
          <td class="datatable-id">
            {{ order._id }}
          </td>
          <td class="datatable-sender hint" v-bind:title="order.sender._id">
            {{ order.sender.username }}
          </td>
          <td class="datatable-receiver hint" v-bind:title="order.receiver._id">
            {{ order.receiver.username }}
          </td>
          <td class="datatable-from hint" v-bind:title="order.from._id">
            {{ order.from.description }}
          </td>
          <td class="datatable-to hint" v-bind:title="order.to._id">
            {{ order.to.description }}
          </td>
          <td class="datatable-product">
            {{ order.product }}
          </td>
          <td class="datatable-operation">
            <button class="btn-dark">删除订单</button>
          </td>
        </tr>
        </tbody>
      </table>
    </div>
    <div class="row">
      <button class="btn btn-outline-primary" @click="showInsert = true">创建订单</button>
    </div>
    <div v-bind:class="showInsert?'fade show':'fade'">
      <div class="modal" id="createOrder" tabindex="-1" role="dialog" aria-labelledby="label" aria-hidden="true"
           v-bind:style="showInsert?'display: block;':''" v-if="showInsert">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h4 class="modal-title" id="label">创建订单</h4>
              <button type="button" class="close" @click="showInsert = false">x</button>
            </div>
            <form role="form" class="form-horizontal">
              <div class="modal-body">
                <div class="form-group form-row">
                  <label for="receiver">
                    收货人
                  </label>
                  <input type="text" class="form-control" name="receiver" id="receiver"/>
                </div>
                <div class="form-group form-row">
                  <label for="to">
                    收获地
                  </label>
                  <input type="text" class="form-control" name="receiver" id="to"/>
                </div>
                <div class="form-group form-row">
                  <label for="product">
                    货品
                  </label>
                  <input type="text" class="form-control" name="receiver" id="product"/>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-primary">提交</button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div class="modal-backdrop show" v-if="showInsert"></div>
    </div>
  </div>
</template>

<script>
export default {
  name: "Order",
  methods: {
    closeModal() {
      $('#createOrder').modal('hide')
    }
  },
  data() {
    return {
      orders: [{
        _id: 123,
        sender: {
          _id: 123,
          username: "甲"
        },
        receiver: {
          _id: 456,
          username: "乙"
        },
        from: {
          _id: 123,
          description: "龙宾楼"
        },
        to: {
          _id: 456,
          description: "菜鸟驿站"
        },
        product: 123,
      }],
      showInsert: false
    }
  },
  mounted() {
    $(".hint").tooltip({
      placement: "left"
    });
  }
}
</script>

<style scoped>
.main {
  margin-left: 3rem;
  margin-right: 3rem;
}
</style>
