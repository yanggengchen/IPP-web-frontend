<template>
  <div id="app">
    <div id="main" v-if="auth.token">
      <nav>
        <ul class="nav--list">
          <li class="nav--logo"><a href="/#/">无人机物流系统——管理系统</a></li>
          <router-link v-for="(router, index) in routers" :to="{name: router.name}" class="nav--item" exact tag="li"
                       :key="index">{{router.meta.disp}}
          </router-link>
        </ul>
        <ul class="nav--list">
          <li class="nav--item right"><a href="/#/">退出登录</a></li>
        </ul>
      </nav>
      <router-view class="main"/>
    </div>
    <div id="login" v-if="!auth.token">
      <div class="panel--container">
        <div class="panel panel-default">
          <div class="panel-header" style="text-align: center;">
            <h3 class="panel-title">
              管理登录
            </h3>
          </div>
          <div class="panel-body">
            <form role="form" class="form-horizontal" @submit.prevent="submit">
              <div class="form-group form-row">
                <label for="username">
                  用户名:
                </label>
                <input type="text" class="form-control" name="username" id="username" required v-model="form.username">
              </div>
              <div class="form-group form-row">
                <label for="password">
                  密码:
                </label>
                <input type="password" class="form-control" name="password" id="password" required v-model="form.password">
              </div>
              <div class="checkbox form-row">
                <label for="remember">
                  <input type="checkbox" name="remember" id="remember" v-model="form.remember">
                    记住我
                </label>
              </div>
              <div style="text-align: center;">
                <p class="help-block red" v-if="loginStatus.fail">登陆失败</p>
                <button type="submit" id="submit" class="btn-default">登录</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import axios from "axios"
  import qs from "qs"
  import crypto from "crypto"

  let loginStatus = { fail: false };

  export default {
    methods: {
      async submit() {
        let result = await axios.post(process.env.AUTH_API_ROOT + "/auth?json=true", qs.stringify({
          username: this.form.username,
          password: crypto.createHash("sha256").update(this.form.password + "123").digest("base64"),
          long: this.form.remember
        }));
        if(result.data.token) {
          auth.token = result.data.token;
          auth.expires = result.data.expires;
          loginStatus.fail = false;
          if(this.form.remember) {
            this.$cookie.set("token", result.data.token, new Date(result.data.expires));
          }
        } else {
          loginStatus.fail = true;
        }
      }
    },
    data() {
      this.form = {
        username: "",
        password: "",
        remember: false
      };
      if(this.$cookie.get("token")) {
        auth.token = this.$cookie.get("token");
        auth.long = true;
      }
      return {
        routers: this.$router.options.routes,
        auth,
        form: this.form,
        loginStatus
      }
    }
  }
</script>

<style scoped>
  #app {
    overflow: hidden;
    width: 100%
  }

  a:link, a:visited {
    text-decoration: none;
    color: #666;
  }

  nav {
    position: fixed;
    top: 0;
    left: 0;

    height: 3rem;
    width: 100%;

    box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
    z-index: 1;

    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -ms-flex-wrap: wrap;
    flex-wrap: wrap;
    -webkit-box-orient: horizontal;
    -webkit-box-direction: normal;
    -ms-flex-direction: row;
    flex-direction: row;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-content: center;
    alignment: center;

    overflow: hidden;
    white-space: nowrap;

    -moz-user-select: none; /*火狐*/
    -webkit-user-select: none; /*webkit浏览器*/
    -ms-user-select: none; /*IE10*/
    -khtml-user-select: none; /*早期浏览器*/
    user-select: none;

    justify-content: space-between;
  }

  .nav--list {
    -webkit-box-pack: start;
    -ms-flex-pack: start;
    justify-content: flex-start
  }

  .right {
    -webkit-box-pack: end;
    -ms-flex-pack: end;
    justify-content: flex-end;
    margin-right: 40px;
  }

  .nav--logo {
    color: white;
    background-color: #1a3c4d;
    display: inline-block;
    line-height: 3.125rem;
    padding: 0 .625rem;
    margin-top: 1rem;
    margin-right: 0;
    font-size: .875rem;
    position: relative;
    -webkit-transition: color .3s cubic-bezier(.215, .61, .355, 1);
    transition: color .3s cubic-bezier(.215, .61, .355, 1);
    min-width: 5rem;
    text-align: center;
  }

  .nav--logo > a {
    color: white;
  }


  .nav--item {
    display: inline-block;
    line-height: 3.125rem;
    padding: 0 .625rem;
    margin-top: 1rem;
    margin-left: 0;
    font-size: .875rem;
    position: relative;
    -webkit-transition: all .3s cubic-bezier(.215, .61, .355, 1);
    transition: all .3s cubic-bezier(.215, .61, .355, 1);
    min-width: 5rem;
    text-align: center;

    cursor: pointer;
  }

  .nav--item:hover {
    background-color: #1a321a;
    color: white
  }

  .nav--item.router-link-exact-active {
    background-color: #1a321a;
    color: white
  }

  .nav--item.active > a {
    color: white;
  }

  .nav--item:hover > a {
    color: white;
  }

  .main {
    margin-top: 3rem;
    height: calc(100% - 3rem);
  }

  #login {
    background-color: lightgrey;

    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  .panel {
    background-color: white;
    padding: 1rem 2rem 1rem 2rem;
    border-radius: .3rem;

    box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  }

  .panel--container {
    position: absolute;

    z-index: 999;

    top: 50%;
    left: 50%;

    transform: translate(-50%, -50%);
  }

  .red {
    color: red;
  }
</style>
