export default {
  "*.{ts,js,vue}": ["oxfmt", "oxlint --fix"] as const,
  "*.ts": () => "tsgo --noEmit",
}
