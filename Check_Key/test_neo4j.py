from neo4j import GraphDatabase

# Your credentials
NEO4J_URI = "neo4j+s://8825d8c1.databases.neo4j.io"
NEO4J_USERNAME = "neo4j"
NEO4J_PASSWORD = "v_cOIIdFcOnnZ4MQrOW9cfGiBLOj2HPE9bA9WUyUhUY"
NEO4J_DATABASE = "neo4j"   # default unless you created another

# Initialize driver
driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USERNAME, NEO4J_PASSWORD))
    
def test_relationships():
    with driver.session(database=NEO4J_DATABASE) as session:
        result = session.run("""
            MATCH (f:File)
            WHERE f.ext = '.py'
            RETURN f.name, f.path, f.size
            LIMIT 10;
        """)
        for record in result:
            print(record)

test_relationships()
