def test_root_redirect(client):
    resp = client.get("/")
    # app redirects to /static/index.html
    assert resp.status_code in (307, 302, 200)
    if resp.status_code in (307, 302):
        assert resp.headers["location"].endswith("/static/index.html")


def test_get_activities(client):
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    assert "Soccer Team" in data


def test_signup_and_duplicate_and_notfound(client):
    email = "test_student@example.com"
    activity = "Chess Club"

    # Sign up
    resp = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert resp.status_code == 200
    assert "Signed up" in resp.json().get("message", "")

    # Duplicate sign-up should return 400
    resp2 = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert resp2.status_code == 400

    # Cleanup: unregister
    resp3 = client.delete(f"/activities/{activity}/participants", params={"email": email})
    assert resp3.status_code == 200

    # Non-existent activity
    resp4 = client.post("/activities/NopeActivity/signup", params={"email": email})
    assert resp4.status_code == 404


def test_unregister_not_found(client):
    resp = client.delete("/activities/Chess Club/participants", params={"email": "no-such@example.com"})
    assert resp.status_code == 404
