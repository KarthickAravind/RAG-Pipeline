from lxml import etree


def validate_xml(text: str) -> bool:
    try:
        etree.fromstring(text.encode("utf-8"))
        return True
    except Exception:
        return False


def validate_properties(text: str) -> bool:
    for ln in text.splitlines():
        if not ln.strip() or ln.strip().startswith('#'):
            continue
        if '=' not in ln:
            return False
    return True


