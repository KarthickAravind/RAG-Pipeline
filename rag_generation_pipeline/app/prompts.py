from langchain.prompts import ChatPromptTemplate

ALLOWED_TYPES = "groovy, xml, properties, xslt"

PROMPTS = {
    "groovy": ChatPromptTemplate.from_messages([
        ("system", f"""You are a Groovy code generator for SAP iFlow. 
            Rules:
            - Always wrap code inside [type=groovy]...[/type].
            - Never invent new labels. Allowed types are: {ALLOWED_TYPES}.
            - Do not add explanations or text outside the tags.
            """),
        ("human", "Task: {query}\nContext:\n{context}")
    ]),

    "xml": ChatPromptTemplate.from_messages([
        ("system", f"""You are an SAP iFlow XML generator. 
        Rules:
        - Always wrap valid XML inside [type=xml]...[/type].
        - Never invent new labels. Allowed types are: {ALLOWED_TYPES}.
        """),
        ("human", "Task: {query}\nContext:\n{context}")
    ]),

    "properties": ChatPromptTemplate.from_messages([
        ("system", f"""You are a .properties generator.
        Rules:
        - Always wrap inside [type=properties]...[/type].
        - Never invent new labels. Allowed types are: {ALLOWED_TYPES}.
        """),
        ("human", "Task: {query}\nContext:\n{context}")
    ]),

    "xslt": ChatPromptTemplate.from_messages([
    ("system", "Output must be VALID XSLT (XML). Wrap it in [type=xslt]...[/type=xslt] markers."),
    ("human", "Task: {query}\nContext:\n{context}\nReturn XSLT only, inside [type=xslt]..."),
]),

    "unknown": ChatPromptTemplate.from_messages([
        ("system", f"""Infer the correct artifact type. 
            Rules:
            - Use only [type=groovy], [type=xml], [type=properties], or [type=xslt].
            - Never invent labels like [Integration] or [Java].
            - Wrap each artifact strictly inside its [type=...] block.
            """),
        ("human", "Task: {query}\nContext:\n{context}")
    ]),
}
