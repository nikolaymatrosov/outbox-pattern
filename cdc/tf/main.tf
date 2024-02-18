resource "null_resource" "build_typescript" {
  provisioner "local-exec" {
    command = "cd ../ && npm run build"
  }
  triggers = {
    always_run = timestamp()
  }
}

data "archive_file" "function_files" {
  output_path = "./function.zip"
  source_dir  = "../build"
  type        = "zip"
  depends_on  = [
    null_resource.build_typescript
  ]
}

resource "yandex_function" "orders-db-function" {
  name              = "${local.prefix}orders"
  user_hash         = data.archive_file.function_files.output_sha256
  runtime           = "nodejs18"
  entrypoint        = "orders/app/app.handler"
  memory            = "128"
  execution_timeout = "10"
  content {
    zip_filename = data.archive_file.function_files.output_path
  }

  environment = {
    YDB_ENDPOINT = yandex_ydb_database_serverless.db.ydb_api_endpoint
    YDB_DATABASE = yandex_ydb_database_serverless.db.database_path
  }
  service_account_id = yandex_iam_service_account.orders_sa.id

  depends_on = [
    yandex_ydb_database_serverless.db,
  ]
}


resource "yandex_function" "outbox-emitter" {
  name              = "${local.prefix}emitter"
  user_hash         = data.archive_file.function_files.output_sha256
  runtime           = "nodejs18"
  entrypoint        = "orders/emitter/index.handler"
  memory            = "128"
  execution_timeout = "10"
  content {
    zip_filename = data.archive_file.function_files.output_path
  }
  secrets {
    id                   = yandex_lockbox_secret.db-keys.id
    version_id           = yandex_lockbox_secret_version.db-keys.id
    key                  = "AWS_ACCESS_KEY_ID"
    environment_variable = "AWS_ACCESS_KEY_ID"
  }
  secrets {
    id                   = yandex_lockbox_secret.db-keys.id
    version_id           = yandex_lockbox_secret_version.db-keys.id
    key                  = "AWS_SECRET_ACCESS_KEY"
    environment_variable = "AWS_SECRET_ACCESS_KEY"
  }
  environment = {
    YDB_ENDPOINT = yandex_ydb_database_serverless.db.ydb_api_endpoint
    YDB_DATABASE = yandex_ydb_database_serverless.db.database_path
    YMQ_NAME     = yandex_message_queue.outbox.name
  }
  service_account_id = yandex_iam_service_account.outbox_reader.id

  depends_on = [
    yandex_lockbox_secret.db-keys,
    yandex_lockbox_secret_version.db-keys,
    yandex_ydb_database_serverless.db,
    yandex_iam_service_account.outbox_reader,
    yandex_resourcemanager_folder_iam_binding.outbox_reader,
  ]
}

resource "yandex_function_trigger" "yds_trigger" {
  name = "${local.prefix}yds-trigger"

  data_streams {
    stream_name = "orders/outbox/changefeed"
    service_account_id = yandex_iam_service_account.trigger_sa.id
    batch_cutoff = "1"
    database = yandex_ydb_database_serverless.db.database_path
  }
  function {
    id                 = yandex_function.outbox-emitter.id
    service_account_id = yandex_iam_service_account.trigger_sa.id
  }
}

resource "yandex_function" "payments" {
  name              = "${local.prefix}payments"
  user_hash         = data.archive_file.function_files.output_sha256
  runtime           = "nodejs18"
  entrypoint        = "payments/index.handler"
  memory            = "128"
  execution_timeout = "10"
  content {
    zip_filename = data.archive_file.function_files.output_path
  }

  environment = {
    YDB_ENDPOINT = yandex_ydb_database_serverless.db.ydb_api_endpoint
    YDB_DATABASE = yandex_ydb_database_serverless.db.database_path
  }
  service_account_id = yandex_iam_service_account.orders_sa.id

  depends_on = [
    yandex_ydb_database_serverless.db,
  ]
}


resource "yandex_function_trigger" "ymq_trigger" {
  name        = "${local.prefix}payments-ymq-trigger"

  message_queue {
    queue_id = yandex_message_queue.outbox.arn
    batch_cutoff = "1"
    batch_size = "1"
    service_account_id = yandex_iam_service_account.trigger_sa.id
  }
  function {
    id = yandex_function.payments.id
    service_account_id = yandex_iam_service_account.trigger_sa.id
  }
}
