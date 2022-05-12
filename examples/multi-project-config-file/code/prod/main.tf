provider "aws" {
  region                      = "us-east-1"
  skip_credentials_validation = true
  skip_requesting_account_id  = true
  access_key                  = "mock_access_key"
  secret_key                  = "mock_secret_key"
}

variable "instance_type" {
  type = "string"
}

module "base" {
  source                           = "../modules/example"

  instance_type                    = var.instance_type
  root_block_device_volume_size    = 100
  block_device_volume_size         = 1000
  block_device_iops                = 800

  hello_world_function_memory_size = 1024
}
