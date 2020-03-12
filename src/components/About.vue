<template>
  <section class="section">
    <div class="container">
      <h4 class="title is-4">{{ $t('about_title') }}</h4>
      <p>
        {{ $t('text.about') }}
      </p>
      <p>
        {{ $t('text.available_languages', { languages: availableLanguagesList }) }}
      </p>
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
    }
  },

  created() {
    this.loadAvailableLanguages();
  },

  computed: {
    availableLanguagesList() {
      let result = [];
      let field = 'name';

      if (this.$i18n.locale === 'et')
        field = 'etName'

      this.availableLanguages.forEach(language => result.push(language[field]));

      return result.join(', ');
    }
  },

  methods: {
    loadAvailableLanguages() {
      axios.get(process.env.VUE_APP_API_URL + '/api/languages')
      .then(response => {
        this.availableLanguages = response.data;
      })
    }
  }
};
</script>