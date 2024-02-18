resource "yandex_api_gateway" "api_gateway" {
  name = "orders-api-gateway"
  spec = templatefile("./api-gateway.yaml", {
    orders_function   = yandex_function.orders-db-function.id
    sa_id = yandex_iam_service_account.api_invoker.id
  })
}
