<template>
  <nav id="line-menu" :style="{ '--hover': hover }">
    <component
      :is="linkEl(item.href).is"
      v-for="(item, index) in items"
      :key="item.id"
      v-bind="linkEl(item.href)"
    >
      <span
        :class="{ current: current === index }"
        @click="onClick(index)"
        @mouseover="onMouseOver(index)"
      >
        <img v-if="item.icon" :src="item.icon" />
        {{ item.text }}
      </span>
    </component>
  </nav>
</template>

<script>
export default {
  data() {
    return {
      current: 0,
      hover: 0,
      items: [
        {
          id: 'hello',
          href: '/',
          text: 'Hello'
        },
        {
          id: 'pocket',
          href: 'https://getpocket.com/@dbalas',
          text: 'Pocket',
          icon: require('~/assets/pocket.svg')
        },
        {
          id: 'github',
          href: 'https://github.com/dbalas',
          text: 'GitHub',
          icon: require('~/assets/github.svg')
        },
        {
          id: 'linkedin',
          href: 'https://www.linkedin.com/in/danielbalastegui',
          text: 'LinkedIn',
          icon: require('~/assets/linkedin.svg')
        },
        {
          id: 'contact',
          href: 'mailto:dbalasdev@gmail.com',
          text: 'Email',
          icon: require('~/assets/email.svg')
        }
      ]
    }
  },
  created() {
    const index = this.items.findIndex(item => item.href === this.$route.path)
    this.current = this.hover = index || 0
  },
  methods: {
    linkEl(href) {
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
@import '~assets/variables';
$border: 1px;
$lineHeight: 5;
$fontSize: 1em;

nav {
  --h: #{$lineHeight * $fontSize};
  position: relative;
  border-left: solid $border;
  font-size: $fontSize;
  line-height: $lineHeight;

  &:after {
    position: absolute;
    top: 0;
    left: -$border - 1px;
    width: $border + 2px;
    height: var(--h);
    border-radius: 0.5 * $border + 1px;
    background: $primary;
    transform: translatey(calc(var(--hover) * var(--h)));
    transition: transform 0.3s cubic-bezier(0.2, 0.6, 0.35, 1);
    content: '';
  }

  a {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 0 1em;
    min-width: 10em;
    height: var(--h);
    color: inherit;
    text-transform: uppercase;

    span {
      display: flex;
      align-items: center;
      img {
        width: 1.5rem;
        height: 1.5rem;
        margin-right: 1rem;
      }
    }
  }
}

.current {
  --iscurr: 1;
  font-weight: 600;
}
</style>
