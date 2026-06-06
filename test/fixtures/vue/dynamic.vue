<script setup lang="ts">
import { useI18n } from "vue-i18n"

const { t } = useI18n()

const test = "xyz"

const title = t(`a.b.${test}.d`)
const title1 = t(`a.b${test}.d`)
const title2 = t(`a.b.${test}d`)
const title3 = t(`${test}`)

const title4 = t("u.b." + test + ".d")
const title5 = t("u.b" + test + ".d")
const title6 = t("u.b." + test + "d")
const title7 = t(test)

const title8 = t(`x.${test}${test}y` + `x.${"y" + ".z" + `a.${test}`}.b` + test)
</script>

<template>
  <span>{{ $t(`${test}.t.b.${test}${test}.d.${test}`) }}</span>
  <span>{{ $t(test) }}</span>
  <span>{{ $t("s.b." + test + ".d") }}</span>
  <span>{{ $t(test ? `n${test}` : "b" + ".c." + false + 42) }}</span>
</template>
