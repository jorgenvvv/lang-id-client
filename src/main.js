import Vue from 'vue'
import App from './App.vue'
import Buefy from 'buefy';
import VueI18n from 'vue-i18n';

import { messages } from './i18n';

Vue.config.productionTip = false

Vue.use(Buefy);
Vue.use(VueI18n);

const availableLocales = ['en', 'et'];
const preferredLanguage = navigator.language;

let locale = 'en';
if (availableLocales.includes(preferredLanguage))
  locale = preferredLanguage;

const i18n = new VueI18n({
  locale: locale,
  fallbackLocale: 'en',
  messages
});

new Vue({
  i18n,
  render: h => h(App),
}).$mount('#app')
