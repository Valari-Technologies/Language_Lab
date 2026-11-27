import uuid
from datetime import timedelta

from django.utils import timezone
from django.utils.dateparse import parse_datetime

from assessments.models import StudentAttempt
from lmshub.models import LmsLevelProgress, LmsProgressEvent, LmsStudentState
from lmshub.progress import merge_state
from .base import HubTestBase


class ProgressTests(HubTestBase):
    def setUp(self):
        super().setUp()
        self.token = self.pair()
        self.sess = self.session(self.token)

    def _event(self, **overrides):
        event = {
            "event_id": str(uuid.uuid4()),
            "level_key": "L1",
            "package_id": str(self.lesson1.id),
            "stars": 2,
            "score": 70,
            "max_score": 100,
            "completed": True,
            "completed_at": timezone.now().isoformat(),
            "pc_sent_at": timezone.now().isoformat(),
            "time_spent_seconds": 300,
        }
        event.update(overrides)
        return event

    def _send(self, event, session=None):
        return self.post("progress", event, token=self.token, session=session or self.sess)

    def test_completion_saves_level_and_student_attempt(self):
        event = self._event()
        response = self._send(event)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual((data["ok"], data["duplicate"]), (True, False))
        self.assertEqual(data["levels"][0]["level_key"], "L1")
        row = LmsLevelProgress.objects.get(student=self.s1, level_key="L1")
        self.assertEqual((row.best_stars, row.best_score, row.completed, row.attempts), (2, 70.0, True, 1))
        attempt = StudentAttempt.objects.get(lms_attempt_id=event["event_id"])
        self.assertEqual((attempt.stars, attempt.level_key, attempt.status), (2, "L1", "COMPLETED"))
        self.assertEqual(attempt.assignment.class_obj, self.class_3a)
        self.assertEqual(attempt.assignment.experience_ref, str(self.lesson1.experience_id))
        self.assertEqual(LmsProgressEvent.objects.get(event_id=event["event_id"]).attempt_status, "saved")

    def test_duplicate_event_changes_nothing(self):
        event = self._event()
        self._send(event)
        again = self._send(event).json()
        self.assertTrue(again["duplicate"])
        self.assertEqual(LmsLevelProgress.objects.get(student=self.s1).attempts, 1)
        self.assertEqual(StudentAttempt.objects.filter(lms_attempt_id=event["event_id"]).count(), 1)

    def test_merge_rules(self):
        early = timezone.now() - timedelta(days=2)
        late = timezone.now() - timedelta(hours=1)
        self._send(self._event(stars=3, score=60, completed_at=late.isoformat()))
        self._send(self._event(stars=1, score=90, completed_at=early.isoformat()))
        self._send(self._event(stars=0, score=None, completed=False, completed_at=None))
        row = LmsLevelProgress.objects.get(student=self.s1, level_key="L1")
        self.assertEqual((row.best_stars, row.best_score, row.completed, row.attempts), (3, 90.0, True, 3))
        self.assertLess(abs((row.first_completed_at - early).total_seconds()), 2)
        self.assertLess(abs((row.last_completed_at - late).total_seconds()), 2)

    def test_package_from_slot_when_missing(self):
        self._send(self._event(level_key="B1", package_id=None))
        self.assertEqual(LmsLevelProgress.objects.get(level_key="B1").package_id, str(self.boss1.id))

    def test_clock_correction(self):
        pc_now = timezone.now() - timedelta(hours=1)        # the PC clock is one hour behind
        done_on_pc = pc_now - timedelta(minutes=10)
        self._send(self._event(completed_at=done_on_pc.isoformat(), pc_sent_at=pc_now.isoformat()))
        row = LmsLevelProgress.objects.get(student=self.s1)
        expected = timezone.now() - timedelta(minutes=10)
        self.assertLess(abs((row.first_completed_at - expected).total_seconds()), 5)

    def test_unusable_times_fall_back_to_server_time(self):
        far_future = (timezone.now() + timedelta(days=3)).isoformat()
        self._send(self._event(completed_at=far_future, pc_sent_at=timezone.now().isoformat()))
        old = (timezone.now() - timedelta(days=40)).isoformat()
        self._send(self._event(level_key="L2", package_id=str(self.lesson2.id), completed_at=old))
        for key in ("L1", "L2"):
            done = LmsLevelProgress.objects.get(level_key=key).first_completed_at
            self.assertLess(abs((done - timezone.now()).total_seconds()), 5)

    def test_state_merge(self):
        first = {"event_id": str(uuid.uuid4()), "state_patch": {
            "unlockedLevel": 7, "stars": {"1": 3, "2": 1}, "unlockedPieces": {"z1": ["a", "b"]},
            "revealedBosses": {"1": True}, "theme": "old"}}
        second = {"event_id": str(uuid.uuid4()), "state_patch": {
            "unlockedLevel": 4, "stars": {"1": 2, "2": 3}, "unlockedPieces": {"z1": ["b", "c"]},
            "revealedBosses": {"1": False, "2": True}, "theme": "new"}}
        self.assertEqual(self._send(first).status_code, 200)
        state = self._send(second).json()["state"]
        self.assertEqual(state, {"unlockedLevel": 7, "stars": {"1": 3, "2": 3}, "unlockedPieces": {"z1": ["a", "b", "c"]},
                                 "revealedBosses": {"1": True, "2": True}, "theme": "new"})
        self.assertEqual(LmsStudentState.objects.get(student=self.s1).state, state)
        self.assertFalse(StudentAttempt.objects.exists())

    def test_merge_state_unit(self):
        self.assertEqual(merge_state({}, {"unlockedLevel": 99}), {"unlockedLevel": 30})
        self.assertEqual(merge_state({"stars": {"5": 2}}, {"stars": {"5": "9"}}), {"stars": {"5": 3}})

    def test_invalid_events(self):
        self.assertEqual(self._send(self._event(event_id="nope")).json()["error"], "invalid_event_id")
        self.assertEqual(self._send(self._event(level_key="L31")).json()["error"], "invalid_level_key")
        self.assertEqual(self._send({"event_id": str(uuid.uuid4())}).json()["error"], "nothing_to_apply")
        self.assertEqual(self._send({"event_id": str(uuid.uuid4()), "state_patch": [1]}).json()["error"], "invalid_state_patch")

    def test_student_without_class(self):
        session = self.session(self.pair(), "DIY_1002")
        pc = self.pair()
        session = self.session(pc, "DIY_1002")
        event = self._event()
        response = self.post("progress", event, token=pc, session=session)
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(StudentAttempt.objects.get(lms_attempt_id=event["event_id"]).assignment.class_obj)
        self.assertEqual(LmsProgressEvent.objects.get(event_id=event["event_id"]).attempt_status, "no_class")

    def test_rejected_report_copy_keeps_hub_progress(self):
        event = self._event(score=150, max_score=100)
        self.assertEqual(self._send(event).status_code, 200)
        self.assertTrue(LmsLevelProgress.objects.filter(student=self.s1, level_key="L1").exists())
        saved = LmsProgressEvent.objects.get(event_id=event["event_id"])
        self.assertEqual(saved.attempt_status, "rejected")
        self.assertIn("score", saved.attempt_error)

    def test_get_progress(self):
        self._send(self._event())
        data = self.get("progress", token=self.token, session=self.sess).json()
        self.assertTrue(data["ok"])
        self.assertEqual(data["levels"][0]["attempts"], 1)
        self.assertIsNotNone(parse_datetime(data["levels"][0]["updated_at"]))
        self.assertEqual(data["state"], {})
