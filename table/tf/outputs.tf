output "function_id" {
  value = yandex_function.orders-db-function.id
}

output "gateway_url" {
  value = yandex_api_gateway.api_gateway.domain
}
