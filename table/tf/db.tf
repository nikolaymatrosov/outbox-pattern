resource "yandex_ydb_database_serverless" "db" {
  name      = "${local.prefix}db"
  folder_id = var.folder_id
}
// Orders Service Tables
resource "yandex_ydb_table" "orders" {
  depends_on        = [yandex_ydb_database_serverless.db]
  path              = "orders/orders"
  connection_string = resource.yandex_ydb_database_serverless.db.ydb_full_endpoint

  column {
    name = "order_id"
    type = "Utf8"
  }

  column {
    name = "customer_id"
    type = "Utf8"
  }
  column {
    name = "order_date"
    type = "Timestamp"
  }
  column {
    name = "order_items"
    type = "JsonDocument"
  }

  primary_key = [
    "order_id",
  ]
}

resource "yandex_ydb_table" "outbox" {
  depends_on        = [yandex_ydb_database_serverless.db]
  path              = "orders/outbox"
  connection_string = resource.yandex_ydb_database_serverless.db.ydb_full_endpoint

  column {
    name = "message_id"
    type = "Utf8"
  }
  column {
    name = "message"
    type = "JsonDocument"
  }
  column {
    name = "created"
    type = "Timestamp"
  }
  primary_key = [
    "message_id",
  ]
}

// Payments Service Tables
// In production, you would likely have a separate database for each service
resource "yandex_ydb_table" "payments" {
  depends_on        = [yandex_ydb_database_serverless.db]
  path              = "payments/payments"
  connection_string = resource.yandex_ydb_database_serverless.db.ydb_full_endpoint

  column {
    name = "payment_id"
    type = "Utf8"
  }
  column {
    name = "order_id"
    type = "Utf8"
  }
  column {
    name = "amount"
    type = "Uint64"
  }
  column {
    name = "payment_date"
    type = "Timestamp"
  }
  primary_key = [
    "payment_id",
  ]
}

resource "yandex_ydb_table" "inbox" {
  depends_on        = [yandex_ydb_database_serverless.db]
  path              = "payments/inbox"
  connection_string = resource.yandex_ydb_database_serverless.db.ydb_full_endpoint

  column {
    name = "message_id"
    type = "Utf8"
  }
  column {
    name = "message"
    type = "JsonDocument"
  }
  column {
    name = "created_at"
    type = "Timestamp"
  }
  column {
    name = "processed_at"
    type = "Timestamp"
  }
  primary_key = [
    "message_id",
  ]
}

