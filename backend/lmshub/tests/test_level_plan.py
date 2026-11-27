import hashlib

from django.test import override_settings

from .base import HubTestBase


class LevelPlanTests(HubTestBase):
    def test_plan_shape(self):
        token = self.pair()
        session = self.session(token)
        response = self.get("level-plan", token=token, session=session)
        self.assertEqual(response.status_code, 200)
        plan = response.json()
        self.assertEqual(plan["student"], {"id": self.s1.student_id, "login_code": "AAR_1001", "name": "Student 1001"})
        self.assertEqual(plan["grade"]["id"], self.grade3.id)
        self.assertEqual(plan["counts"], {"lessons": 2, "assessments": 1})
        self.assertEqual((len(plan["lessons"]), len(plan["bosses"])), (30, 6))
        first = plan["lessons"][0]
        self.assertEqual(first["packageId"], str(self.lesson1.id))
        self.assertEqual(first["downloadUrl"], f"/api/lms-hub/packages/{self.lesson1.id}")
        self.assertTrue(first["available"])
        self.assertEqual(first["checksum"], self.sum1)
        self.assertIsNone(plan["lessons"][2])
        self.assertEqual(plan["bosses"][0]["type"], "ASSESSMENT")

    def test_grade_not_found(self):
        token = self.pair()
        self.s1.grade = "Class 9"
        self.s1.save()
        session = self.session(token)
        response = self.get("level-plan", token=token, session=session)
        self.assertEqual(response.status_code, 422)
        self.assertEqual(response.json(), {"error": "grade_not_found", "raw": "Class 9"})

    def test_needs_session(self):
        token = self.pair()
        self.assertEqual(self.get("level-plan", token=token).json()["error"], "session_expired")

    def test_package_in_plan(self):
        token = self.pair()
        session = self.session(token)
        response, body = self.download(f"packages/{self.lesson1.id}", token, session)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["X-Package-Checksum"], self.sum1)
        self.assertEqual(hashlib.sha256(body).hexdigest(), self.sum1)

    def test_package_not_in_plan(self):
        token = self.pair()
        session = self.session(token)
        for pkg_id in (self.lesson_g4.id, "abc", 999999):
            response, _ = self.download(f"packages/{pkg_id}", token, session)
            self.assertEqual((response.status_code, response.json()["error"]), (404, "package_not_available"))

    def test_device_packages_any_school_grade(self):
        token = self.pair()
        ok, body = self.download(f"device-packages/{self.lesson_g4.id}", token)
        self.assertEqual(ok.status_code, 200)
        self.assertEqual(hashlib.sha256(body).hexdigest(), self.sum_g4)
        missing, _ = self.download(f"device-packages/{self.lesson_g5.id}", token)
        self.assertEqual(missing.status_code, 404)

    def test_nginx_streams_the_file(self):
        token = self.pair()
        session = self.session(token)
        with override_settings(PACKAGES_ROOT=self.tmp_dir):
            response, body = self.download(f"packages/{self.lesson1.id}", token, session, HTTP_X_LMSHUB_ACCEL="1")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["X-Accel-Redirect"], f"/_lmshub_packages/{self.lesson1.id}.elab")
        self.assertEqual(response["X-Package-Checksum"], self.sum1)
        self.assertEqual(body, b"")
