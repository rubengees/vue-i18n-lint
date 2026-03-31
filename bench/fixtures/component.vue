<template>
  <div>
    <div>
      <div>
        <div>
          <span>{{ $t("a") }}</span>
        </div>
      </div>
    </div>
  </div>
  <div v-for="n in 10">
    <div v-if="n == 5">
      <div v-for="n in 10">
        <div v-if="n == 5">
          <span>{{ $te("b") }}</span>
        </div>
      </div>
    </div>
  </div>
  <span>{{ $tm("c") }}</span>
  <span>{{ "x" + $t("d") + `x${$t("e")}x` }}</span>
  <span>{{ $t("f") }} + {{ $t("g") }}</span>
  <span :title="$t('h')"></span>
  <span v-if="$te('i')"></span>
  <span v-else-if="$te('j')"></span>
  <span v-for="k in $t('k')">
    <span>{{ k }} {{ $t("l") }}</span>
  </span>
  <span @click="$t('m')"></span>
  <i18n-t keypath="keypath" />
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n"

const i18n = useI18n()

const a = i18n.t("a")

function one() {
  return function two() {
    function three() {
      function four() {
        function five() {
          return i18n.t("d")
        }
      }
    }
  }
}
</script>
