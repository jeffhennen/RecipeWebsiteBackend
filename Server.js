import { fileURLToPath } from 'url';
import { dirname } from 'path';
import express from 'express';
import bodyParser from 'body-parser';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import https from 'https';
import fs from 'fs';

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
  
  



app.post('/api/addRecipe', async (req, res) => {
    try {
        
        const reqRecipe = req.body;
    
        const recipe = await prisma.recipe.create({
          data: {
            name: "Summer Sausage",
            description: "Fantastic Summer Sausage recipe for the ages",
            steps: {
                stepsList: [
                    "Grind the meat, alternating",
                    "Season the meat",
                    "mix the meat",
                ]
            },
            Recipe_Ingredient: {
                create: {
                    ingredientId: 1,
                    quantity: 25,
                    measurement: "lbs"
                }
            }
            // Include any other fields you want to save
          },
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

    res.json(ingredients);
});

app.post('/api/Ingredients/AddIngredient', async (req, res) => {

    const ingredient = req.body;

    await prisma.ingredient.create(ingredient);
})

// Add your other routes and middleware here...
// (The same code you provided in the previous message)

const PORT = process.env.PORT || 3000;




app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
