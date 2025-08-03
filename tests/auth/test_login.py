import pytest
import requests
import os

BASE_URL = os.getenv('WEKAN_URL', 'http://localhost:3000')
TEST_USERNAME = 'testuser'
TEST_PASSWORD = 'testpass123'
TEST_EMAIL = 'test@example.com'

base_url="http://10.0.0.17/"
class TestLogin:

  def test_health_check(self):
    """Test basic health check"""
    response = requests.get(f"{base_url}")
    # assert response.status_code == 400
    print("**************",response.status_code)
    assert response.status_code == 200
