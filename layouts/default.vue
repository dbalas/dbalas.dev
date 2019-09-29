<template>
  <div class="wrapper">
    <div class="container">
      <div class="row">
        <div class="content">
          <nuxt />
        </div>
        <line-menu />
      </div>
    </div>
  </div>
</template>

<script>
import LineMenu from '~/components/LineMenu.vue'

export default {
  components: {
    LineMenu
  }
}
</script>

<style lang="scss">
@import url('https://fonts.googleapis.com/css?family=Roboto:400');

*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.container {
  box-sizing: border-box;
  color: white;
  font: 400 1em/ 1.25 Roboto, sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;

  background: #272727;
  background: radial-gradient(circle, #404040 0%, #212121 52%);
}

.row {
  width: 100%;
  max-width: 960px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
}

.content {
  z-index: 2;
}
</style>
