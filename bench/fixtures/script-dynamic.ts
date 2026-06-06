import { useI18n } from "vue-i18n"

const i18n = useI18n()
const type = "active"
const status = "enabled"

const a = i18n.t(`a.${type}`)
const b = i18n.te(`b.${status}`)
const c = i18n.tm(`c.${type}`)

const d = i18n.t("d." + type + ".label")
const e = i18n.t(`e.${"x." + status}.f`)
const g = i18n.t(type === "active" ? `g.${status}` : "g.default")
const h = i18n.t(`h.${type}` + "." + `i.${status}`)
const j = i18n.t(status === "enabled" ? "j.on" : `j.${type}`)

function one() {
  return function two() {
    function three() {
      function four() {
        function five() {
          return i18n.t(`k.${status}`)
        }
      }
    }
  }

  const l = i18n.tm(`l.${type}`)
}

if (true) {
  if (true) {
    if (true) {
      if (true) {
        const m = i18n.t("m." + type + "." + `n.${status}`)
      }
    } else {
      const o = i18n.t(type === "active" ? `o.${status}.label` : `o.${type}`)
    }
  }
}
