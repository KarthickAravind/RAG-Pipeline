from app.validation import validate_properties, validate_xml


def test_validate_xml_ok():
    ok, err = validate_xml("<root><a/></root>")
    assert ok
    assert err == ""


def test_validate_xml_bad():
    ok, err = validate_xml("<root><a></root>")
    assert not ok
    assert isinstance(err, str) and err


def test_validate_properties_ok():
    text = "a=1\n# comment\nkey.with.dot=value"
    ok, err = validate_properties(text)
    assert ok
    assert err == ""


def test_validate_properties_bad():
    ok, err = validate_properties("badline")
    assert not ok
    assert "=" in err


