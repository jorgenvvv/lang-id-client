<template>
  <div id="app">
    <b-navbar type="is-primary">
      <template slot="brand">
        <b-navbar-item tag="router-link" to="/">
          <span class="brand title is-5 has-text-white">{{ $t('brand_text') }}</span>
        </b-navbar-item>
      </template>
      <template slot="start">
        <b-navbar-item tag="router-link" to="/about">
          {{ $t('about') }}
        </b-navbar-item>
      </template>
      <template slot="end">
        <b-navbar-dropdown right>
          <template slot="label">
            <span class="is-uppercase">{{ $i18n.locale }}</span>
          </template>
          <b-navbar-item @click="changeLocale('et')">
            Eesti
          </b-navbar-item>
          <b-navbar-item @click="changeLocale('en')">
            English
          </b-navbar-item>
        </b-navbar-dropdown>
      </template>
    </b-navbar>
    <div class="container">
      <router-view></router-view>
    </div>
  </div>
</template>
<script>

export default {
  name: 'app',

  created() {
    document.title = this.$t('app_title');
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

$navbar-breakpoint: $tablet;

// Import Bulma and Buefy styles
@import '~bulma';
@import '~buefy/src/scss/buefy';

.brand {
  font-family: 'Graduate', 'Segoe UI', cursive;
}
</style>