// @ts-nocheck
import VueCompositionApi from '@vue/composition-api';
import { boot } from 'quasar/wrappers';
import VueTippy, { TippyComponent } from 'vue-tippy';


export default boot(({ Vue }) => {
  Vue.use(VueCompositionApi);
  Vue.use(VueTippy);
  Vue.component('tippy', TippyComponent);
});
