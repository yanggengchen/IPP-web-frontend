<template>
  <div class="main">
    <div class="row">
      <table class="table table-striped">
        <thead>
        <tr>
          <td>UID</td>
          <td>用户名</td>
          <td>权限</td>
          <td>操作</td>
        </tr>
        </thead>
        <tbody>
        <tr v-for="user in users">
          <td class="datatable-id">
            {{ user._id }}
          </td>
          <td class="datatable-username">
            {{ user.username }}
          </td>
          <td class="datatable-authority">
            {{ user.authority }}
          </td>
          <td class="datatable-operation">
            <button class="btn-dark">改密</button>
            <button class="btn-dark">管理</button>
            <button class="btn-dark">删除</button>
          </td>
        </tr>
        </tbody>
      </table>
    </div>
    <div class="row">
      <button class="btn btn-outline-primary" @click="showInsert = true">新建用户</button>
    </div>
    <div v-bind:class="showInsert?'fade show':'fade'">
      <div class="modal" id="createUser" tabindex="-1" role="dialog" aria-labelledby="label" aria-hidden="true"
           v-bind:style="showInsert?'display: block;':''" v-if="showInsert">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h4 class="modal-title" id="label">新建用户</h4>
              <button type="button" class="close" @click="showInsert = false">x</button>
            </div>
            <form role="form" class="form-horizontal">
              <div class="modal-body">
                <div class="form-group form-row">
                  <label for="username">
                    用户名
                  </label>
                  <input type="text" class="form-control" name="username" id="username" required
                         v-model="insert.username"/>
                </div>
                <div class="form-group form-row">
                  <label for="password">
                    密码
                  </label>
                  <input type="password" class="form-control" name="password" id="password" required
                         v-model="insert.password"/>
                </div>
                <div class="form-group form-row">
                  <label for="authority">
                    权限
                  </label>
                  <input type="number" class="form-control" name="authority" id="authority" required
                         v-model="insert.authority"/>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-primary" @click="insertUser">提交</button>
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
import axios from "axios"
import qs from "qs"
import crypto from "crypto";

export default {
  name: "User",
  methods: {
    closeModal() {
      this.userData.showInsert = false;
    },
    insertUser() {
      let username = this.userData.insert.username,
        password = crypto.createHash("sha256").update(this.userData.insert.password + "123").digest("base64"),
        authority = this.userData.insert.authority;

      axios.post(process.env.BUSINESS_API_ROOT + "/business/user",
        qs.stringify({
          username, password, authority
        })
        , {
          headers: {
            authorization: auth.token
          }
        }).then(() => {
        return axios.get(process.env.BUSINESS_API_ROOT + "/business/user", {
          headers: {
            authorization: auth.token
          }
        })
      }).then((result) => {
        this.userData.users = result.data;
        this.closeModal();
      }).catch(() => {
        this.unauthorized = true;
        this.closeModal();
      })
    }
  },
  data() {
    this.userData = {}
    this.userData.users = [];
    this.userData.unauthorized = false;
    this.userData.showInsert = false;
    this.userData.insert = {
      username: "",
      password: "",
      authority: 200
    }

    axios.get(process.env.BUSINESS_API_ROOT + "/business/user", {
      headers: {
        authorization: auth.token
      }
    }).then((result) => {
      this.userData.users = result.data;
    }).catch(() => {
      this.unauthorized = true;
    })

    return this.userData;
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
