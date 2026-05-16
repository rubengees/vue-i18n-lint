<script setup lang="ts">
const isActive = true
</script>

<template>
  <span
    :style="{
      background: isActive ? 'white' : 'grey',
      color: isActive ? 'red' : 'white',
    }"
    >{{ $t("label") }}</span
  >
  <button :aria-label="isActive ? $t('active') : $t('inactive')" />
</template>
