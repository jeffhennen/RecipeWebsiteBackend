import { fileURLToPath } from 'url';
import { dirname } from 'path';
import express from 'express';
import bodyParser from 'body-parser';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import https from 'https';
import fs from 'fs';
import { create } from 'domain';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

const prisma = new PrismaClient({});

app.get('/', async (req, res) =>{

    // const recipes = await prisma.recipe.findMany();
    res.send('Hello');
})

app.get('/api/recipes', async (req, res) =>{

    const recipes = await prisma.recipe.findMany();
    
    res.json(recipes);
})

app.get('/api/recipeCards', async (req, res) =>{

    const recipes = await prisma.recipe.findMany({
        select: {
            id: true,
            name: true,
            description: true,
        }
    });
    res.send(JSON.stringify(recipes));
})


app.get('/api/recipes/:id', async (req, res) => {

    const recipe_id = req.params.id;
    const recipe = await prisma.recipe.findUnique({
        where: {
            id:  Number(recipe_id)
        },
        include: {
            Recipe_Ingredient: {
                include: {
                    ingredient:{
                        select: {
                            name: true
                        }
                    }
                }
            } 
        } 
    })

    res.send(recipe);
})



app.delete('/api/recipes/:id', async (req, res) => {
    console.log(req.body);
    try {
        const recipeId = Number(req.params.id);
        await prisma.recipe.delete({
            where: {
                id: recipeId,
            },
            include:{
                Recipe_Ingredient:true,
            }
        });
        res.status(200).json({ message: 'Recipe deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete recipe' });
    }
});

  app.put('/api/recipes/:id', async (req, res) => {
    try {
      const recipeId = Number(req.params.id);
      const {
        name,
        description,
        steps,
        notes,
        Recipe_Ingredient,
      } = req.body;
  
      const recipe_ingredientNoID = [];
      const recipe_ingredientsID = [];
  
      Recipe_Ingredient.forEach((ingredient) => {
        if (ingredient.id) {
          recipe_ingredientsID.push(ingredient);
        } else {
          recipe_ingredientNoID.push(ingredient);
        }
      });
  
      // Fetch the existing recipe with its associated Recipe_Ingredient
      const existingRecipe = await prisma.recipe.findUnique({
        where: {
          id: recipeId,
        },
        include: {
          Recipe_Ingredient: true,
        },
      });
  
      if (!existingRecipe) {
        return res.status(404).json({ error: 'Recipe not found' });
      }
  
      // Delete extra recipe_ingredient records
      const existingRecipeIngredientIds = existingRecipe.Recipe_Ingredient.map(
        (ingredient) => ingredient.id
      );
  
      const recipeIngredientsToDelete = existingRecipeIngredientIds.filter(
        (id) => !recipe_ingredientsID.some((ingredient) => ingredient.id === id)
      );
  
      console.log(req.body)
      if (recipeIngredientsToDelete.length > 0) {
        await prisma.Recipe_Ingredient.deleteMany({
          where: {
            id: {
              in: recipeIngredientsToDelete,
            },
          },
        });
      }
  
      // Update the recipe and its Recipe_Ingredient
      const updatedRecipe = await prisma.recipe.update({
        where: {
          id: recipeId,
        },
        data: {
          name: name,
          description: description,
          steps: steps,
          notes: notes,
          Recipe_Ingredient: {
            updateMany: recipe_ingredientsID.map((ingredient) => ({
              where: { id: ingredient.id },
              data: {
                ingredientId: Number(ingredient.ingredientId),
                quantity: parseFloat(ingredient.quantity),
                measurement: ingredient.measurement,
              },
            })),
            create: recipe_ingredientNoID.map((ingredient) => ({
              ingredientId: Number(ingredient.ingredientId),
              quantity: parseFloat(ingredient.quantity),
              measurement: ingredient.measurement,
            })),
          },
        },
        include: {
          Recipe_Ingredient: true,
        },
      });
  
      res.status(200).json(updatedRecipe);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to update recipe' });
    }
  });
  
  

  app.post('/api/recipes/addRecipe', async (req, res) => {
    try {
        
        const reqRecipe = req.body;
        console.log(reqRecipe);
    
        const recipe = await prisma.recipe.create({
          data: {
            name: reqRecipe.name,
            description: reqRecipe.description,
            steps: reqRecipe.steps,
            notes: reqRecipe.notes,
            Recipe_Ingredient: {
              create: reqRecipe.Recipe_Ingredient.map(ingredient =>{
                return {
                  ingredient: {
                    connect: { id: Number(ingredient.ingredientId) },
                  },
                  quantity: Number(ingredient.quantity),
                  measurement: ingredient.measurement
                }
                
              }),

            },

          },
          include:{
            Recipe_Ingredient: {
              include: {
                ingredient: true
              }
            }
          }
        });
    
        console.log(recipe);
        res.status(200).json(recipe);
      } catch (error) {
        // Handle the error
        console.error(error);
        res.status(500).json({ error: 'Failed to add recipe' });
      }
})

app.get('/api/Ingredients', async (req, res) => {

    const ingredients = await prisma.ingredient.findMany();

    res.send(ingredients);
});

app.post('/api/Ingredients', async (req, res) => {
  try {
    const ingredient = req.body;

    console.log(ingredient)
    const createdIngredient = await prisma.ingredient.create({
      data:{
        name: ingredient.name,
        description: ingredient.description,
      }

    });

    // Send the ID of the created ingredient in the response
    res.status(201).json({ id: createdIngredient.id });
  } catch (error) {
    // Handle the error
    console.error(error);
    res.status(500).json({ error: 'Failed to add ingredient' });
  }
});

app.delete('/api/ingredients/:ingredientId', async (req, res) => {
  const ingredientId = Number(req.params.ingredientId);

  try {
    // Check if there are any recipe_ingredients associated with the ingredient
    const recipeIngredientsCount = await prisma.Recipe_Ingredient.count({
      where: {
        ingredientId: ingredientId,
      },
    });

    if (recipeIngredientsCount > 0) {
      return res.status(400).json({ error: 'Cannot delete the ingredient as it is in use by some recipes.' });
    }

    // If there are no recipe_ingredients, proceed with the deletion
    const deletedIngredient = await prisma.ingredient.delete({
      where: {
        id: ingredientId,
      },
    });

    res.status(200).json(deletedIngredient);
  } catch (error) {
    // Handle the error
    console.error(error);
    res.status(500).json({ error: 'Failed to delete the ingredient' });
  }
});

app.put('/api/ingredients', async (req, res) => {
  try {
    const updatedIngredients = req.body;
    console.log(updatedIngredients);

    // Iterate through each updated ingredient and perform the update
    for (const updatedIngredient of updatedIngredients) {
      const { id, name, description } = updatedIngredient;

      // Find the ingredient in the database by its ID
      const ingredient = await prisma.ingredient.findUnique({
        where: {
          id: id,
        },
      });

      // If the ingredient is not found, skip to the next one
      if (!ingredient) {
        continue;
      }

      // Perform the update
      await prisma.ingredient.update({
        where: {
          id: id,
        },
        data: {
          name: name,
          description: description,
        },
      });
    }

    res.status(200).json({ message: 'Ingredients updated successfully' });
  } catch (error) {
    // Handle the error
    console.error(error);
    res.status(500).json({ error: 'Failed to update ingredients' });
  }
});


// Add your other routes and middleware here...
// (The same code you provided in the previous message)

const PORT = process.env.PORT || 3000;




app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
