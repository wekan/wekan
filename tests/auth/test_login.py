import os
import requests

base_url = os.environ.get("BASE_URL", "http://localhost")

class TestLogin:
    def test_health_check(self):
        """Test basic health check"""
        response = requests.get(f"{base_url}")
        assert response.status_code == 200

    def test_login_page_accessible(self):
        """Test that login page is accessible"""
        response = requests.get(f"{base_url}/sign-in")
        assert response.status_code == 200

    def test_login_with_valid_username(self):
        """Test login with valid username credentials"""
        login_data = {
            'username': 'omriza5',
            'password': '123456'
        }

        response = requests.post(f"{base_url}/users/login", data=login_data)

        assert response.status_code == 200
        json_response = response.json()
        print("Response JSON:", json_response)
        assert 'token' in json_response
        assert isinstance(json_response['token'], str)
        assert len(json_response['token']) > 0

    def test_login_with_invalid_email(self):
      """Test login with invalid email credentials"""
      login_data = {
        'email': 'nonexistent@invalid.com',
        'password': 'invalid_password'
      }

      response = requests.post(
        f"{base_url}/users/login",
        data=login_data,
      )

      assert response.status_code in [400, 401, 404]
      json_response = response.json()
      print("Response JSON:", json_response)
      assert 'error' in json_response
      assert json_response['error'] == 'not-found'
      assert 'reason' in json_response
      assert 'not found' in json_response['reason'].lower()

    def test_api_requires_authentication(self):
        """Test that API endpoints require authentication"""
        # Try to access boards without authentication
        response = requests.get(f"{base_url}/api/boards")

        assert response.status_code == 200

        json_response = response.json()
        assert 'error' in json_response
        assert json_response['error'] == 'Unauthorized'
        assert json_response['statusCode'] == 401
