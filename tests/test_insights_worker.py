from __future__ import annotations

import json
import subprocess
import sys
import unittest
from pathlib import Path

from worker.insights_worker import ContractError, analyze, validate_payload


BASE_PAYLOAD = {
    "contract_version": 1,
    "budget_usage": [
        {"category": "alimentacao", "usage_basis_points": 8_500},
        {"category": "transporte", "usage_basis_points": 10_000},
        {"category": "moradia", "usage_basis_points": 7_900},
    ],
    "goals": {
        "active_count": 3,
        "completed_count": 1,
        "shortfall_count": 1,
        "deadline_only_count": 1,
        "on_track_count": 1,
    },
}


class InsightsWorkerTests(unittest.TestCase):
    def test_generates_deterministic_budget_and_goal_messages(self) -> None:
        result = analyze(BASE_PAYLOAD)
        self.assertEqual(result["contract_version"], 1)
        self.assertEqual(
            [item["code"] for item in result["insights"]],
            [
                "budget_near_limit",
                "budget_limit_reached",
                "goals_completed",
                "goals_plan_shortfall",
                "goals_deadline_estimate",
                "goals_plan_on_track",
            ],
        )
        self.assertEqual(result["insights"][0]["category"], "alimentacao")
        self.assertIn("nenhum orçamento foi alterado", result["insights"][3]["message"])
        self.assertEqual(analyze(BASE_PAYLOAD), result)

    def test_silence_when_budgets_are_below_threshold_and_no_goals_exist(self) -> None:
        payload = {
            "contract_version": 1,
            "budget_usage": [{"category": "saude", "usage_basis_points": 7_999}],
            "goals": {
                "active_count": 0,
                "completed_count": 0,
                "shortfall_count": 0,
                "deadline_only_count": 0,
                "on_track_count": 0,
            },
        }
        self.assertEqual(analyze(payload)["insights"], [])

    def test_rejects_personal_fields_and_unknown_contract_fields(self) -> None:
        with self.assertRaises(ContractError):
            validate_payload({**BASE_PAYLOAD, "user_id": 42})
        with self.assertRaises(ContractError):
            validate_payload(
                {
                    **BASE_PAYLOAD,
                    "budget_usage": [
                        {"category": "alimentacao", "usage_basis_points": 8_500, "email": "private@example.test"}
                    ],
                }
            )

    def test_rejects_inconsistent_counts_and_unrecognized_categories(self) -> None:
        with self.assertRaises(ContractError):
            validate_payload(
                {
                    **BASE_PAYLOAD,
                    "goals": {**BASE_PAYLOAD["goals"], "on_track_count": 0},
                }
            )
        with self.assertRaises(ContractError):
            validate_payload(
                {
                    **BASE_PAYLOAD,
                    "budget_usage": [{"category": "unknown", "usage_basis_points": 9_000}],
                }
            )

    def test_cli_returns_bounded_error_without_echoing_invalid_input(self) -> None:
        worker = Path(__file__).resolve().parents[1] / "analytics.py"
        private_marker = "private-value-must-not-be-echoed"
        result = subprocess.run(
            [sys.executable, str(worker)],
            input=json.dumps({"contract_version": 1, "email": private_marker}),
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('"code":"invalid_request"', result.stdout)
        self.assertNotIn(private_marker, result.stdout)
        self.assertEqual(result.stderr, "")


if __name__ == "__main__":
    unittest.main()
