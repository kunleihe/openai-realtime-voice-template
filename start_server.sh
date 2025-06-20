#!/bin/bash
uvicorn app.main:app --reload --reload-dir app --reload-dir client 