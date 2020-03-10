<template>
  <div id="app">
    <b-navbar type="is-primary">
      <template slot="brand">
        <b-navbar-item tag="div">
          <h4 class="brand title is-4 has-text-white">{{ $t('brand_text') }}</h4>
        </b-navbar-item>
      </template>
      <template slot="start">
        <!-- <b-navbar-item href="#">
          About
        </b-navbar-item> -->
      </template>
      <template slot="end">
        <b-navbar-dropdown right arrowless>
          <template slot="label">
            <span class="is-uppercase">{{ $i18n.locale }}</span>
            <b-icon icon="web"></b-icon>
          </template>
          <b-navbar-item @click="changeLocale('en')">
            English
          </b-navbar-item>
          <b-navbar-item @click="changeLocale('et')">
            Eesti
          </b-navbar-item>
        </b-navbar-dropdown>
      </template>
    </b-navbar>
    <div class="container">
      <Home />
    </div>
  </div>
</template>
<script>
import Home from './components/Home.vue';

export default {
  name: 'app',
  components: {
    Home
  },

  methods: {
    changeLocale(locale) {
      this.$i18n.locale = locale;
    }
  }
};
</script>
<style lang="scss">
// Import Bulma's core
@import '~bulma/sass/utilities/_all';

// Set your colors
$primary: #3273dc;
$primary-invert: findColorInvert($primary);

// Setup $colors to use as bulma classes (e.g. 'is-twitter')
$colors: (
  'white': (
    $white,
    $black
  ),
  'black': (
    $black,
    $white
  ),
  'light': (
    $light,
    $light-invert
  ),
  'dark': (
    $dark,
    $dark-invert
  ),
  'primary': (
    $primary,
    $primary-invert
  ),
  'info': (
    $info,
    $info-invert
  ),
  'success': (
    $success,
    $success-invert
  ),
  'warning': (
    $warning,
    $warning-invert
  ),
  'danger': (
    $danger,
    $danger-invert
  )
);

// Links
$link: $primary;
$link-invert: $primary-invert;
$link-focus-border: $primary;

// Import Bulma and Buefy styles
@import '~bulma';
@import '~buefy/src/scss/buefy';

.brand {
  font-family: 'Dancing Script', cursive;
}
</style>