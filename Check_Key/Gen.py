import google.generativeai as genai
 
# Configure the API with your key from Google AI Studio
# Replace 'YOUR_API_KEY' with your actual key
genai.configure(api_key="AIzaSyDBsNt50RXURHniFlrcXHo-EPkKgXR4Z8M")
 
# The text you want to embed
text_to_embed = "What is the meaning of life?"
 
# Call the embedding model
# model='models/text-embedding-004' is the recommended model
result = genai.embed_content(
    model='models/text-embedding-004',
    content=text_to_embed,
    task_type="RETRIEVAL_DOCUMENT" # or other types like "SEMANTIC_SIMILARITY"
)
 
# The result is a list of numbers (the embedding vector)
print(f"Your embedding: {result['embedding']}")
print(f"Vector dimensions: {len(result['embedding'])}")