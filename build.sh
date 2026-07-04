#!/usr/bin/env bash
# Render build script. Configure this as the Build Command in the Render
# dashboard (or Render will pick it up automatically if using render.yaml).
set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --no-input

python manage.py migrate
