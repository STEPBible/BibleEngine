<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Home: Home: {{ range }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Home: {{ range }}</ion-title>
        </ion-toolbar>
      </ion-header>
    </ion-content>
  </ion-page>
</template>
<script>
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
} from '@ionic/vue'
import { useBibleEngine } from '../composables/useBibleEngine'

export default {
  name: 'Tab1',
  components: {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonPage,
  },
  data: () => ({
    range: 'default value, folks',
  }),
  async mounted() {
    const { range } = await useBibleEngine()
    this.range = range
  },
}
</script>