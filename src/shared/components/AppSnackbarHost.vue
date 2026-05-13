<script setup>
import { storeToRefs } from 'pinia'
import { useSnackbarStore } from '~/stores/snackbar'

const store = useSnackbarStore()
const { items } = storeToRefs(store)
</script>

<template>
  <div class="snackbar-host">
    <v-snackbar
      v-for="item in items"
      :key="item.id"
      :model-value="item.visible"
      :color="item.color"
      :timeout="item.timeout"
      location="top right"
      variant="elevated"
      @update:model-value="(v) => !v && store.dismiss(item.id)"
    >
      {{ item.message }}
    </v-snackbar>
  </div>
</template>
