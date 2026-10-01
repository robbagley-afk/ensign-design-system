"""Synthetic launcher preflight tests. Never launches or touches a browser."""
import subprocess
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).with_name("launch-persistent-edge-helper.sh")


class ProfileSelectionTests(unittest.TestCase):
    def select(self, lane, profile, root):
        # Source only the pure preflight function, not the launcher body.
        function = SCRIPT.read_text().split('\nN="$1"', 1)[0]
        return subprocess.run(
            ["bash", "-c", function + '\nselect_helper_profile "$1" "$2" "$3"',
             "test", lane, profile, str(root)],
            text=True, capture_output=True,
        )

    def test_explicit_profiles(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for profile in ("Default", "Profile 2"):
                (root / profile).mkdir()
                result = self.select("1", profile, root)
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertEqual(result.stdout.strip(), profile)

    def test_fail_closed(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "Default").mkdir()
            for lane, profile in (("1", ""), ("1", "Profile 3"),
                                  ("0", "Default"), ("10", "Default"),
                                  ("1", "../Default"), ("1", "Profile 2")):
                with self.subTest(lane=lane, profile=profile):
                    self.assertEqual(self.select(lane, profile, root).returncode, 2)

    def test_no_forceful_ownership_recovery(self):
        source = SCRIPT.read_text()
        self.assertNotIn('kill -TERM', source)
        self.assertNotIn('rm -f', source)
        self.assertIn('refusing to start', source)

    def test_held_and_locked_profiles_abort_without_launch(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "Default").mkdir()
            source = SCRIPT.read_text().replace(
                'PROFILE_DIR="$HOME/CCowork-Local-Apps/claude-ensign-helper-edge$N-profile"',
                'PROFILE_DIR="$3"',
            ).replace(
                'EDGE="/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"',
                'EDGE="/nonexistent-browser-must-never-launch"',
            )
            for held in (True, False):
                if not held:
                    (root / "SingletonLock").symlink_to(root / "missing-owner")
                # No network or actual process inventory. The second case proves
                # even a dangling Chromium lock is preserved and blocks startup.
                prelude = 'curl() { return 1; }; pgrep() { '
                if held:
                    prelude += ('echo 999999; }; '
                                'ps() { echo "/nonexistent-browser-must-never-launch"; };\n')
                else:
                    prelude += 'return 1; };\n'
                result = subprocess.run(
                    ["bash", "-c", prelude + source, "test", "1", "Default", str(root)],
                    text=True, capture_output=True,
                )
                self.assertEqual(result.returncode, 1, result.stderr)
                self.assertNotIn("Starting edge", result.stdout)
            self.assertTrue((root / "SingletonLock").is_symlink())

    def test_non_browser_match_is_not_a_holder(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "Default").mkdir()
            source = SCRIPT.read_text().replace(
                'PROFILE_DIR="$HOME/CCowork-Local-Apps/claude-ensign-helper-edge$N-profile"',
                'PROFILE_DIR="$3"',
            ).replace(
                'EDGE="/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"',
                'EDGE="/nonexistent-browser-must-never-launch"',
            )
            # pgrep fires but ps reports a shell, not Edge; sleep is a no-op so the
            # DevTools wait loop exits quickly; launcher must attempt launch and fail.
            prelude = (
                'curl() { return 1; }; '
                'pgrep() { echo 999999; }; '
                'ps() { echo "/bin/zsh"; }; '
                'sleep() { :; };\n'
            )
            result = subprocess.run(
                ["bash", "-c", prelude + source, "test", "1", "Default", str(root)],
                text=True, capture_output=True,
            )
            self.assertEqual(result.returncode, 1, result.stderr)
            self.assertIn("Starting edge", result.stdout)
            self.assertNotIn("held by PID", result.stderr)

    def test_real_holder_found_after_non_browser_match(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "Default").mkdir()
            source = SCRIPT.read_text().replace(
                'PROFILE_DIR="$HOME/CCowork-Local-Apps/claude-ensign-helper-edge$N-profile"',
                'PROFILE_DIR="$3"',
            ).replace(
                'EDGE="/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"',
                'EDGE="/nonexistent-browser-must-never-launch"',
            )
            # pgrep yields a non-browser PID first; holder_pid must keep scanning and
            # find the real Edge PID (222) before the launcher is allowed to proceed.
            prelude = (
                'curl() { return 1; }; '
                'pgrep() { printf "111\n222\n"; }; '
                'ps() { case "$*" in *111*) echo "/bin/zsh" ;; '
                '*222*) echo "/nonexistent-browser-must-never-launch" ;; esac; };\n'
            )
            result = subprocess.run(
                ["bash", "-c", prelude + source, "test", "1", "Default", str(root)],
                text=True, capture_output=True,
            )
            self.assertEqual(result.returncode, 1, result.stderr)
            self.assertIn("held by PID 222", result.stderr)
            self.assertNotIn("Starting edge", result.stdout)


if __name__ == "__main__":
    unittest.main()
