#!/usr/bin/env python3
"""Worker interno de insights do Despezi: recebe agregados via stdin e nunca acessa SQLite."""
from __future__ import annotations

import json
import re
import sys
from typing import Any

CONTRACT_VERSION = 1
MAX_INPUT_BYTES = 16 * 1024
MAX_ITEMS = 32
MAX_COUNT = 1_000_000
MAX_USAGE_BASIS_POINTS = 100_000_000
CATEGORIES = {
    "alimentacao",
    "moradia",
    "transporte",
    "lazer",
    "saude",
    "educacao",
    "outros",
}
CATEGORY_PATTERN = re.compile(r"^[a-z0-9_-]{1,40}$")


class ContractError(ValueError):
    """Raised when the request does not satisfy the worker contract."""


def _has_exact_keys(value: dict[str, Any], expected: set[str]) -> bool:
    return set(value.keys()) == expected


def _bounded_count(value: Any) -> bool:
    return type(value) is int and 0 <= value <= MAX_COUNT


def validate_payload(payload: Any) -> dict[str, Any]:
    if not isinstance(payload, dict) or not _has_exact_keys(
        payload, {"contract_version", "budget_usage", "goals"}
    ):
        raise ContractError("invalid_request")
    if type(payload["contract_version"]) is not int or payload["contract_version"] != CONTRACT_VERSION:
        raise ContractError("invalid_request")

    budgets = payload["budget_usage"]
    if not isinstance(budgets, list) or len(budgets) > MAX_ITEMS:
        raise ContractError("invalid_request")
    seen_categories: set[str] = set()
    for budget in budgets:
        if not isinstance(budget, dict) or not _has_exact_keys(
            budget, {"category", "usage_basis_points"}
        ):
            raise ContractError("invalid_request")
        category = budget["category"]
        usage = budget["usage_basis_points"]
        if (
            not isinstance(category, str)
            or not CATEGORY_PATTERN.fullmatch(category)
            or category not in CATEGORIES
            or category in seen_categories
            or type(usage) is not int
            or usage < 0
            or usage > MAX_USAGE_BASIS_POINTS
        ):
            raise ContractError("invalid_request")
        seen_categories.add(category)

    goals = payload["goals"]
    expected_goal_keys = {
        "active_count",
        "completed_count",
        "shortfall_count",
        "deadline_only_count",
        "on_track_count",
    }
    if not isinstance(goals, dict) or not _has_exact_keys(goals, expected_goal_keys):
        raise ContractError("invalid_request")
    if not all(_bounded_count(goals[key]) for key in expected_goal_keys):
        raise ContractError("invalid_request")
    if goals["active_count"] + goals["completed_count"] > MAX_COUNT:
        raise ContractError("invalid_request")
    if (
        goals["shortfall_count"]
        + goals["deadline_only_count"]
        + goals["on_track_count"]
        != goals["active_count"]
    ):
        raise ContractError("invalid_request")
    return payload


def analyze(payload: Any) -> dict[str, Any]:
    request = validate_payload(payload)
    insights: list[dict[str, Any]] = []

    for budget in request["budget_usage"]:
        usage = budget["usage_basis_points"]
        if usage >= 10_000:
            insights.append(
                {
                    "code": "budget_limit_reached",
                    "category": budget["category"],
                    "message": (
                        "As despesas concluídas chegaram ou passaram do limite desta categoria "
                        "nesta competência. Nenhuma alteração foi feita automaticamente."
                    ),
                }
            )
        elif usage >= 8_000:
            insights.append(
                {
                    "code": "budget_near_limit",
                    "category": budget["category"],
                    "message": (
                        "As despesas concluídas já alcançaram 80% ou mais do limite desta "
                        "categoria nesta competência. Acompanhe os próximos lançamentos."
                    ),
                }
            )

    goals = request["goals"]
    if goals["completed_count"]:
        amount = goals["completed_count"]
        message = (
            "1 objetivo foi concluído pelo valor já juntado."
            if amount == 1
            else f"{amount} objetivos foram concluídos pelo valor já juntado."
        )
        insights.append(
            {
                "code": "goals_completed",
                "category": None,
                "message": message,
            }
        )
    if goals["shortfall_count"]:
        insights.append(
            {
                "code": "goals_plan_shortfall",
                "category": None,
                "message": (
                    "O aporte informado não cobre o prazo de um ou mais objetivos. "
                    "Revise aporte ou prazo; nenhum orçamento foi alterado."
                ),
            }
        )
    if goals["deadline_only_count"]:
        insights.append(
            {
                "code": "goals_deadline_estimate",
                "category": None,
                "message": (
                    "Um ou mais objetivos têm prazo definido sem aporte informado. "
                    "O aporte mensal necessário é uma estimativa linear, não uma garantia."
                ),
            }
        )
    if goals["on_track_count"]:
        insights.append(
            {
                "code": "goals_plan_on_track",
                "category": None,
                "message": (
                    "Pelos valores informados, o plano de um ou mais objetivos cobre o prazo. "
                    "É uma estimativa, não uma garantia de conclusão."
                ),
            }
        )

    return {"contract_version": CONTRACT_VERSION, "insights": insights}


def _write_error() -> None:
    sys.stdout.write(
        json.dumps(
            {"contract_version": CONTRACT_VERSION, "error": {"code": "invalid_request"}},
            separators=(",", ":"),
        )
        + "\n"
    )


def main() -> int:
    raw = sys.stdin.buffer.read(MAX_INPUT_BYTES + 1)
    if len(raw) > MAX_INPUT_BYTES:
        _write_error()
        return 2
    try:
        payload = json.loads(raw.decode("utf-8"))
        result = analyze(payload)
    except (UnicodeDecodeError, json.JSONDecodeError, ContractError):
        _write_error()
        return 2
    sys.stdout.write(json.dumps(result, ensure_ascii=False, separators=(",", ":")) + "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
