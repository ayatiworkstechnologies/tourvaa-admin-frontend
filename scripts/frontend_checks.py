"""Frontend source checks that do not require a browser test framework."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


REQUIRED_ROUTES = [
    "app/login/page.tsx",
    "app/dashboard/page.tsx",
    "app/users/page.tsx",
    "app/customers/page.tsx",
    "app/suppliers/page.tsx",
    "app/suppliers/[id]/page.tsx",
    "app/agents/page.tsx",
    "app/agents/[id]/page.tsx",
    "app/affiliates/page.tsx",
    "app/affiliates/[id]/page.tsx",
    "app/settings/countries/page.tsx",
    "app/settings/cities/page.tsx",
    "app/tours/page.tsx",
    "app/tours/create/page.tsx",
    "app/tours/[id]/edit/page.tsx",
    "app/tours/categories/page.tsx",
    "app/tours/subcategories/page.tsx",
]


REQUIRED_FILES = [
    "components/operations/ActionModal.tsx",
    "components/operations/AdminAssetUpload.tsx",
    "components/operations/ReviewDetailPage.tsx",
    "components/operations/ReviewListPage.tsx",
    "components/operations/StatusBadge.tsx",
    "components/cms/CmsCrudPage.tsx",
    "components/cms/TourFormPage.tsx",
    "lib/services/operationsService.ts",
    "lib/services/cmsService.ts",
    "config/page-permissions.ts",
]


REQUIRED_PAGE_PERMISSIONS = [
    "/suppliers",
    "/agents",
    "/affiliates",
    "/settings/countries",
    "/settings/cities",
    "/tours",
    "/tours/categories",
    "/tours/subcategories",
    "/tours/create",
    "/tours/[id]/edit",
]


def run(command: list[str]) -> None:
    print(f"== {' '.join(command)} ==")
    completed = subprocess.run(command, cwd=ROOT, shell=False)
    if completed.returncode != 0:
        raise RuntimeError(f"Command failed with exit code {completed.returncode}: {' '.join(command)}")


def assert_exists(paths: list[str], label: str) -> None:
    missing = [path for path in paths if not (ROOT / path).exists()]
    if missing:
        raise RuntimeError(f"Missing {label}: {', '.join(missing)}")
    print(f"PASS {label}: {len(paths)} checked")


def assert_page_permissions() -> None:
    content = (ROOT / "config/page-permissions.ts").read_text(encoding="utf-8")
    missing = [path for path in REQUIRED_PAGE_PERMISSIONS if path not in content]
    if missing:
        raise RuntimeError(f"Missing page permissions: {', '.join(missing)}")
    print(f"PASS page permissions: {len(REQUIRED_PAGE_PERMISSIONS)} checked")


def assert_package_has_no_unit_test_deps() -> None:
    package = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
    scripts = package.get("scripts", {})
    deps = {**package.get("dependencies", {}), **package.get("devDependencies", {})}
    forbidden = ["vitest", "jsdom", "@testing-library/react", "@testing-library/jest-dom"]
    found = [name for name in forbidden if name in deps or name in scripts]
    if found:
        raise RuntimeError(f"Removed unit-test packages/scripts are back: {', '.join(found)}")
    print("PASS package test dependency cleanup")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run frontend source checks.")
    parser.add_argument("--skip-lint", action="store_true", help="Skip npm run lint.")
    parser.add_argument("--skip-typecheck", action="store_true", help="Skip npx tsc --noEmit.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        assert_exists(REQUIRED_ROUTES, "routes")
        assert_exists(REQUIRED_FILES, "shared files")
        assert_page_permissions()
        assert_package_has_no_unit_test_deps()
        if not args.skip_lint:
            run(["npm.cmd", "run", "lint"] if sys.platform == "win32" else ["npm", "run", "lint"])
        if not args.skip_typecheck:
            run(["npx.cmd", "tsc", "--noEmit"] if sys.platform == "win32" else ["npx", "tsc", "--noEmit"])
    except Exception as exc:
        print(f"FAIL {exc}", file=sys.stderr)
        return 1
    print("All frontend source checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
