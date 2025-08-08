import unittest
import requests

#test push
class TestUserLogin(unittest.TestCase):
    def test_user_login_success(self):
        url = "http://localhost:80/users/login"
        payload = {
            "username": "rabeeaFaraj",
            "password": "30fnhk03"
        }
        response = requests.post(url, json=payload)
        self.assertEqual(response.status_code, 200)
        self.assertIn("token", response.json())

    def test_user_login_wrong_password(self):
        url = "http://localhost:80/users/login"
        payload = {
            "username": "rabeeaFaraj",
            "password": "wrongpassword"
        }
        response = requests.post(url, json=payload)
        self.assertEqual(response.status_code, 400)  # או 400 בהתאם למימוש
        self.assertIn("error", response.json())

    def test_user_login_missing_fields(self):
        url = "http://localhost:80/users/login"
        payload = {
            "username": "rabeeaFaraj"
            # חסר שדה סיסמה
        }
        response = requests.post(url, json=payload)
        self.assertEqual(response.status_code, 400)
        self.assertIn("error", response.json())

    def test_user_login_nonexistent_user(self):
        url = "http://localhost:80/users/login"
        payload = {
            "username": "notexist",
            "password": "any"
        }
        response = requests.post(url, json=payload)

        self.assertEqual(response.status_code, 400)  # או 404 בהתאם למימוש
        self.assertIn("error", response.json())

# ana btal
if __name__ == "__main__":
    unittest.main()

