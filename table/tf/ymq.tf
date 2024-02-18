resource "yandex_message_queue" "outbox" {
  name                       = "outbox"
  visibility_timeout_seconds = 600
  receive_wait_time_seconds  = 20
  message_retention_seconds  = 1209600
  redrive_policy             = jsonencode({
    deadLetterTargetArn = yandex_message_queue.outbox_dlq.arn
    maxReceiveCount     = 3
  })
  access_key = yandex_iam_service_account_static_access_key.ymq_creator.access_key
  secret_key = yandex_iam_service_account_static_access_key.ymq_creator.secret_key
}

resource "yandex_message_queue" "outbox_dlq" {
  name       = "outbox_dlq"
  access_key = yandex_iam_service_account_static_access_key.ymq_creator.access_key
  secret_key = yandex_iam_service_account_static_access_key.ymq_creator.secret_key
}
