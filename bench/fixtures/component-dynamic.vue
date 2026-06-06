<template>
  <div>
    <div>
      <div>
        <div>
          <span>{{ $t(`a.${type}`) }}</span>
        </div>
      </div>
    </div>
  </div>
  <div v-for="n in 10">
    <div v-if="n == 5">
      <div v-for="n in 10">
        <div v-if="n == 5">
          <span>{{ $te(`b.${status}`) }}</span>
        </div>
      </div>
    </div>
  </div>
  <span>{{ $t(`c.${type}.label`) }}</span>
  <span :title="$t(`d.${status}`)"></span>
  <span v-if="$te(`e.${type}`)"></span>
  <span v-for="k in $t(`f.${status}`)">
    <span>{{ k }} {{ $t(`g.${type}`) }}</span>
  </span>
  <span @click="$t(`h.${status}`)"></span>
  <span>{{ $t("i." + type + ".label") }}</span>
  <span>{{ $t(`j.${"x." + status}.k`) }}</span>
  <span>{{ $t(type === "active" ? `l.${status}` : "l.default") }}</span>
  <span>{{ $t(`m.${type}` + "." + `n.${status}`) }}</span>
  <span>{{ $t(status === "enabled" ? "o.on" : `o.${type}`) }}</span>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n"

const i18n = useI18n()
const type = "active"
const status = "enabled"

const a = i18n.t(`a.${type}`)

const p = i18n.t("p." + type + ".label")
const q = i18n.t(`q.${"x." + status}.r`)
const s = i18n.t(type === "active" ? `s.${status}` : "s.default")
const u = i18n.t(`u.${type}` + "." + `v.${status}`)

function one() {
  return function two() {
    function three() {
      function four() {
        function five() {
          return i18n.t(`d.${status}`)
        }
      }
    }
  }
}
</script>
