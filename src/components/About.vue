<template>
  <section class="section">
    <div class="container">
      <h4 class="title is-4">{{ $t('about_title') }}</h4>
      <p>
        {{ $t('text.about') }}
      </p>
      <p class="currently-supported-languages">
        {{ $t('currently_supported_languages') }}:
      </p>
      <div>
        <ol>
          <li v-for="language in availableLanguagesTranslated" :key="language">{{ language }}</li>
        </ol>
      </div>
    </div>
  </section>
</template>

<script>
import axios from 'axios';

export default {
  name: 'About',

  data() {
    return {
      availableLanguages: []
    };
  },

  created() {
    this.loadAvailableLanguages();
  },

  computed: {
    availableLanguagesTranslated() {
      let result = [];
      let field = 'name';

      if (this.$i18n.locale === 'et') field = 'etName';

      this.availableLanguages.forEach(language => {
        if (field in language) result.push(this.formatEtLang(language[field]));
        else result.push(this.formatEtLang(language['name']));
      });

      return result.sort();
    }
  },

  methods: {
    loadAvailableLanguages() {
      axios
        .get(process.env.VUE_APP_API_URL + '/api/languages')
        .then(response => {
          this.availableLanguages = response.data;
        });
    },

    formatEtLang(languageName) {
      return languageName.replace('keel', '').trim();
    }
  }
};
</script>
<style scoped>
ol, ul {
    -webkit-column-count: 3; -webkit-column-gap:20px;
    -moz-column-count:3; -moz-column-gap:20px;
    -o-column-count: 3; -o-column-gap:20px;
    column-count: 3; column-gap:20px;
    list-style-position: inside;
}

.currently-supported-languages {
  margin-top: 10px;
}
</style>