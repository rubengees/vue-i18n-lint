import { useI18n } from "vue-i18n"

const { t } = useI18n()

const type = "active"

t(`status.${type}`)
t(`color.${type}`)
