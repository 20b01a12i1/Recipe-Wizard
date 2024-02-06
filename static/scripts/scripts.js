let curr_state = 0; // Initial state

function updateState(new_state) {
  curr_state = new_state;
  console.log(curr_state);

  // Show/hide search containers based on the button clicked
  document.getElementById('searchIngredients').style.display = (new_state === 1) ? 'flex' : 'none';
  document.getElementById('searchCuisine').style.display = (new_state === 2) ? 'flex' : 'none';
}

function setRecipes(value) {
  // Placeholder implementation
  console.log('Setting recipes:', value);
}

function setRecipes1(value) {
  // Placeholder implementation
  console.log('Setting recipes by cuisine:', value);
}

async function handleSubmit() {
  try {
    const searchInputValue = document.querySelector('.search-input').value;
    console.log('Search Input Value:', searchInputValue);

    // Send a POST request to the Flask server
    const response = await fetch('http://localhost:5000/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ search_data: searchInputValue }),
    });

    const data = await response.json();
    console.log('Received data:', data);

    // Display the output in a dialog box
    openDialog(data);
    console.log(data);

  } catch (error) {
    console.error('Error submitting data:', error);
  }
}

async function handleSubmit1() {
  try {
    const searchInputValue = document.querySelector('.search-input1').value;
    console.log('Search Input Value:', searchInputValue);

    // Send a POST request to the Flask server
    const response = await fetch('http://localhost:5000/cuisine', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ search_data: searchInputValue }),
    });

    const data = await response.json();
    console.log('Received data:', data);

    // Display the output in a dialog box
    openDialog1(data);
    console.log(data);

  } catch (error) {
    console.error('Error submitting data:', error);
  }
}

function openDialog(data) {
  const outputDialog = document.getElementById('outputDialog');
  const outputText = document.getElementById('outputText');

  // Clear previous content
  outputText.innerHTML = '';

  // Add new content based on the response from the server
  for (const recipe of data.recipes) {
    for (const section of recipe) {
      const headlineElement = document.createElement('p');
      headlineElement.classList.add('headline');

      if (section.headline === 'TITLE') {
        headlineElement.innerHTML = `<span class="highlight">${section.headline}:</span> ${section.section}<br>`;
      } else {
        headlineElement.innerHTML = `<span class="highlight">${section.headline}:</span> <br>`;
      }

      outputText.appendChild(headlineElement);

      if (section.headline === 'INGREDIENTS') {
        const ingredientsList = document.createElement('ul');
        ingredientsList.classList.add('ingredient-list');

        for (const info of section.section_info) {
          const ingredientItem = document.createElement('p');
          ingredientItem.innerHTML = info;
          ingredientsList.appendChild(ingredientItem);
        }

        outputText.appendChild(ingredientsList);
      } else if (section.headline === 'DIRECTIONS') {
        const directionsList = document.createElement('ol');
        directionsList.classList.add('directions-list');

        for (const info of section.section_info) {
          const directionItem = document.createElement('p');
          directionItem.innerHTML = info;
          directionsList.appendChild(directionItem);
        }

        outputText.appendChild(directionsList);
      }

      outputText.innerHTML += "-".repeat(130) + "<br>";
    }
  }

  outputDialog.style.display = 'block';
}
function openDialog1(data) {
  const outputDialog = document.getElementById('outputDialog');
  const outputText = document.getElementById('outputText');

  // Clear previous content
  outputText.innerHTML = '';

  // Check if 'recipe' key exists in the data
  if (data.recipe) {
    const recipe = data.recipe;

    // Display recipe title
    const titleElement = document.createElement('p');
    titleElement.classList.add('recipe-title');
    titleElement.innerHTML = `<span class="highlight">Recipe:</span> ${recipe.title}<br>`;
    outputText.appendChild(titleElement);

    // Display ingredients
    const ingredientsTitleElement = document.createElement('p');
    ingredientsTitleElement.classList.add('section-title');
    ingredientsTitleElement.innerHTML = '<span class="highlight">Ingredients:</span><br>';
    outputText.appendChild(ingredientsTitleElement);

    const ingredientsList = document.createElement('ul');
    ingredientsList.classList.add('ingredient-list');

    for (const ingredient of recipe.ingredients) {
      const ingredientItem = document.createElement('li');
      ingredientItem.innerHTML = ingredient;
      ingredientsList.appendChild(ingredientItem);
    }

    outputText.appendChild(ingredientsList);

    // Display instructions
    const instructionsTitleElement = document.createElement('p');
    instructionsTitleElement.classList.add('section-title');
    instructionsTitleElement.innerHTML = '<span class="highlight">Instructions:</span><br>';
    outputText.appendChild(instructionsTitleElement);

    const instructionsList = document.createElement('ol');
    instructionsList.classList.add('instructions-list');

    for (const instruction of recipe.instructions) {
      const instructionItem = document.createElement('li');
      instructionItem.innerHTML = instruction;
      instructionsList.appendChild(instructionItem);
    }

    outputText.appendChild(instructionsList);

    outputDialog.style.display = 'block';
  } else {
    // If 'recipe' key is not present, display an error message
    outputText.innerHTML = 'Error: Recipe data not available.';
    outputDialog.style.display = 'block';
  }
}


function closeDialog() {
  const outputDialog = document.getElementById('outputDialog');
  outputDialog.style.display = 'none';
}
