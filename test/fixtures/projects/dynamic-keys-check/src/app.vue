<template>
  <span>{{ $t("not." + "dynamic") }}</span>
  <span>{{ $t("deep." + `dy${'na' + `mic${test}`}`) }}</span>
</template>

<script setup lang="ts">
const test = "test"
</script>