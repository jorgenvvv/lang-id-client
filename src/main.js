import Vue from 'vue'
import App from './App.vue'
import Buefy from 'buefy';
import VueI18n from 'vue-i18n';
import VueRouter from 'vue-router';

import { messages } from './i18n';

import Home from './components/Home';
import About from './components/About';

Vue.config.productionTip = false

Vue.use(Buefy);
Vue.use(VueI18n);
Vue.use(VueRouter);

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

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    { path: '/', component: Home },
    { path: '/about', component: About }
  ]
});

new Vue({
  i18n,
  router,
  render: h => h(App),
}).$mount('#app')
