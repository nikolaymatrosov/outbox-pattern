resource "yandex_iam_service_account" "ymq_creator" {
  name      = "${local.prefix}ymq-creator"
  folder_id = var.folder_id
}

resource "yandex_resourcemanager_folder_iam_binding" "sa_ymq_creator" {
  for_each = toset([
    "ymq.admin", // To create and manage YMQ queues
  ])
  role      = each.value
  folder_id = var.folder_id
  members   = [
    "serviceAccount:${yandex_iam_service_account.ymq_creator.id}",
  ]
  sleep_after = 5
}

resource "yandex_iam_service_account_static_access_key" "ymq_creator" {
  service_account_id = yandex_iam_service_account.ymq_creator.id
}


resource "yandex_iam_service_account" "trigger_sa" {
  name      = "${local.prefix}ymq-trigger-sa"
  folder_id = var.folder_id
}

resource "yandex_resourcemanager_folder_iam_binding" "trigger_sa" {
  for_each = toset([
    "ymq.reader", // To read messages from YMQ
    "ymq.writer", // To write messages to DLQ
    "yds.editor", // To read messages from YDS CDC
    "functions.functionInvoker" // To invoke functions
  ])
  role      = each.value
  folder_id = var.folder_id
  members   = [
    "serviceAccount:${yandex_iam_service_account.trigger_sa.id}",
  ]
}

resource "yandex_iam_service_account" "orders_sa" {
  name      = "${local.prefix}orders-sa"
  folder_id = var.folder_id
}

resource "yandex_resourcemanager_folder_iam_binding" "orders_sa" {
  for_each = toset([
    "ydb.editor", // To read outbox from YDB
  ])
  role      = each.value
  folder_id = var.folder_id
  members   = [
    "serviceAccount:${yandex_iam_service_account.orders_sa.id}",
  ]
  sleep_after = 5
}


resource "yandex_iam_service_account" "outbox_reader" {
  name        = "${local.prefix}outbox-reader"
  description = "Service account for service that read outbox messages from YDB and write them to YMQ."
  folder_id   = var.folder_id
}

resource "yandex_resourcemanager_folder_iam_binding" "outbox_reader" {
  for_each = toset([
    "lockbox.payloadViewer", // To access secrets in lockbox
    "ymq.writer", // To write outbox messages to YMQ
    "ydb.editor", // To read outbox from YDB
  ])
  role      = each.value
  folder_id = var.folder_id
  members   = [
    "serviceAccount:${yandex_iam_service_account.outbox_reader.id}",
  ]
  sleep_after = 5
}

resource "yandex_iam_service_account_static_access_key" "outbox_reader" {
  service_account_id = yandex_iam_service_account.ymq_creator.id
}

resource "yandex_iam_service_account" "api_invoker" {
  name      = "api-invoker"
  folder_id = var.folder_id
}

resource "yandex_resourcemanager_folder_iam_binding" "api_invoker" {
  for_each = toset([
    "serverless.functions.invoker",
  ])
  role      = each.value
  folder_id = var.folder_id
  members   = [
    "serviceAccount:${yandex_iam_service_account.api_invoker.id}",
  ]
}

resource "yandex_iam_service_account" "payments_sa" {
  name      = "${local.prefix}payments-sa"
  folder_id = var.folder_id
}

resource "yandex_resourcemanager_folder_iam_binding" "payments_sa" {
  for_each = toset([
    "ydb.editor", // To read outbox from YDB
  ])
  role      = each.value
  folder_id = var.folder_id
  members   = [
    "serviceAccount:${yandex_iam_service_account.payments_sa.id}",
  ]
  sleep_after = 5
}
