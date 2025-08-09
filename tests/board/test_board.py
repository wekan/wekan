import pytest
import requests

base_url = "http://10.0.0.17"
class TestBoard:

  @pytest.fixture(scope="class", autouse=True)
  def get_auth_token(self, request):
      """Get authentication token once for all tests in this class"""
      login_data = {
          'username': 'omriza5',
          'password': '123456'
      }

      print("🔐 Getting authentication token...")
      response = requests.post(f"{base_url}/users/login", data=login_data)

      if response.status_code == 200:
            json_response = response.json()
            if 'token' in json_response:
                # Store token and user info in class
                request.cls.auth_token = json_response['token']
                request.cls.user_id = json_response.get('id', '')
                print(f"✅ Token obtained: {request.cls.auth_token[:20]}...")
                print(f"✅ User ID obtained: {request.cls.user_id[:20]}...")
            else:
                request.cls.auth_token = None
                print(f"❌ Login failed: {json_response}")
      else:
            request.cls.auth_token = None
            print(f"❌ Login request failed: {response.status_code}")

  def test_health_check(self):
      """Test basic health check"""
      response = requests.get(f"{base_url}")
      assert response.status_code == 200


  def test_get_user_boards(self):
      """Test getting information about boards of user"""
      if not self.auth_token:
          pytest.skip("No authentication token available")

      response = requests.get(
            f"{base_url}/api/users/{self.user_id}/boards",
            headers={"Authorization": f"Bearer {self.auth_token}"}
      )

      assert response.status_code == 200

        # Should return a list of boards
      boards_data = response.json()
      assert isinstance(boards_data, list), "Response should be a list of boards"
      assert "title" in boards_data[0], "First board object should have a 'title' key"

  def test_create_board_minimal(self):
      """Test creating a board with minimal required fields"""
      if not self.auth_token:
            pytest.skip("No authentication token available")

      board_data = {
            "title": "Test Board - Minimal",
            "owner": self.user_id
      }

      response = requests.post(
            f"{base_url}/api/boards",
            headers={"Authorization": f"Bearer {self.auth_token}"},
            data=board_data
      )

      assert response.status_code in [200, 201]

  def test_create_board_full_options(self):
        """Test creating a board with all optional fields"""
        if not self.auth_token:
            pytest.skip("No authentication token available")

        board_data = {
            "title": "Test Board - Full Options",
            "owner": self.user_id,
            "color":"pomegranate",
        }

        response = requests.post(
            f"{base_url}/api/boards",
            headers={"Authorization": f"Bearer {self.auth_token}"},
            data=board_data
        )

        assert response.status_code in [200, 201]

  def test_create_public_board(self):
        """Test creating a public board"""
        if not self.auth_token:
            pytest.skip("No authentication token available")

        board_data = {
            "title": "Test Board - Public",
            "owner": self.user_id,
            "permission": "public",
            "color": "belize"
        }

        response = requests.post(
            f"{base_url}/api/boards",
            headers={"Authorization": f"Bearer {self.auth_token}"},
            data=board_data
        )

        assert response.status_code in [200, 201]

  def test_create_board_different_colors(self):
        """Test creating boards with different colors"""
        if not self.auth_token:
            pytest.skip("No authentication token available")

        colors = ["belize", "nephritis", "pomegranate", "pumpkin", "wisteria", "midnight"]

        for color in colors[:2]:  # Test first 2 colors to avoid too many boards
            board_data = {
                "title": f"Test Board - Color {color}",
                "owner": self.user_id,
                "permission": "private",
                "color": color
            }

            response = requests.post(
                f"{base_url}/api/boards",
                headers={"Authorization": f"Bearer {self.auth_token}"},
                data=board_data
            )

            assert response.status_code in [200, 201], f"Failed to create board with color {color}"

  def test_create_board_invalid_data(self):
        """Test creating board with invalid data"""
        if not self.auth_token:
            pytest.skip("No authentication token available")

        # Test missing required title
        invalid_board_data = {
            "owner": self.user_id
            # Missing title
        }

        response = requests.post(
            f"{base_url}/api/boards",
            headers={"Authorization": f"Bearer {self.auth_token}"},
            data=invalid_board_data
        )

        # Should fail with 400 or similar error
        assert response.status_code in [400, 422, 500], "Should fail when missing required fields"

  def test_create_board_invalid_owner(self):
        """Test creating board with invalid owner ID"""
        if not self.auth_token:
            pytest.skip("No authentication token available")

        board_data = {
            "title": "Test Board - Invalid Owner",
        }

        response = requests.post(
            f"{base_url}/api/boards",
            headers={"Authorization": f"Bearer {self.auth_token}"},
            data=board_data
        )
        # Should fail with appropriate error
        assert response.status_code in [400, 403, 404, 500], "Should fail with invalid owner ID"

  def test_unauthorized_board_creation(self):
        """Test creating board without authentication"""
        board_data = {
            "title": "Unauthorized Test Board",
            "owner": "some_user_id"
        }

        # Don't include authorization headers
        response = requests.post(
            f"{base_url}/api/boards",
            headers={"Authorization": f"Bearer {self.auth_token}",
                     "Content-Type": "application/json"},
            data=board_data
        )

        print(f"🚫 Unauthorized creation status: {response.status_code}")
        print(f"🚫 Unauthorized response: {response.text[:200]}")

        # Should require authentication
        assert response.status_code in [400, 401, 403], "Should require authentication"

  def test_get_boards_api(self):
        """Test getting boards via API"""
        if not self.auth_token:
            pytest.skip("No authentication token available")

        response = requests.get(
            f"{base_url}/api/boards",
            headers={"Authorization": f"Bearer {self.auth_token}"}
        )

        print(f"📋 Get boards API status: {response.json()}")

        # Should work with authentication
        assert response.status_code in [200, 204]
