<template>
  <i18n-t class="x" keypath="a" />
  <i18n-t id="y" path="b" />
  <i18n-t :keypath="`c.${status}`" />
  <i18n-t :keypath="status" />
  <i18n-t v-bind:keypath="status" />
  <i18n-t v-bind:keypath="
    bool
      ? 'd'
      : `e.${status}`
  "
  />
</template>

<script setup lang="ts">
const bool = true
const status = "a"
</script>