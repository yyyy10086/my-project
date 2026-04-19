<template>
  <RouterView></RouterView>
</template>

<script setup lang="ts">

</script>


<style>
/* 添加全局样式 */
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  font-family: Arial, sans-serif;
}

#app {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
}
</style>
