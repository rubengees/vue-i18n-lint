import { useI18n } from "vue-i18n"

const i18n = useI18n()

const a = i18n.t("a")
const b = i18n.te("b")
const c = i18n.tm("c")

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

  const e = i18n.tm("e")
}

if (true) {
  if (true) {
    if (true) {
      if (true) {
        const f = i18n.t("f")
      }
    } else {
      const g = i18n.t("f")
    }
  }
}
