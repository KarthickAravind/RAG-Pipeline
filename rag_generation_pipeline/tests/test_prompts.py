from app.prompts import build_prompt


def test_build_prompt_contains_parts():
    prompt = build_prompt("Do X", "Context text", output_format="xml", language="groovy")
    assert "SAP iFlow" in prompt
    assert "Context:" in prompt
    assert "User Query:" in prompt
    assert "xml" in prompt
    assert "groovy" in prompt


