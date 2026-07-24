from unittest.mock import patch, MagicMock

def test_score_endpoint(client):
    with patch("routers.scoring.agent.score") as mock_score:
        mock_score.return_value = {"score": 80, "reason": "Strong technical lead"}
        resp = client.post("/score", json={"lead": {"firstName": "John", "lastName": "Doe", "title": "CTO"}})
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["data"]["score"] == 80
