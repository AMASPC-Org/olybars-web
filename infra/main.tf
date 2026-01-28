# OlyBars Infrastructure Management
# Project Constitution Rule: Use us-west1 for all resources.

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
  }
}

provider "google" {
  project = "ama-ecosystem-prod"
  region  = "us-west1"
}

# Cloud Run Service for the Backend
resource "google_cloud_run_v2_service" "backend" {
  name     = "olybars-backend"
  location = "us-west1"
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    containers {
      image = "us-west1-docker.pkg.dev/ama-ecosystem-prod/olybars/backend:latest"
      
      env {
        name  = "GOOGLE_CLOUD_PROJECT"
        value = "ama-ecosystem-prod"
      }
      
      # OWNER_PIN and GEMINI_API_KEY should be set via Secrets Manager in production.
      # This is a scaffold.
    }
  }
}

# Firestore is typically managed via the Google Cloud Console or gcloud for simple setups,
# but can be added here if full IaC is desired.

# --- BREW HOUSE SCRAPER INFRASTRUCTURE ---

# 1. Cloud Tasks Queue
resource "google_cloud_tasks_queue" "default" {
  name     = "brew-house-worker"
  location = "us-west1"

  rate_limits {
    max_dispatches_per_second = 10
    max_concurrent_dispatches = 5
  }

  retry_config {
    max_attempts       = 5
    max_retry_duration = "3600s" # 1 hour
    min_backoff        = "5s"
    max_backoff        = "300s"
    max_doublings      = 4
  }
}

# Data source for default SA
data "google_compute_default_service_account" "default" {
}

# 2. Cloud Scheduler Job (Tick)
resource "google_cloud_scheduler_job" "scraper_tick" {
  name             = "scraper-tick-job"
  description      = "Triggers the OlyBars Scraper Scheduler every 15 minutes"
  schedule         = "*/15 * * * *"
  time_zone        = "America/Los_Angeles"
  attempt_deadline = "320s"

  retry_config {
    retry_count = 1
  }

  http_target {
    http_method = "GET"
    uri         = "${google_cloud_run_v2_service.backend.uri}/internal/scheduler/tick"

    oidc_token {
      service_account_email = data.google_compute_default_service_account.default.email
    }
  }
}

# 3. Dead Letter Queue (DLQ) Topic
resource "google_pubsub_topic" "scraper_dlq" {
  name = "scraper-dlq"
}

# 4. IAM Bindings for Internal Invocation
# Allow the Default Compute SA (used by Scheduler & Tasks) to invoke the Backend Service
resource "google_cloud_run_v2_service_iam_binding" "invoker" {
  project  = google_cloud_run_v2_service.backend.project
  location = google_cloud_run_v2_service.backend.location
  name     = google_cloud_run_v2_service.backend.name
  role     = "roles/run.invoker"

  members = [
    "serviceAccount:${data.google_compute_default_service_account.default.email}"
  ]
}
