import os
import unittest
import requests

#test push
WEKAN_URL = os.getenv("WEKAN_URL", "http://localhost/users/login")

class TestUserLogin(unittest.TestCase):

    def test_user_login_success(self):

        payload = {
            "username": "RabeeaFaraj",
            "password": "123456789"
        }
        payload2 = {
            "username": "rabeeaFaraj",
            "password": "123456789"
        }
        if WEKAN_URL== "http://localhost/users/login":
            payload = payload2
        response = requests.post(WEKAN_URL, json=payload)
        print("Status code:", response.status_code)
        print("Response JSON:", response.json())
        self.assertEqual(response.status_code, 200)
        self.assertIn("token", response.json())

    def test_user_login_wrong_password(self):

        payload = {
            "username": "rabeeaFaraj",
            "password": "wrongpassword"
        }
        response = requests.post(WEKAN_URL, json=payload)
        self.assertEqual(response.status_code, 400)  # או 400 בהתאם למימוש
        self.assertIn("error", response.json())

    def test_user_login_missing_fields(self):

        payload = {
            "username": "rabeeaFaraj"
            # חסר שדה סיסמה
        }
        response = requests.post(WEKAN_URL, json=payload)
        self.assertEqual(response.status_code, 400)
        self.assertIn("error", response.json())

    def test_user_login_nonexistent_user(self):

        payload = {
            "username": "notexist",
            "password": "any"
        }
        response = requests.post(WEKAN_URL, json=payload)

        self.assertEqual(response.status_code, 400)  # או 404 בהתאם למימוש
        self.assertIn("error", response.json())

# ana btal
if __name__ == "__main__":
    unittest.main()

