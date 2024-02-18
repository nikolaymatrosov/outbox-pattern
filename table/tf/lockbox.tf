resource "yandex_lockbox_secret" "db-keys" {
  name = "Database Access and Secret Keys"
}

resource "yandex_lockbox_secret_version" "db-keys" {
  secret_id = yandex_lockbox_secret.db-keys.id
  entries {
    key        = "AWS_ACCESS_KEY_ID"
    text_value = yandex_iam_service_account_static_access_key.outbox_reader.access_key
  }
  entries {
    key        = "AWS_SECRET_ACCESS_KEY"
    text_value = yandex_iam_service_account_static_access_key.outbox_reader.secret_key
  }
}
