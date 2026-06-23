.PHONY: test run lint test-e2e test-unit

test:
	PYTEST_DISABLE_PLUGIN_AUTOLOAD=1 python -m pytest tests/ -v --tb=short

run:
	python pipeline.py \
	  --candidate fixtures/sample_candidate.json \
	  --jd fixtures/sample_jd.json

lint:
	ruff check . && mypy .

test-e2e:
	PYTEST_DISABLE_PLUGIN_AUTOLOAD=1 python -m pytest tests/test_e2e.py -v

test-unit:
	PYTEST_DISABLE_PLUGIN_AUTOLOAD=1 python -m pytest tests/ -v --ignore=tests/test_e2e.py
