"""
Knowledge Graph Service for Neo4j Integration
Handles structured queries and relationship discovery for SAP iFlow components
"""
import os
from typing import List, Dict, Any, Optional
from neo4j import GraphDatabase
from dotenv import load_dotenv

load_dotenv()


class KnowledgeGraphService:
    """
    Service for interacting with Neo4j Knowledge Graph
    Provides structured queries for SAP iFlow component relationships
    """
    
    def __init__(self):
        self.uri = os.getenv("NEO4J_URI")
        self.username = os.getenv("NEO4J_USERNAME")
        self.password = os.getenv("NEO4J_PASSWORD")
        self.database = os.getenv("NEO4J_DATABASE", "neo4j")
        self.driver = None
        self.discovered_extensions = []  # Will be populated during schema discovery
        
    def connect(self):
        """Initialize connection to Neo4j"""
        try:
            self.driver = GraphDatabase.driver(
                self.uri,
                auth=(self.username, self.password)
            )
            # Test connection
            with self.driver.session(database=self.database) as session:
                result = session.run("RETURN 1 as test")
                result.single()
            print("✅ Neo4j Knowledge Graph connected successfully!")

            # Discover the actual schema
            self._discover_schema()
            return True
        except Exception as e:
            print(f"❌ Neo4j connection failed: {e}")
            return False

    def _discover_schema(self):
        """Discover what's actually in the Neo4j database"""
        try:
            with self.driver.session(database=self.database) as session:
                # Get node labels
                result = session.run("CALL db.labels()")
                labels = [record["label"] for record in result]
                print(f"🔍 Available node labels: {labels}")

                # Get relationship types
                result = session.run("CALL db.relationshipTypes()")
                relationships = [record["relationshipType"] for record in result]
                print(f"🔍 Available relationships: {relationships}")

                # Get property keys
                result = session.run("CALL db.propertyKeys()")
                properties = [record["propertyKey"] for record in result]
                print(f"🔍 Available properties: {properties[:10]}...")  # Show first 10

                # Sample some nodes to understand structure
                result = session.run("MATCH (n) RETURN labels(n) as labels, keys(n) as properties LIMIT 5")
                print("🔍 Sample nodes:")
                for record in result:
                    print(f"   Labels: {record['labels']}, Properties: {record['properties']}")

                # Discover file types and extensions
                self._discover_file_structure()

        except Exception as e:
            print(f"⚠️ Schema discovery failed: {e}")

    def _discover_file_structure(self):
        """Discover what files actually exist in the KG"""
        try:
            with self.driver.session(database=self.database) as session:
                # Check if File nodes exist and what extensions they have
                file_query = """
                MATCH (f:File)
                RETURN f.ext as extension, count(*) as count
                ORDER BY count DESC
                LIMIT 10
                """

                result = session.run(file_query)
                file_extensions = [(record["extension"], record["count"]) for record in result]

                if file_extensions:
                    print(f"🔍 File extensions in KG: {file_extensions}")
                else:
                    print("🔍 No File nodes found in KG")

                # Sample some actual file names
                sample_files_query = """
                MATCH (f:File)
                RETURN f.name as name, f.ext as ext, f.path as path
                ORDER BY f.name
                LIMIT 8
                """

                result = session.run(sample_files_query)
                sample_files = [dict(record) for record in result]

                if sample_files:
                    print(f"🔍 Sample files: {[f['name'] for f in sample_files[:5]]}")
                    # Store discovered extensions for optimized search
                    self.discovered_extensions = [ext for ext, _ in file_extensions if ext]
                else:
                    print("🔍 No file samples found")
                    self.discovered_extensions = []

        except Exception as e:
            print(f"⚠️ File structure discovery failed: {e}")
            self.discovered_extensions = []
    
    def close(self):
        """Close Neo4j connection"""
        if self.driver:
            self.driver.close()
    
    def find_related_components(self, content_id: str, max_depth: int = 2) -> List[Dict[str, Any]]:
        """
        Find components related to a specific content piece
        Works with rich SAP iFlow Neo4j structure
        """
        # Strategy 1: Find SAP iFlow components (Adapters, Mappings, etc.)
        try:
            query = """
            MATCH (component)
            WHERE component:Adapter OR component:Mapping OR component:Step OR component:Gateway
            RETURN component.name as name,
                   labels(component) as labels,
                   component.type as component_type,
                   component.description as description,
                   component.id as component_id
            ORDER BY component.name
            LIMIT 8
            """

            with self.driver.session(database=self.database) as session:
                result = session.run(query)
                records = []
                for record in result:
                    if record["name"]:  # Only include if has name
                        records.append({
                            "name": record["name"],
                            "type": record["labels"][0] if record["labels"] else "Component",
                            "description": record["description"] or f"SAP iFlow {record['labels'][0] if record['labels'] else 'Component'}",
                            "relationship_type": "IFLOW_COMPONENT",
                            "distance": 1,
                            "properties": {"component_id": record["component_id"], "component_type": record["component_type"]}
                        })

                if records:
                    print(f"✅ Found {len(records)} SAP iFlow components")
                    return records

        except Exception as e:
            print(f"⚠️ iFlow component search failed: {e}")

        # Strategy 2: Find related systems and data objects
        return self._find_related_systems_and_data(content_id)

    def _find_related_systems_and_data(self, content_id: str) -> List[Dict[str, Any]]:
        """Find related systems and data objects"""
        try:
            query = """
            MATCH (item)
            WHERE item:System OR item:DataObject OR item:XSD OR item:PropertyFile
            RETURN item.name as name,
                   labels(item) as labels,
                   item.description as description,
                   item.type as item_type
            ORDER BY item.name
            LIMIT 5
            """

            with self.driver.session(database=self.database) as session:
                result = session.run(query)
                records = []
                for record in result:
                    if record["name"]:  # Only include if has name
                        records.append({
                            "name": record["name"],
                            "type": record["labels"][0] if record["labels"] else "System",
                            "description": record["description"] or f"SAP {record['labels'][0] if record['labels'] else 'System'}",
                            "relationship_type": "RELATED_SYSTEM",
                            "distance": 1
                        })

                print(f"✅ Found {len(records)} related systems/data objects")
                return records
        except Exception as e:
            print(f"⚠️ Systems search failed: {e}")
            return []

    def find_component_dependencies(self, component_name: str) -> List[Dict[str, Any]]:
        """
        Find dependencies for a specific SAP iFlow component
        Uses rich iFlow schema
        """
        try:
            # Look for properties and configuration dependencies
            query = """
            MATCH (prop:Property)
            RETURN prop.name as dependency_name,
                   prop.type as dependency_type,
                   prop.description as description,
                   prop.source as source
            ORDER BY prop.name
            LIMIT 5
            """

            with self.driver.session(database=self.database) as session:
                result = session.run(query)
                records = []
                for record in result:
                    if record["dependency_name"]:
                        records.append({
                            "name": record["dependency_name"],
                            "type": "Property",
                            "description": record["description"] or f"Configuration property: {record['dependency_name']}",
                            "relationship_type": "CONFIGURATION",
                            "distance": 1
                        })

                print(f"✅ Found {len(records)} configuration dependencies")
                return records
        except Exception as e:
            print(f"❌ KG dependency query failed for {component_name}: {e}")
            return []
    
    def find_integration_patterns(self, source_system: str, target_system: str) -> List[Dict[str, Any]]:
        """
        Find integration patterns between two systems
        """
        query = """
        MATCH (source {name: $source_system})-[r:INTEGRATES_WITH]->(target {name: $target_system})
        OPTIONAL MATCH (source)-[:USES_PATTERN]->(pattern)
        RETURN r.pattern_type as pattern_type,
               r.description as integration_description,
               pattern.name as pattern_name,
               pattern.implementation as pattern_implementation
        """
        
        try:
            with self.driver.session(database=self.database) as session:
                result = session.run(query, source_system=source_system, target_system=target_system)
                return [dict(record) for record in result]
        except Exception as e:
            print(f"❌ KG integration pattern query failed: {e}")
            return []
    
    def find_adapter_configurations(self, adapter_type: str) -> List[Dict[str, Any]]:
        """
        Find configuration requirements for specific adapter types
        Uses rich iFlow schema
        """
        try:
            # Find adapters and their properties
            query = """
            MATCH (adapter:Adapter)
            WHERE toLower(adapter.name) CONTAINS toLower($adapter_type)
               OR toLower(adapter.type) CONTAINS toLower($adapter_type)
            OPTIONAL MATCH (adapter)-[:HAS_ATTR|CONTAINS]->(prop:Property)
            RETURN adapter.name as adapter_name,
                   adapter.type as adapter_type,
                   adapter.description as adapter_description,
                   collect(prop.name) as properties
            LIMIT 3
            """

            with self.driver.session(database=self.database) as session:
                result = session.run(query, adapter_type=adapter_type)
                records = []
                for record in result:
                    if record["adapter_name"]:
                        records.append({
                            "name": record["adapter_name"],
                            "type": "Adapter",
                            "description": record["adapter_description"] or f"{record['adapter_type']} adapter configuration",
                            "relationship_type": "ADAPTER_CONFIG",
                            "distance": 1,
                            "properties": {"adapter_type": record["adapter_type"], "config_properties": record["properties"]}
                        })

                print(f"✅ Found {len(records)} adapter configurations for {adapter_type}")
                return records
        except Exception as e:
            print(f"❌ KG adapter config query failed for {adapter_type}: {e}")
            return []
    
    def search_by_relationship(self, relationship_query: str) -> List[Dict[str, Any]]:
        """
        Generic relationship search based on natural language query
        Maps common relationship questions to Cypher queries
        """
        # Simple query mapping - can be enhanced with NLP
        if "connects to" in relationship_query.lower():
            return self._find_connections(relationship_query)
        elif "depends on" in relationship_query.lower():
            return self._find_dependencies_generic(relationship_query)
        elif "compatible with" in relationship_query.lower():
            return self._find_compatibility(relationship_query)
        else:
            return self._generic_search(relationship_query)
    
    def _find_connections(self, query: str) -> List[Dict[str, Any]]:
        """Find connection relationships"""
        cypher = """
        MATCH (a)-[r:CONNECTS_TO|INTEGRATES_WITH]->(b)
        WHERE toLower(a.name) CONTAINS toLower($search_term) 
           OR toLower(b.name) CONTAINS toLower($search_term)
        RETURN a.name as source, 
               type(r) as relationship, 
               b.name as target,
               r.description as description
        LIMIT 10
        """
        
        # Extract search term from query (simple approach)
        search_term = query.replace("connects to", "").replace("what", "").strip()
        
        try:
            with self.driver.session(database=self.database) as session:
                result = session.run(cypher, search_term=search_term)
                return [dict(record) for record in result]
        except Exception as e:
            print(f"❌ KG connection search failed: {e}")
            return []
    
    def _find_dependencies_generic(self, query: str) -> List[Dict[str, Any]]:
        """Find dependency relationships"""
        cypher = """
        MATCH (a)-[r:DEPENDS_ON|REQUIRES]->(b)
        WHERE toLower(a.name) CONTAINS toLower($search_term)
        RETURN a.name as component, 
               type(r) as relationship, 
               b.name as dependency,
               b.type as dependency_type
        LIMIT 10
        """
        
        search_term = query.replace("depends on", "").replace("what", "").strip()
        
        try:
            with self.driver.session(database=self.database) as session:
                result = session.run(cypher, search_term=search_term)
                return [dict(record) for record in result]
        except Exception as e:
            print(f"❌ KG dependency search failed: {e}")
            return []
    
    def _find_compatibility(self, query: str) -> List[Dict[str, Any]]:
        """Find compatibility relationships"""
        cypher = """
        MATCH (a)-[r:COMPATIBLE_WITH]->(b)
        WHERE toLower(a.name) CONTAINS toLower($search_term) 
           OR toLower(b.name) CONTAINS toLower($search_term)
        RETURN a.name as component1, 
               b.name as component2,
               r.version_compatibility as version_info
        LIMIT 10
        """
        
        search_term = query.replace("compatible with", "").replace("what", "").strip()
        
        try:
            with self.driver.session(database=self.database) as session:
                result = session.run(cypher, search_term=search_term)
                return [dict(record) for record in result]
        except Exception as e:
            print(f"❌ KG compatibility search failed: {e}")
            return []
    
    def _generic_search(self, query: str) -> List[Dict[str, Any]]:
        """Generic search across all nodes"""
        cypher = """
        MATCH (n)
        WHERE toLower(n.name) CONTAINS toLower($search_term) 
           OR toLower(n.description) CONTAINS toLower($search_term)
        RETURN n.name as name, 
               n.type as type, 
               n.description as description
        LIMIT 10
        """
        
        try:
            with self.driver.session(database=self.database) as session:
                result = session.run(cypher, search_term=query)
                return [dict(record) for record in result]
        except Exception as e:
            print(f"❌ KG generic search failed: {e}")
            return []

    def _generic_related_search(self, content_id: str) -> List[Dict[str, Any]]:
        """Generic fallback search for related content"""
        try:
            # Simple query to get any nodes - useful for discovering data structure
            query = """
            MATCH (n)
            RETURN n.name as name,
                   labels(n) as labels,
                   keys(n) as properties
            LIMIT 3
            """

            with self.driver.session(database=self.database) as session:
                result = session.run(query)
                records = [dict(record) for record in result]
                print(f"🔍 Sample KG data: {records}")
                return []  # Return empty for now, just for discovery
        except Exception as e:
            print(f"❌ Generic search failed: {e}")
            return []

    def find_components_by_keywords(self, keywords: List[str]) -> List[Dict[str, Any]]:
        """
        Find SAP iFlow components based on content keywords
        Content-aware approach with improved search strategy
        """
        if not keywords:
            return []

        try:
            with self.driver.session(database=self.database) as session:
                # First, let's see what components we actually have
                discovery_query = """
                MATCH (component)
                WHERE component:Adapter OR component:Mapping OR component:Gateway OR component:System
                RETURN component.name as name,
                       labels(component) as labels,
                       component.type as component_type,
                       component.description as description
                ORDER BY component.name
                LIMIT 10
                """

                discovery_result = session.run(discovery_query)
                sample_components = [dict(record) for record in discovery_result]
                print(f"🔍 Sample components in KG: {[comp['name'] for comp in sample_components[:5] if comp['name']]}")

                # Strategy 1: Look for high-priority keywords first (certificate, ssl, https, adapter)
                priority_keywords = [kw for kw in keywords if kw in ['certificate', 'ssl', 'https', 'adapter', 'authentication', 'security']]

                if priority_keywords:
                    priority_conditions = []
                    for keyword in priority_keywords:
                        priority_conditions.append(f"toLower(component.name) CONTAINS '{keyword}'")
                        priority_conditions.append(f"toLower(component.description) CONTAINS '{keyword}'")
                        priority_conditions.append(f"toLower(component.type) CONTAINS '{keyword}'")

                    priority_where = " OR ".join(priority_conditions)

                    priority_query = f"""
                    MATCH (component)
                    WHERE (component:Adapter OR component:Mapping OR component:Gateway OR component:System)
                      AND ({priority_where})
                    RETURN component.name as name,
                           labels(component) as labels,
                           component.type as component_type,
                           component.description as description,
                           component.id as component_id
                    ORDER BY component.name
                    LIMIT 4
                    """

                    result = session.run(priority_query)
                    records = []
                    for record in result:
                        if record["name"]:
                            records.append({
                                "name": record["name"],
                                "type": record["labels"][0] if record["labels"] else "Component",
                                "description": record["description"] or f"SAP iFlow {record['labels'][0] if record['labels'] else 'Component'}",
                                "relationship_type": "CONTENT_RELATED",
                                "distance": 1,
                                "properties": {"component_id": record["component_id"], "component_type": record["component_type"]}
                            })

                    if records:
                        print(f"✅ Found {len(records)} priority components for keywords: {priority_keywords}")
                        return records

                # Strategy 2: If no priority matches, look for any Adapters or Systems (more relevant than Steps)
                fallback_query = """
                MATCH (component)
                WHERE component:Adapter OR component:System OR component:Gateway
                RETURN component.name as name,
                       labels(component) as labels,
                       component.type as component_type,
                       component.description as description,
                       component.id as component_id
                ORDER BY component.name
                LIMIT 3
                """

                result = session.run(fallback_query)
                records = []
                for record in result:
                    if record["name"]:
                        records.append({
                            "name": record["name"],
                            "type": record["labels"][0] if record["labels"] else "Component",
                            "description": record["description"] or f"SAP iFlow {record['labels'][0] if record['labels'] else 'Component'}",
                            "relationship_type": "RELATED_COMPONENT",
                            "distance": 1,
                            "properties": {"component_id": record["component_id"], "component_type": record["component_type"]}
                        })

                print(f"✅ Found {len(records)} fallback components (Adapters/Systems/Gateways)")
                return records

        except Exception as e:
            print(f"❌ Keyword-based component search failed: {e}")
            return []

    def find_properties_by_keywords(self, keywords: List[str]) -> List[Dict[str, Any]]:
        """
        Find configuration properties based on content keywords
        Enhanced with better targeting
        """
        if not keywords:
            return []

        try:
            # First, let's see what properties we actually have
            discovery_query = """
            MATCH (prop:Property)
            RETURN prop.name as name,
                   prop.type as prop_type,
                   prop.description as description
            ORDER BY prop.name
            LIMIT 10
            """

            with self.driver.session(database=self.database) as session:
                discovery_result = session.run(discovery_query)
                sample_props = [dict(record) for record in discovery_result]
                print(f"🔍 Sample properties in KG: {[prop['name'] for prop in sample_props[:5] if prop['name']]}")

            # Look for configuration-specific keywords
            config_keywords = [kw for kw in keywords if kw in ['certificate', 'ssl', 'timeout', 'connection', 'authentication', 'security', 'keystore', 'truststore']]

            if config_keywords:
                keyword_conditions = []
                for keyword in config_keywords:
                    keyword_conditions.append(f"toLower(prop.name) CONTAINS '{keyword}'")
                    keyword_conditions.append(f"toLower(prop.description) CONTAINS '{keyword}'")

                where_clause = " OR ".join(keyword_conditions)

                query = f"""
                MATCH (prop:Property)
                WHERE {where_clause}
                RETURN prop.name as name,
                       prop.type as prop_type,
                       prop.description as description,
                       prop.source as source
                ORDER BY prop.name
                LIMIT 4
                """

                result = session.run(query)
                records = []
                for record in result:
                    if record["name"]:
                        records.append({
                            "name": record["name"],
                            "type": "Property",
                            "description": record["description"] or f"Configuration property: {record['name']}",
                            "relationship_type": "CONFIG_PROPERTY",
                            "distance": 1,
                            "properties": {"prop_type": record["prop_type"], "source": record["source"]}
                        })

                if records:
                    print(f"✅ Found {len(records)} targeted properties for keywords: {config_keywords}")
                    return records

            # Fallback: return any properties (better than nothing)
            fallback_query = """
            MATCH (prop:Property)
            RETURN prop.name as name,
                   prop.type as prop_type,
                   prop.description as description,
                   prop.source as source
            ORDER BY prop.name
            LIMIT 3
            """

            result = session.run(fallback_query)
            records = []
            for record in result:
                if record["name"]:
                    records.append({
                        "name": record["name"],
                        "type": "Property",
                        "description": record["description"] or f"Configuration property: {record['name']}",
                        "relationship_type": "GENERAL_PROPERTY",
                        "distance": 1,
                        "properties": {"prop_type": record["prop_type"], "source": record["source"]}
                    })

            print(f"✅ Found {len(records)} fallback properties")
            return records

        except Exception as e:
            print(f"❌ Keyword-based property search failed: {e}")
            return []

    def find_business_process_steps(self, keywords: List[str]) -> List[Dict[str, Any]]:
        """
        Find business process steps based on keywords
        Adapted for your business process-oriented KG
        """
        if not keywords:
            return []

        try:
            with self.driver.session(database=self.database) as session:
                # Look for Steps that match business keywords
                keyword_conditions = []
                for keyword in keywords:
                    keyword_conditions.append(f"toLower(step.name) CONTAINS '{keyword}'")

                where_clause = " OR ".join(keyword_conditions)

                query = f"""
                MATCH (step:Step)
                WHERE {where_clause}
                RETURN step.name as name,
                       step.type as step_type,
                       step.description as description,
                       step.id as step_id
                ORDER BY step.name
                LIMIT 4
                """

                result = session.run(query)
                records = []
                for record in result:
                    if record["name"]:
                        records.append({
                            "name": record["name"],
                            "type": "BusinessStep",
                            "description": record["description"] or f"Business process step: {record['name']}",
                            "relationship_type": "BUSINESS_PROCESS",
                            "distance": 1,
                            "properties": {"step_type": record["step_type"], "step_id": record["step_id"]}
                        })

                print(f"✅ Found {len(records)} business process steps for keywords: {keywords}")
                return records

        except Exception as e:
            print(f"❌ Business process search failed: {e}")
            return []

    def find_any_relevant_components(self, keywords: List[str]) -> List[Dict[str, Any]]:
        """
        Find any components that might be relevant (fallback strategy)
        """
        try:
            with self.driver.session(database=self.database) as session:
                # Just get some Adapters, Systems, or Gateways regardless of keywords
                query = """
                MATCH (component)
                WHERE component:Adapter OR component:System OR component:Gateway
                RETURN component.name as name,
                       labels(component) as labels,
                       component.type as component_type,
                       component.description as description
                ORDER BY component.name
                LIMIT 3
                """

                result = session.run(query)
                records = []
                for record in result:
                    if record["name"]:
                        records.append({
                            "name": record["name"],
                            "type": record["labels"][0] if record["labels"] else "Component",
                            "description": record["description"] or f"SAP iFlow {record['labels'][0]}",
                            "relationship_type": "GENERAL_COMPONENT",
                            "distance": 1
                        })

                print(f"✅ Found {len(records)} general components as fallback")
                return records

        except Exception as e:
            print(f"❌ Fallback component search failed: {e}")
            return []

    def find_related_files(self, keywords: List[str]) -> List[Dict[str, Any]]:
        """
        Find related files using discovered file structure and content keywords
        """
        try:
            with self.driver.session(database=self.database) as session:
                # Strategy 1: Use discovered extensions if available
                extensions_to_search = getattr(self, 'discovered_extensions', [])

                if not extensions_to_search:
                    # Fallback to common SAP iFlow extensions
                    extensions_to_search = ['groovy', 'gsh', 'xml', 'xslt', 'properties', 'json', 'js', 'py']

                # Strategy 2: Search by file name keywords first
                if keywords:
                    keyword_conditions = []
                    for keyword in keywords[:3]:  # Use top 3 keywords
                        keyword_conditions.append(f"toLower(file.name) CONTAINS '{keyword}'")

                    keyword_where = " OR ".join(keyword_conditions)

                    keyword_query = f"""
                    MATCH (file:File)
                    WHERE ({keyword_where})
                    RETURN file.name as name,
                           file.ext as file_type,
                           file.path as path,
                           file.size as size
                    ORDER BY file.name
                    LIMIT 4
                    """

                    result = session.run(keyword_query)
                    records = []
                    for record in result:
                        if record["name"]:
                            records.append({
                                "name": record["name"],
                                "type": "File",
                                "description": f"SAP iFlow {record['file_type'] or 'file'} - matches content keywords",
                                "relationship_type": "CONTENT_RELATED_FILE",
                                "distance": 1,
                                "properties": {"file_type": record["file_type"], "path": record["path"]}
                            })

                    if records:
                        print(f"✅ Found {len(records)} keyword-matching files")
                        return records

                # Strategy 3: Search by discovered extensions
                if extensions_to_search:
                    # Convert to string format for Cypher query
                    ext_list = [f"'{ext}'" for ext in extensions_to_search[:8]]  # Limit to 8 extensions
                    ext_string = ", ".join(ext_list)

                    extension_query = f"""
                    MATCH (file:File)
                    WHERE file.ext IN [{ext_string}]
                    RETURN file.name as name,
                           file.ext as file_type,
                           file.path as path,
                           file.size as size
                    ORDER BY file.name
                    LIMIT 4
                    """

                    result = session.run(extension_query)
                    records = []
                    for record in result:
                        if record["name"]:
                            records.append({
                                "name": record["name"],
                                "type": "File",
                                "description": f"SAP iFlow {record['file_type']} file",
                                "relationship_type": "RELATED_FILE",
                                "distance": 1,
                                "properties": {"file_type": record["file_type"], "path": record["path"]}
                            })

                    print(f"✅ Found {len(records)} files with discovered extensions: {extensions_to_search[:5]}")
                    return records

                # Strategy 4: Fallback - any files
                fallback_query = """
                MATCH (file:File)
                RETURN file.name as name,
                       file.ext as file_type,
                       file.path as path
                ORDER BY file.name
                LIMIT 3
                """

                result = session.run(fallback_query)
                records = []
                for record in result:
                    if record["name"]:
                        records.append({
                            "name": record["name"],
                            "type": "File",
                            "description": f"File: {record['name']}",
                            "relationship_type": "GENERAL_FILE",
                            "distance": 1,
                            "properties": {"file_type": record["file_type"]}
                        })

                print(f"✅ Found {len(records)} files as fallback")
                return records

        except Exception as e:
            print(f"❌ Enhanced file search failed: {e}")
            return []


# Global instance
_kg_service = None

def get_knowledge_graph_service() -> KnowledgeGraphService:
    """Get or create KG service instance"""
    global _kg_service
    if _kg_service is None:
        _kg_service = KnowledgeGraphService()
        _kg_service.connect()
    return _kg_service
