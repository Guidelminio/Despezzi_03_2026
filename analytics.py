"""Compatibilidade para chamadas antigas: encaminha JSON stdin ao worker seguro, sem acessar SQLite."""

from worker.insights_worker import main


if __name__ == "__main__":
    raise SystemExit(main())
