<template>
  <div class="panel panel-default">
    <div class="panel-header">
      <div class="close" v-on:click="onclose" style="cursor: pointer">
        x
      </div>
      <h3 class="panel-title">
        {{type === "setting"? "区域设置": "新建区域"}}
      </h3>
    </div>
    <div class="panel-body">
      <form role="form" class="form-horizontal">
        <div class="form-group">
          <label for="id">
            ID:
          </label>
          <input type="text" class="form-control" disabled name="id" id="id" v-bind:value="defaultValues.id"/>
        </div>
        <div class="form-group">
          <label for="type">
            类型:
          </label>
          <select name="type" class="form-control" id="type" v-model="defaultValues.type">
            <option value="ban">禁飞</option>
            <option value="restriction">限高</option>
            <option value="garage">机库停机坪</option>
          </select>
        </div>
        <div class="form-group">
          <label for="min-height">
            限飞高度:
          </label>
          <input type="text" name="min-height" class="form-control" id="min-height" v-bind:value="(defaultValues.type === 'restriction') ? defaultValues.minHeight : ''"/>
        </div>
        <div style="text-align: center;">
          <button type="button" id="submit" class="btn-dark" v-on:click="_submit">提交</button>
          <button type="button" id="delete" class="btn-dark" v-if="type === 'setting'" v-on:click="_delete">删除</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
  export default {
    name: "zoneDataInput",
    props: ["type", "defaultValues", "onsubmit", "ondelete", "onclose"],
    methods: {
      _submit() {
        this.onsubmit({
          id: $("[name='id']").val(),
          type: $("[name='type']").val(),
          "min-height": $("[name='min-height']").val()
        })
      },
      _delete() {
        this.ondelete({
          id: $("[name='id']").val()
        })
      }
    },
    mounted() {
      if(this.defaultValues && this.defaultValues.type !== "restriction") {
        $("#min-height").attr("disabled", "disabled");
      }

      $("#type").on("change", function (){
        if($(this).val() !== "restriction") {
          $("#min-height").attr("disabled", "disabled");
        } else {
          $("#min-height").removeAttr("disabled");
        }
      })
    }
  }
</script>

<style scoped>
  .panel {
    background-color: white;
    padding: 1rem 2rem 1rem 2rem;
    border-radius: .3rem;

    box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  }

  .close {
    display: block;
    vertical-align: super;
    -moz-user-select:none; /*火狐*/
    -webkit-user-select:none; /*webkit浏览器*/
    -ms-user-select:none; /*IE10*/
    -khtml-user-select:none; /*早期浏览器*/
    user-select:none;
  }

</style>
