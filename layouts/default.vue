<template>
  <div class="container">
    <div class="row">
      <line-menu />
      <div class="content">
        <nuxt />
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
@import '~assets/variables';
@import url(https://fonts.googleapis.com/css?family=Open+Sans:400);

*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s;
}

.page-enter,
.page-leave-active {
  opacity: 0;
}

a {
  text-decoration: none;
  color: $primary;
}

.container {
  box-sizing: border-box;
  background: linear-gradient($background, $background),
    url(~assets/background.jpeg) 50% / cover fixed;
  color: $fontColor;
  font: 400 1em/ 1.25 open sans, sans-serif;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}

.row {
  width: 100%;
  max-width: 960px;
  padding: 2rem;
  display: flex;

  @media (max-width: 600px) {
    display: block;
  }
}

.content {
  width: 100%;
  padding: 0 0 0 3rem;

  @media (max-width: 600px) {
    padding: 1rem 0;
  }
}
</style>
