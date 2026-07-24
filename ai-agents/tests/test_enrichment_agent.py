from unittest.mock import patch

def test_enrich_endpoint(client):
    with patch("routers.enrichment.agent.enrich") as mock_enrich:
        mock_enrich.return_value = {"notes": "Senior engineer", "tags": ["technical"]}
        resp = client.post("/enrich", json={"lead": {"firstName": "Jane", "lastName": "Smith", "title": "VP Eng"}})
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert "notes" in data["data"]
