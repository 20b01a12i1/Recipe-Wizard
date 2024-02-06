
from flask import Flask, render_template, request, jsonify
from transformers import FlaxAutoModelForSeq2SeqLM, AutoTokenizer
import json
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize

app = Flask(__name__)
MODEL_NAME_OR_PATH = "flax-community/t5-recipe-generation"
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME_OR_PATH, use_fast=True)
model = FlaxAutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME_OR_PATH)

prefix = "items: "
# generation_kwargs = {
#     "max_length": 512,
#     "min_length": 64,
#     "no_repeat_ngram_size": 3,
#     "early_stopping": True,
#     "num_beams": 5,
#     "length_penalty": 1.5,
# }
generation_kwargs = {
    "max_length": 512,
    "min_length": 64,
    "no_repeat_ngram_size": 3,
    "do_sample": True,
    "top_k": 60,
    "top_p": 0.95
}


special_tokens = tokenizer.all_special_tokens
tokens_map = {
    "<sep>": "--",
    "<section>": "\n"
}
def skip_special_tokens(text, special_tokens):
    for token in special_tokens:
        text = text.replace(token, "")

    return text

def target_postprocessing(texts, special_tokens):
    if not isinstance(texts, list):
        texts = [texts]

    new_texts = []
    for text in texts:
        text = skip_special_tokens(text, special_tokens)

        for k, v in tokens_map.items():
            text = text.replace(k, v)

        new_texts.append(text)

    return new_texts

def generation_function(texts):
    _inputs = texts if isinstance(texts, list) else [texts]
    inputs = [prefix + inp for inp in _inputs]
    inputs = tokenizer(
        inputs,
        max_length=256,
        padding="max_length",
        truncation=True,
        return_tensors="jax"
    )

    input_ids = inputs.input_ids
    attention_mask = inputs.attention_mask

    output_ids = model.generate(
        input_ids=input_ids,
        attention_mask=attention_mask,
        **generation_kwargs
    )
    generated = output_ids.sequences
    generated_recipe = target_postprocessing(
        tokenizer.batch_decode(generated, skip_special_tokens=False),
        special_tokens
    )
    return generated_recipe


# Download necessary NLTK resources
nltk.download('punkt')
nltk.download('stopwords')


def remove_stopwords(recipe_name):
    stop_words = set(stopwords.words('english'))
    words = word_tokenize(recipe_name)
    filtered_words = [word.lower() for word in words if word.isalpha() and word.lower() not in stop_words]
    return ' '.join(filtered_words)


def get_recipe_by_keywords(recipe_keywords, recipe_data):
    keywords_set = set(remove_stopwords(recipe_keywords).split())

    for recipe in recipe_data:
        recipe_name_set = set(remove_stopwords(recipe['Recipe_name']).split())
        if keywords_set.intersection(recipe_name_set):
            return recipe

    return None



@app.route('/')
def index():
    return render_template('index.html')  # Make sure to put your HTML file in a templates folder

@app.route('/submit', methods=['POST'])
def submit():
    try:
        search_data = request.json.get('search_data', '')

        # Your logic for generating recipes using the provided generation_function
        items = search_data.split(", ")  # Assuming input is comma-separated
        generated = generation_function(items)

        # Format the generated recipes
        formatted_recipes = []
        for text in generated:
            sections = text.split("\n")
            recipe_info = []
            for section in sections:
                section = section.strip()
                if section.startswith("title:"):
                    section = section.replace("title:", "")
                    headline = "TITLE"
                elif section.startswith("ingredients:"):
                    section = section.replace("ingredients:", "")
                    headline = "INGREDIENTS"
                elif section.startswith("directions:"):
                    section = section.replace("directions:", "")
                    headline = "DIRECTIONS"

                if headline == "TITLE":
                    recipe_info.append({"headline": headline, "section": section.strip().capitalize()})
                else:
                    section_info = [f"{i+1}: {info.strip().capitalize()}" for i, info in enumerate(section.split("--"))]
                    recipe_info.append({"headline": headline, "section_info": section_info})

            formatted_recipes.append(recipe_info)

        return jsonify({"recipes": formatted_recipes})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/cuisine", methods=['POST'])
def cuisine():
    # Load recipe data from the JSON file
    with open('data/recipes_output.json', 'r') as file:
        recipes = json.load(file)


    user_input = request.json.get('search_data', '')



    processed_user_input = remove_stopwords(user_input)

    # Get the recipe information based on the processed user input
    found_recipe = get_recipe_by_keywords(processed_user_input, recipes)

    response = {}

    # Display the recipe information if found, else show a message
    if found_recipe:
        response['status'] = 'success'
        response['recipe'] = {
            'title': found_recipe['Recipe_name'],
            'ingredients': found_recipe['Recipe_ingredients'],
            'instructions': found_recipe['Recipe_instructions']
        }
    else:
        response['status'] = 'error'
        response['message'] = f"Recipe with the name '{user_input}' not found."

    # Return the JSON response
    return jsonify(response)

if __name__ == '__main__':
    app.run(debug=True)