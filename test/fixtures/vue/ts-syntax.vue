<script setup lang="ts">
import { useI18n } from "vue-i18n"

interface Props {
  count: number
}

const props = defineProps<Props>()
const { t } = useI18n()
const label = t("ts-key")
</script>

<template>
  <span>{{ $t("template-key") }}</span>
</template>
