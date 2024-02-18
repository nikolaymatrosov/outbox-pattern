output "function_id" {
  value = yandex_function.orders-db-function.id
}

output "gateway_url" {
  value = yandex_api_gateway.api_gateway.domain
}

output "rest_env" {
  value = {
    cdc = {
      host = yandex_api_gateway.api_gateway.domain
    }
  }
}
