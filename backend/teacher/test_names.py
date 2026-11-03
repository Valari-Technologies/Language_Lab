from django.test import SimpleTestCase

from accounts.names import title_name


class TitleNameTests(SimpleTestCase):
    def test_each_word_starts_with_a_capital(self):
        self.assertEqual(title_name("ravi kumar"), "Ravi Kumar")
        self.assertEqual(title_name("RAVI KUMAR"), "Ravi Kumar")
        self.assertEqual(title_name("raVI"), "Ravi")
        self.assertEqual(title_name("  abu   bakar "), "Abu Bakar")
        self.assertEqual(title_name("mary-jane"), "Mary-Jane")
        self.assertEqual(title_name("a. r. rahman"), "A. R. Rahman")

    def test_empty_values(self):
        self.assertEqual(title_name(""), "")
        self.assertEqual(title_name(None), "")
