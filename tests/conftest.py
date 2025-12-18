from pathlib import Path
import sys

# Ensure src is on path so we can import app
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from app import app as fastapi_app
from fastapi.testclient import TestClient
import pytest


@pytest.fixture
def client():
    return TestClient(fastapi_app)
