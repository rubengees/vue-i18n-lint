import { useI18n } from "vue-i18n"

const { t } = useI18n()

const type = "active"
const key = "some.key"

t(`not.dynamic`)
t(`status.${type}`)
t("a." + key)
t(type)
t(`${type}${key}`)