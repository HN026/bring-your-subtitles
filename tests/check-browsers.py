"""Run the controlled-player fixture in installed desktop browsers on macOS.

Uses disposable profiles and a loopback-only server; no third-party packages.
"""
import functools
import http.server
import pathlib
import queue
import subprocess
import tempfile
import threading

PROJECT = pathlib.Path(__file__).resolve().parents[1]
BROWSERS = {
    "Chrome": "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "Firefox": "/Applications/Firefox.app/Contents/MacOS/firefox",
}


def check(name, executable):
    reports = queue.Queue()

    class Handler(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *_args):
            pass

        def do_POST(self):
            if self.path != "/__result":
                self.send_error(404)
                return
            length = int(self.headers.get("Content-Length", 0))
            if not 0 < length < 100_000:
                self.send_error(400)
                return
            reports.put(self.rfile.read(length).decode())
            self.send_response(200)
            self.end_headers()

    handler = functools.partial(Handler, directory=str(PROJECT))
    with http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler) as server:
        threading.Thread(target=server.serve_forever, daemon=True).start()
        url = f"http://127.0.0.1:{server.server_port}/tests/browser.html"
        with tempfile.TemporaryDirectory(prefix="bring-subtitles-") as profile:
            args = ([executable, "--headless=new", "--no-first-run", "--no-default-browser-check",
                     "--disable-background-networking", f"--user-data-dir={profile}", url]
                    if name == "Chrome" else
                    [executable, "--headless", "--no-remote", "--profile", profile, url])
            with open(pathlib.Path(profile) / "browser.log", "w") as log:
                process = subprocess.Popen(args, stdout=log, stderr=log)
                try:
                    report = reports.get(timeout=35)
                    print(f"{name}:\n{report}", flush=True)
                    return report.endswith("ALL PASSED")
                except queue.Empty:
                    print(f"{name}: timed out waiting for fixture results", flush=True)
                    return False
                finally:
                    process.terminate()
                    try:
                        process.wait(timeout=5)
                    except subprocess.TimeoutExpired:
                        process.kill()
                        process.wait()
                    server.shutdown()


if __name__ == "__main__":
    outcomes = [check(name, path) for name, path in BROWSERS.items()]
    raise SystemExit(0 if all(outcomes) else 1)
