"""HTTP UI page checks for the Next.js frontend.

Run against a running frontend server. These checks verify that the main pages
render, return HTML, and do not show obvious Next.js error output.
"""

from __future__ import annotations

import argparse
import sys
import urllib.error
import urllib.request


DEFAULT_BASE_URL = "http://127.0.0.1:3000"


ROUTES = {
    "public": [
        "/login",
        "/forgot-password",
        "/reset-password",
        "/register",
    ],
    "admin": [
        "/dashboard",
        "/users",
        "/customers",
        "/permissions",
        "/roles",
        "/settings",
        "/settings/countries",
        "/settings/cities",
        "/settings/payment",
        "/settings/api",
        "/suppliers",
        "/agents",
        "/affiliates",
        "/tours",
        "/tours/create",
        "/tours/categories",
        "/tours/subcategories",
    ],
}


ERROR_MARKERS = [
    "Unhandled Runtime Error",
    "Application error",
    "__next_error__",
    "NEXT_NOT_FOUND",
]


def fetch(base_url: str, route: str) -> tuple[int, str, str]:
    url = f"{base_url.rstrip('/')}{route}"
    request = urllib.request.Request(url, headers={"Accept": "text/html"})
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            return response.status, response.headers.get("content-type", ""), response.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as exc:
        return exc.code, exc.headers.get("content-type", ""), exc.read().decode("utf-8", errors="replace")
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Cannot reach {url}: {exc.reason}") from exc


def check_route(base_url: str, route: str) -> None:
    status, content_type, html = fetch(base_url, route)
    if status != 200:
        raise RuntimeError(f"{route} returned HTTP {status}")
    if "text/html" not in content_type:
        raise RuntimeError(f"{route} returned non-HTML content type: {content_type}")
    if "<html" not in html.lower():
        raise RuntimeError(f"{route} did not return an HTML document")
    marker = next((item for item in ERROR_MARKERS if item in html), None)
    if marker:
        raise RuntimeError(f"{route} contains error marker: {marker}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run Tourvaa frontend UI page checks.")
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL, help="Frontend base URL.")
    parser.add_argument(
        "--group",
        choices=["all", *ROUTES.keys()],
        default="all",
        help="Route group to check.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    groups = ROUTES.keys() if args.group == "all" else [args.group]
    failures: list[str] = []

    for group in groups:
        print(f"\n== {group} pages ==")
        for route in ROUTES[group]:
            try:
                check_route(args.base_url, route)
                print(f"PASS {route}")
            except Exception as exc:
                failures.append(f"{route}: {exc}")
                print(f"FAIL {route}: {exc}")

    if failures:
        print("\nFailures:")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print("\nAll UI page checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
