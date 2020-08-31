<template>
  <q-layout>
    <q-header class="bg-yellow">
      <q-toolbar class="text-primary flex-grow">
        <q-input value="Search Input" clearable borderless>
          <q-btn slot="prepend" flat round dense icon="arrow_back" />
        </q-input>
      </q-toolbar>
    </q-header>
    <q-page-container>
      <div>Search Page</div>
    </q-page-container>
  </q-layout>
</template>
<style scoped>
.q-input {
  width: 100%;
}
</style>
