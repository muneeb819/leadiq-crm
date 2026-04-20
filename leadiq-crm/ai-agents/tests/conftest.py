import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

@pytest.fixture
def client():
    from main import app
    return TestClient(app)

@pytest.fixture
def mock_claude():
    with patch("agents.base_agent.anthropic.Anthropic") as mock:
        instance = MagicMock()
        instance.messages.create.return_value.content = [MagicMock(text='{"score": 75, "reason": "Strong fit"}')]
        mock.return_value = instance
        yield instance
