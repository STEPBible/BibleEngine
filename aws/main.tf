terraform {
  required_providers {
    aws = "~> 2.49"
  }
  backend "s3" {
    bucket = "bible-engine-terraform-state"
    key    = "terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  shared_credentials_file = "~/.aws/credentials"
  region                  = "us-east-1"
}

resource "aws_vpc" "main" {
  cidr_block = "10.1.0.0/16"
  tags = {
    Name = "BibleEngine VPC"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
}

resource "aws_route_table" "main" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
}

resource "aws_route_table_association" "databases_zone_1" {
  subnet_id      = aws_subnet.databases_zone_1.id
  route_table_id = aws_route_table.main.id
}

resource "aws_route_table_association" "databases_zone_2" {
  subnet_id      = aws_subnet.databases_zone_2.id
  route_table_id = aws_route_table.main.id
}

resource "aws_route_table_association" "servers" {
  subnet_id      = aws_subnet.servers.id
  route_table_id = aws_route_table.main.id
}

resource "aws_subnet" "databases_zone_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.1.1.0/24"
  availability_zone = "us-east-1a"
  tags = {
    Name = "Databases Zone 1"
  }
}

resource "aws_subnet" "databases_zone_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.1.2.0/24"
  availability_zone = "us-east-1b"
  tags = {
    Name = "Databases Zone 2"
  }
}

resource "aws_subnet" "servers" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.1.0.0/24"
  availability_zone = "us-east-1a"
  tags = {
    Name = "Servers"
  }
}

resource "aws_network_acl" "allowall" {
  vpc_id = aws_vpc.main.id

  egress {
    protocol   = "-1"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  ingress {
    protocol   = "-1"
    rule_no    = 200
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }
}

resource "aws_security_group" "allowall" {
  name   = "Allow All"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_api_gateway_rest_api" "main" {
  name = "BibleEngineGateway"
}

resource "aws_api_gateway_resource" "proxy" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "proxy" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.proxy.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "lambda" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_method.proxy.resource_id
  http_method = aws_api_gateway_method.proxy.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.main.invoke_arn
}

resource "aws_api_gateway_method" "proxy_root" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_rest_api.main.root_resource_id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "lambda_root" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_method.proxy_root.resource_id
  http_method = aws_api_gateway_method.proxy_root.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.main.invoke_arn
}

resource "aws_api_gateway_deployment" "main" {
  depends_on = [
    aws_api_gateway_integration.lambda,
    aws_api_gateway_integration.lambda_root,
  ]

  rest_api_id = aws_api_gateway_rest_api.main.id
  stage_name  = "test"
}

resource "aws_lambda_function" "main" {
  function_name = "BibleEngine"
  s3_bucket     = "bibleengine-lambda-prod-deployments"
  s3_key        = "v1.0.1/example.zip"

  # "main" is the filename within the zip file (main.js) and "handler"
  # is the name of the property under which the handler function was
  # exported in that file.
  handler = "main.handler"
  runtime = "nodejs10.x"

  role = aws_iam_role.lambda.arn

  vpc_config {
    subnet_ids         = [aws_subnet.servers.id]
    security_group_ids = [aws_security_group.allowall.id]
  }

  environment {
    variables = {
      DATABASE_URL = aws_rds_cluster.database.endpoint
    }
  }
}

resource "aws_iam_role" "lambda" {
  name               = "lambda"
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}

data "aws_iam_policy_document" "assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_policy" "network" {
  name   = "vpc_network_access"
  policy = data.aws_iam_policy_document.network.json
}

data "aws_iam_policy_document" "network" {
  statement {
    effect = "Allow"
    actions = [
      "ec2:CreateNetworkInterface",
      "ec2:DescribeNetworkInterfaces",
      "ec2:DeleteNetworkInterface",
    ]
    resources = [
      "*",
    ]
  }
}

resource "aws_iam_policy_attachment" "network" {
  name       = "network_attachment_policy"
  roles      = [aws_iam_role.lambda.name]
  policy_arn = aws_iam_policy.network.arn
}

resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.main.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "allow_api_gateway" {
  statement_id  = "AllowExecutionFromApiGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.main.function_name
  principal     = "apigateway.amazonaws.com"
  depends_on    = [aws_api_gateway_rest_api.main, aws_api_gateway_resource.proxy]
}

output "api_base_url" {
  value = aws_api_gateway_deployment.main.invoke_url
}

resource "aws_db_subnet_group" "main" {
  name       = "main"
  subnet_ids = [aws_subnet.databases_zone_1.id, aws_subnet.databases_zone_2.id]
}

resource "aws_rds_cluster" "database" {
  availability_zones = ["us-east-1a", "us-east-1b"]

  engine         = "aurora"
  engine_version = "5.6.10a"
  engine_mode    = "serverless"

  database_name           = "bibleengine"
  master_username         = "root"
  master_password         = "password"
  db_subnet_group_name    = aws_db_subnet_group.main.name
  vpc_security_group_ids  = [aws_security_group.allowall.id]
  backup_retention_period = 5
  port                    = 3306

  scaling_configuration {
    auto_pause               = true
    max_capacity             = 8
    min_capacity             = 1
    seconds_until_auto_pause = 300
    timeout_action           = "ForceApplyCapacityChange"
  }

  lifecycle {
    create_before_destroy = true
  }
}
