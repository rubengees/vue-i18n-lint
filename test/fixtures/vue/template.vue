<template>
  <span>{{ $t("a") }}</span>
  <span>{{ $te("b") }}</span>
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
