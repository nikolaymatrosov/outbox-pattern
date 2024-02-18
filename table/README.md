# Outbox Pattern example using YDB table and message queue

To deploy this project, you will need to install the following programs:

- [Terraform](https://www.terraform.io/downloads.html) 1.5.7
- [Yandex.Cloud CLI](https://cloud.yandex.com/en/docs/cli/operations/install-cli) optionaly if you want to generate IAM
  token conveniently.

## Deploying the project

1. Clone the repository
2. Run `terraform -chdir=tf init` to initialize the project
3. Set environment variables: cloud id, folder id, and YC_TOKEN, where:
    - `cloud_id` and `folder_id` are the identifiers of the Yandex.Cloud
    - `YC_TOKEN` is either
      a [Yandex.Cloud IAM token](https://cloud.yandex.com/en/docs/iam/concepts/authorization/iam-token) or a
      [Yandex.Cloud OAuth token](https://cloud.yandex.com/en/docs/iam/concepts/authorization/oauth-token)

```bash
export TF_VAR_cloud_id=b1g************
export TF_VAR_folder_id=b1g************
export YC_TOKEN=AgAAAA
```

4. Run `terraform -chdir=tf apply` to deploy the project
5. Run `terraform -chdir=tf output -json rest_env > http-client.env.json` to fill the `http-client.env.json` file with
   the environment variables needed to run requests from Jetbrains' HTTP Client from `requests.http` file.
   Select `table` as environment value.
6. Run `terraform -chdir=tf destroy` to destroy the project
