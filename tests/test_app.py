from copy import deepcopy
from urllib.parse import quote

import pytest
from fastapi.testclient import TestClient

from src import app as app_module


@pytest.fixture
def client():
    # snapshot activities and restore after test to keep tests isolated
    original = deepcopy(app_module.activities)
    client = TestClient(app_module.app)
    yield client
    app_module.activities.clear()
    app_module.activities.update(original)


def test_get_activities(client):
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    assert "Basketball" in data


def test_signup_and_prevent_duplicate(client):
    activity = "Chess Club"
    email = "tester@example.com"

    # signup should succeed
    resp = client.post(f"/activities/{quote(activity)}/signup", params={"email": email})
    assert resp.status_code == 200
    assert email in client.get("/activities").json()[activity]["participants"]

    # duplicate signup should be rejected
    resp2 = client.post(f"/activities/{quote(activity)}/signup", params={"email": email})
    assert resp2.status_code == 400


def test_remove_participant(client):
    activity = "Art Studio"
    email = "remove-me@example.com"

    # ensure participant exists by signing up
    r = client.post(f"/activities/{quote(activity)}/signup", params={"email": email})
    assert r.status_code == 200
    assert email in client.get("/activities").json()[activity]["participants"]

    # remove participant
    r2 = client.delete(f"/activities/{quote(activity)}/participants", params={"email": email})
    assert r2.status_code == 200
    assert email not in client.get("/activities").json()[activity]["participants"]
