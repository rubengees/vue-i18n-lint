export default {
  "*": "oxfmt --no-error-on-unmatched-pattern",
  "*.{ts,js,vue}": "oxlint --fix",
  "*.ts": () => "tsgo --noEmit",
}
