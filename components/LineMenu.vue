<template>
  <nav id="line-menu">
    <component
      :is="linkEl(item.href).is"
      v-for="item in items"
      :key="item.id"
      v-bind="linkEl(item.href, item.title)"
    >
      <img v-if="item.icon" :src="item.icon" />
      {{ item.text }}
    </component>
  </nav>
</template>

<script>
export default {
  data() {
    return {
      items: [
        {
          id: 'github',
          href: 'https://github.com/dbalas',
          icon: require('~/assets/github.svg')
        },
        {
          id: 'pocket',
          href: 'https://getpocket.com/@dbalas',
          icon: require('~/assets/pocket.svg')
        },
        {
          id: 'linkedin',
          href: 'https://www.linkedin.com/in/danielbalastegui',
          icon: require('~/assets/linkedin.svg')
        }
      ]
    }
  },
  created() {
    const index = this.items.findIndex(item => item.href === this.$route.path)
    this.current = this.hover = index || 0
  },
  methods: {
    linkEl(href, title) {
      if (href.match(/http(s)?|mailto/)) {
        return {
          is: 'a',
          href: href,
          target: '_blank',
          rel: 'noopener'
        }
      }
      return {
        is: 'nuxt-link',
        to: href
      }
    },
    onClick(idx) {
      this.current = idx
      this.hover = idx
    },
    onMouseOver(idx) {
      this.hover = idx
    }
  }
}
</script>

<style lang="scss" scoped>
@keyframes circle-1 {
  0% {
    opacity: 0;
  }
  100% {
    top: -10px;
    right: -10px;
    bottom: -10px;
    left: -10px;
    opacity: 0.3;
  }
}

@keyframes circle-2 {
  100% {
    top: 0px;
    right: 0px;
    bottom: 0px;
    left: 0px;
    opacity: 0.1;
  }
}

nav {
  position: relative;
  width: 100%;
  display: flex;

  a {
    position: relative;
    width: 3.5rem;
    height: 3.5rem;
    margin-right: 4rem;
    border-radius: 50%;

    &:last-child {
      margin-right: 0;
    }

    img {
      width: 100%;
      height: auto;
    }

    &:after {
      content: '';
      position: absolute;
      z-index: 1;
      top: -10px;
      right: -10px;
      bottom: -10px;
      left: -10px;
      background-color: transparent;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: none;
    }

    &::before {
      content: '';
      position: absolute;
      z-index: 1;
      top: -20px;
      right: -20px;
      bottom: -20px;
      left: -20px;
      background-color: transparent;
      border: 1px solid rgba(255, 255, 255, 0.4);
      border-radius: 50%;
      display: none;
    }

    &:hover {
      &:before {
        display: block;
        animation: circle-1 1s linear infinite;
      }
      &:after {
        display: block;
        animation: circle-2 1s linear infinite;
      }
    }
  }
}
</style>
