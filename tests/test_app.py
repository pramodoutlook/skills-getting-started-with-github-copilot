import copy

import pytest
from fastapi.testclient import TestClient

from src import app as app_module

client = TestClient(app_module.app)


@pytest.fixture(autouse=True)
def reset_activities():
    """Reset the in-memory activities state before and after each test."""
    original_activities = copy.deepcopy(app_module.activities)
    yield
    app_module.activities = copy.deepcopy(original_activities)


def test_get_activities_returns_activities():
    # Arrange

    # Act
    response = client.get("/activities")

    # Assert
    assert response.status_code == 200
    activities = response.json()
    assert "Chess Club" in activities
    assert "Programming Class" in activities
    assert isinstance(activities["Chess Club"]["participants"], list)


def test_signup_for_activity_adds_participant():
    # Arrange
    activity_name = "Chess Club"
    participant_email = "test.student@mergington.edu"

    # Act
    response = client.post(
        f"/activities/{activity_name}/signup?email={participant_email}"
    )

    # Assert
    assert response.status_code == 200
    assert response.json()["message"] == f"Signed up {participant_email} for {activity_name}"

    second_response = client.get("/activities")
    assert second_response.status_code == 200
    assert participant_email in second_response.json()[activity_name]["participants"]


def test_signup_duplicate_participant_returns_400():
    # Arrange
    activity_name = "Chess Club"
    duplicate_email = "michael@mergington.edu"

    # Act
    response = client.post(
        f"/activities/{activity_name}/signup?email={duplicate_email}"
    )

    # Assert
    assert response.status_code == 400
    assert response.json()["detail"] == "Student is already signed up for this activity"


def test_remove_participant_from_activity():
    # Arrange
    activity_name = "Chess Club"
    participant_email = "michael@mergington.edu"

    # Act
    response = client.delete(
        f"/activities/{activity_name}/participants?email={participant_email}"
    )

    # Assert
    assert response.status_code == 200
    assert response.json()["message"] == f"Removed {participant_email} from {activity_name}"

    second_response = client.get("/activities")
    assert second_response.status_code == 200
    assert participant_email not in second_response.json()[activity_name]["participants"]
