import { getPool } from '../config/db.js';
import fs from 'fs';

// Complete seed list of all 48 food items with realistic Indian Rupee prices
const defaultSeedFoods = [
  { name: "Greek Salad", price: 199, description: "Fresh cucumbers, ripe tomatoes, olives, red onion, and creamy feta cheese tossed in olive oil", category: "Salad", image: "food_1.png" },
  { name: "Veg Salad", price: 169, description: "Crispy garden greens mixed with avocado, heirloom tomatoes, and tangy lemon vinaigrette", category: "Salad", image: "food_2.png" },
  { name: "Clover Salad", price: 189, description: "Nutritious microgreens, baby spinach, toasted walnuts, and goat cheese with honey mustard", category: "Salad", image: "food_3.png" },
  { name: "Chicken Salad", price: 249, description: "Tender grilled chicken breast strips over romaine, cherry tomatoes, and parmesan dressing", category: "Salad", image: "food_4.png" },

  { name: "Lasagna Rolls", price: 189, description: "Savory pasta sheets rolled with ricotta, marinara sauce, herbs, and melted mozzarella", category: "Rolls", image: "food_5.png" },
  { name: "Peri Peri Rolls", price: 169, description: "Spicy peri peri glazed veggies and cottage cheese wrapped in a warm crispy flatbread", category: "Rolls", image: "food_6.png" },
  { name: "Chicken Rolls", price: 229, description: "Juicy marinated chicken tikka chunks wrapped with mint chutney and crisp onions", category: "Rolls", image: "food_7.png" },
  { name: "Veg Rolls", price: 149, description: "Stir-fried spiced vegetables and paneer wrapped in a delicate buttery wheat roll", category: "Rolls", image: "food_8.png" },

  { name: "Ripple Ice Cream", price: 139, description: "Creamy vanilla bean ice cream infused with rich raspberry swirl and chocolate flakes", category: "Deserts", image: "food_9.png" },
  { name: "Fruit Ice Cream", price: 169, description: "Refreshingly light gelato loaded with fresh mango, passionfruit, and berry chunks", category: "Deserts", image: "food_10.png" },
  { name: "Jar Ice Cream", price: 149, description: "Layered artisanal ice cream sundae jar with caramel drizzle, brownie crumble & cream", category: "Deserts", image: "food_11.png" },
  { name: "Vanilla Ice Cream", price: 119, description: "Classic Madagascar vanilla bean ice cream served with warm chocolate drizzle", category: "Deserts", image: "food_12.png" },

  { name: "Chicken Sandwich", price: 199, description: "Seasoned grilled chicken breast, crisp lettuce, tomato, and garlic mayo on sourdough", category: "Sandwich", image: "food_13.png" },
  { name: "Vegan Sandwich", price: 169, description: "Creamy avocado mash, roasted red peppers, spinach, and hummus on whole grain bread", category: "Sandwich", image: "food_14.png" },
  { name: "Grilled Sandwich", price: 149, description: "Triple layered golden toasted sandwich stuffed with cheddar, mozzarella, and herbs", category: "Sandwich", image: "food_15.png" },
  { name: "Bread Sandwich", price: 179, description: "Artisanal bakery brioche sandwich with smoked turkey, swiss cheese, and honey mustard", category: "Sandwich", image: "food_16.png" },

  { name: "Cup Cake", price: 99, description: "Moist red velvet cupcake topped with silky cream cheese frosting and sweet sprinkles", category: "Cake", image: "food_17.png" },
  { name: "Vegan Cake", price: 249, description: "Plant-based dark chocolate fudge cake layered with coconut ganache and berry glaze", category: "Cake", image: "food_18.png" },
  { name: "Butterscotch Cake", price: 349, description: "Rich butterscotch sponge cake dressed with crunchy praline and salted caramel drip", category: "Cake", image: "food_19.png" },
  { name: "Sliced Cake", price: 179, description: "Fluffy vanilla sponge cake slice layered with fresh whipped cream and strawberries", category: "Cake", image: "food_20.png" },

  { name: "Garlic Mushroom", price: 219, description: "Button mushrooms sautéed in extra virgin olive oil, garlic butter, and fresh parsley", category: "Pure Veg", image: "food_21.png" },
  { name: "Fried Cauliflower", price: 189, description: "Crispy battered cauliflower florets tossed in sweet chili sesame glaze", category: "Pure Veg", image: "food_22.png" },
  { name: "Mix Veg Pulao", price: 199, description: "Fragrant basmati rice cooked with fresh seasonal vegetables and aromatic whole spices", category: "Pure Veg", image: "food_23.png" },
  { name: "Rice Zucchini", price: 179, description: "Light herb-infused wild rice tossed with grilled zucchini, cherry tomatoes, and olive oil", category: "Pure Veg", image: "food_24.png" },

  { name: "Cheese Pasta", price: 249, description: "Al dente penne pasta smothered in a rich 4-cheese sauce with parmesan crisp topping", category: "Pasta", image: "food_25.png" },
  { name: "Tomato Pasta", price: 219, description: "Classic Italian spaghetti tossed in slow-simmered San Marzano tomato basil ragu", category: "Pasta", image: "food_26.png" },
  { name: "Creamy Pasta", price: 259, description: "Fettuccine pasta coat in velvety garlic cream sauce with fresh spinach and nutmeg", category: "Pasta", image: "food_27.png" },
  { name: "Chicken Pasta", price: 299, description: "Sautéed chicken breast strips and rigatoni in spicy tomato cream sauce", category: "Pasta", image: "food_28.png" },

  { name: "Butter Noodles", price: 179, description: "Wok-tossed egg noodles coat in brown garlic butter and spring onions", category: "Noodles", image: "food_29.png" },
  { name: "Veg Noodles", price: 159, description: "Hakka style stir-fried noodles with crisp bell peppers, cabbage, and soy glaze", category: "Noodles", image: "food_30.png" },
  { name: "Somen Noodles", price: 229, description: "Chilled Japanese wheat noodles served with dipping sauce, ginger, and sesame seeds", category: "Noodles", image: "food_31.png" },
  { name: "Cooked Noodles", price: 199, description: "Pan-fried noodles with mushrooms, baby corn, and savory oyster sauce drip", category: "Noodles", image: "food_32.png" },

  { name: "Pepperoni Feast Pizza", price: 399, description: "Wood-fired crust loaded with spicy pepperoni, melted mozzarella, and oregano", category: "Pizza", image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=600&q=80" },
  { name: "Margherita Supreme", price: 299, description: "Artisanal sourdough crust topped with fresh mozzarella, San Marzano sauce & basil", category: "Pizza", image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=600&q=80" },
  { name: "Smoky BBQ Chicken Pizza", price: 449, description: "Grilled chicken, red onions, cilantro, and tangy smoky BBQ sauce on golden crust", category: "Pizza", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80" },
  { name: "Truffle Mushroom Pizza", price: 499, description: "Gourmet wild mushrooms, black truffle oil, fontina cheese, and fresh thyme", category: "Pizza", image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=600&q=80" },

  { name: "Smash Cheeseburger", price: 219, description: "Double smashed beef patties, melted American cheese, pickles & secret sauce on brioche", category: "Burger", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80" },
  { name: "Crispy Zinger Burger", price: 249, description: "Extra crispy buttermilk fried chicken thigh with spicy mayo and shredded lettuce", category: "Burger", image: "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=600&q=80" },
  { name: "Bacon Avocado Burger", price: 299, description: "Angus beef patty, crispy bacon strips, fresh avocado slices, and smoked gouda", category: "Burger", image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80" },
  { name: "Black Bean Veggie Burger", price: 199, description: "Hearty black bean & sweet potato patty topped with guacamole and tomato salsa", category: "Burger", image: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80" },

  { name: "Salmon Roll Combo", price: 599, description: "Fresh Norwegian salmon nigiri and avocado maki rolls served with wasabi & pickled ginger", category: "Sushi", image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=600&q=80" },
  { name: "Dragon Special Roll", price: 649, description: "Tempura shrimp roll topped with sliced eel, avocado layer, and unagi sweet sauce", category: "Sushi", image: "https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=600&q=80" },
  { name: "Spicy Tuna Sashimi", price: 549, description: "Slices of premium yellowfin tuna topped with sriracha mayo, ponzu, and tobiko", category: "Sushi", image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80" },

  { name: "Hyderabadi Chicken Biryani", price: 299, description: "Authentic dum biryani made with succulent chicken, saffron basmati rice, and mint", category: "Biryani", image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80" },
  { name: "Royal Mutton Biryani", price: 399, description: "Slow-cooked tender mutton marinated in rich spices layered with fragrant rice", category: "Biryani", image: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=600&q=80" },
  { name: "Paneer Tikka Biryani", price: 269, description: "Charcoal-grilled marinated cottage cheese cubes cooked with aromatic biryani spices", category: "Biryani", image: "https://images.unsplash.com/photo-1642821373181-696a54913e93?auto=format&fit=crop&w=600&q=80" },

  { name: "Berry Bliss Cheesecake", price: 279, description: "Creamy New York style cheesecake topped with wild blueberry compote", category: "Deserts", image: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80" },
  { name: "Chocolate Lava Fudge", price: 229, description: "Warm Belgian chocolate cake with a molten lava center served with vanilla gelato", category: "Deserts", image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80" }
];

// List all food items
export const listFood = async (req, res, next) => {
  try {
    const pool = getPool();

    // Auto-update / seed items in MySQL table to match updated prices
    for (const item of defaultSeedFoods) {
      const [existing] = await pool.query('SELECT id FROM food_items WHERE name = ?', [item.name]);
      if (existing.length === 0) {
        await pool.query(
          'INSERT INTO food_items (name, description, price, category, image) VALUES (?, ?, ?, ?, ?)',
          [item.name, item.description, item.price, item.category, item.image]
        );
      } else {
        await pool.query(
          'UPDATE food_items SET price = ? WHERE name = ? AND price < 50',
          [item.price, item.name]
        );
      }
    }

    const [foods] = await pool.query('SELECT * FROM food_items ORDER BY id ASC');
    const formattedFoods = foods.map(f => ({
      ...f,
      available: f.available === undefined ? true : Boolean(f.available)
    }));
    res.json({ success: true, data: formattedFoods });
  } catch (error) {
    next(error);
  }
};

// Add new food item
export const addFood = async (req, res, next) => {
  try {
    const { name, description, price, category, imageUrl } = req.body;
    let image = req.file ? req.file.filename : imageUrl;

    if (!name || !price || !category) {
      return res.status(400).json({ success: false, message: "Name, price, and category are required" });
    }

    if (!image) {
      image = "food_1.png";
    }

    const pool = getPool();
    const [result] = await pool.query(
      'INSERT INTO food_items (name, description, price, category, image) VALUES (?, ?, ?, ?, ?)',
      [name, description || '', price, category, image]
    );

    res.status(201).json({
      success: true,
      message: "Food item added successfully",
      data: {
        id: result.insertId,
        name,
        description,
        price,
        category,
        image
      }
    });
  } catch (error) {
    next(error);
  }
};

// Remove food item
export const removeFood = async (req, res, next) => {
  try {
    const { id } = req.body;
    const pool = getPool();

    const [rows] = await pool.query('SELECT image FROM food_items WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Food item not found" });
    }

    const image = rows[0].image;
    // Delete local file if uploaded to uploads folder
    if (image && !image.startsWith('http')) {
      fs.unlink(`uploads/${image}`, (err) => {
        if (err) console.log("File deletion notice:", err.message);
      });
    }

    await pool.query('DELETE FROM food_items WHERE id = ?', [id]);
    res.json({ success: true, message: "Food item removed successfully" });
  } catch (error) {
    next(error);
  }
};
