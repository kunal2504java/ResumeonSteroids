# Resume Pipeline

Deterministic, context-persisted resume tailoring pipeline with eight agents and
an end-to-end regression harness.

## Run

```powershell
python pipeline.py --candidate fixtures/sample_candidate.json --jd fixtures/sample_jd.json
```

This initializes a run context under `runs/{run_id}/context.json`. The full
backend pipeline is available programmatically via `run_pipeline(...)`.

## Tests

```powershell
$env:PYTEST_DISABLE_PLUGIN_AUTOLOAD='1'
python -m pytest tests -v
```

E2E coverage is in `tests/test_e2e.py` and uses deterministic mock LLM
responses from `fixtures/mock_llm_responses/`.
