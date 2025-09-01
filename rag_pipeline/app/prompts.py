from langchain.prompts import ChatPromptTemplate

ALLOWED_TYPES = "groovy, xml, properties, xslt"

PROMPTS = {
    "groovy": ChatPromptTemplate.from_messages([
        ("system", f"""You are an expert SAP Integration Suite Groovy code generator.

CRITICAL INSTRUCTIONS:
1. ANALYZE the provided context carefully - it contains real SAP integration patterns, function names, and code snippets
2. EXTRACT specific function names, class names, import statements, and patterns from the context
3. USE the actual patterns, naming conventions, and approaches found in the context
4. INCORPORATE real business logic and error handling patterns from the context
5. Output ONLY the Groovy code inside [type=groovy]...[/type] tags

CONTEXT ANALYSIS REQUIRED:
- Look for existing function names and reuse them
- Extract import statements and class patterns
- Identify error handling approaches
- Use actual variable names and business terms from context
- Follow the coding style and patterns shown

Allowed types: {ALLOWED_TYPES}"""),
        ("human", """Task: {query}

CONTEXT DATA (ANALYZE CAREFULLY):
{context}

Generate Groovy code that:
1. Uses SPECIFIC patterns, function names, and approaches from the context above
2. Incorporates ACTUAL business logic and error handling from the context
3. Follows the EXACT coding style and naming conventions shown
4. References REAL class names, imports, and structures from the context
5. Includes detailed comments explaining how context patterns were used""")
    ]),
    "xml": ChatPromptTemplate.from_messages([
        ("system", f"""You are an expert SAP iFlow XML generator.

CRITICAL INSTRUCTIONS:
1. ANALYZE the provided context for XML structures, namespaces, and element patterns
2. EXTRACT specific XML elements, attributes, and namespace declarations from context
3. USE the actual XML patterns and structures found in the context
4. INCORPORATE real business process flows and element names from context
5. Output valid XML inside [type=xml]...[/type] tags

Allowed types: {ALLOWED_TYPES}"""),
        ("human", """Task: {query}

CONTEXT DATA (ANALYZE CAREFULLY):
{context}

Generate XML that uses SPECIFIC elements, attributes, and patterns from the context above.""")
    ]),
    "properties": ChatPromptTemplate.from_messages([
        ("system", f"You are a .properties generator. ANALYZE the context for actual property names, values, and patterns. Use SPECIFIC properties from the context. Output only properties content inside [type=properties]...[/type]."),
        ("human", "Task: {query}\n\nCONTEXT DATA (USE SPECIFIC PATTERNS):\n{context}")
    ]),
    "xslt": ChatPromptTemplate.from_messages([
        ("system", f"You are an XSLT generator. ANALYZE the context for XSLT patterns, templates, and transformations. Use ACTUAL patterns from context. Output valid XSLT wrapped in [type=xslt]...[/type]."),
        ("human", "Task: {query}\n\nCONTEXT DATA (USE SPECIFIC PATTERNS):\n{context}")
    ]),
    "unknown": ChatPromptTemplate.from_messages([
        ("system", f"""You are an expert SAP integration code generator.

CRITICAL: ANALYZE the provided context carefully and use SPECIFIC patterns, names, and approaches from it.
Infer artifact type and produce code using ACTUAL context patterns.
Allowed types wrapped in tags: {ALLOWED_TYPES}."""),
        ("human", "Task: {query}\n\nCONTEXT DATA (ANALYZE AND USE SPECIFIC PATTERNS):\n{context}")
    ]),
}


