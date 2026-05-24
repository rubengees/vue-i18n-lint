import { useI18n } from "vue-i18n"

const i18n = useI18n()
const key = "dynamic"

// Template literal with one interpolation
const a = i18n.t(`a.b.${key}.c`)

// String concatenation
const b = i18n.t("prefix." + key + ".suffix")

// Template literal at the start
const c = i18n.t(`${key}.end`)

// Template literal at the end
const d = i18n.t(`start.${key}`)

// Multiple interpolations
const e = i18n.t(`${key}.middle.${key}`)
