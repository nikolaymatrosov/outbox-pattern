terraform {
  backend "local" {
    path = "../environment/terraform.tfstate"
  }
  required_providers {
    yandex = {
      source = "yandex-cloud/yandex"
    }
    null = {
      source = "hashicorp/null"
    }
  }
  required_version = ">= 1.5, < 1.6.0"
}

provider "yandex" {
  cloud_id  = var.cloud_id
  folder_id = var.folder_id
  zone      = var.zone
}
