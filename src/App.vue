<template>
  <div id="app">
    <nav>
      <ul class="nav--list">
        <li class="nav--logo"><a href="/#/">无人机物流系统——管理系统</a></li>
        <router-link v-for="(router, index) in routers" :to="{name: router.name}" class="nav--item" exact tag="li" :key="index">{{router.meta.disp}}</router-link>
      </ul>
    </nav>
    <router-view class="main"/>
  </div>
</template>

<script>
  export default {
    data() {
      return {
        routers: this.$router.options.routes
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
    white-space:nowrap;

    -moz-user-select: none; /*火狐*/
    -webkit-user-select: none; /*webkit浏览器*/
    -ms-user-select: none; /*IE10*/
    -khtml-user-select: none; /*早期浏览器*/
    user-select: none;
  }

  .nav--list {
    -webkit-box-pack: start;
    -ms-flex-pack: start;
    justify-content: flex-start
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
</style>
