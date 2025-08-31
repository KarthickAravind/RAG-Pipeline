from langchain.prompts import ChatPromptTemplate

ALLOWED_TYPES = "groovy, xml, properties, xslt"

PROMPTS = {
    "groovy": ChatPromptTemplate.from_messages([
        ("system", f"You are a Groovy code generator for SAP iFlow. Output only code inside [type=groovy]...[/type]. Allowed types: {ALLOWED_TYPES}"),
        ("human", "Task: {query}\nContext:\n{context}")
    ]),
    "xml": ChatPromptTemplate.from_messages([
        ("system", f"You are an SAP iFlow XML generator. Output valid XML inside [type=xml]...[/type]. Allowed types: {ALLOWED_TYPES}"),
        ("human", "Task: {query}\nContext:\n{context}")
    ]),
    "properties": ChatPromptTemplate.from_messages([
        ("system", f"You are a .properties generator. Output only properties content inside [type=properties]...[/type]."),
        ("human", "Task: {query}\nContext:\n{context}")
    ]),
    "xslt": ChatPromptTemplate.from_messages([
        ("system", f"You are an XSLT generator. Output valid XSLT wrapped in [type=xslt]...[/type]."),
        ("human", "Task: {query}\nContext:\n{context}")
    ]),
    "unknown": ChatPromptTemplate.from_messages([
        ("system", f"Infer artifact type and produce only allowed types wrapped in tags: {ALLOWED_TYPES}."),
        ("human", "Task: {query}\nContext:\n{context}")
    ]),
}


