import React, { useContext } from 'react';
import './FoodDisplay.css';
import { StoreContext } from '../../context/StoreContext';
import FoodItem from '../FoodItem/FoodItem';

const FoodDisplay = ({ category }) => {
  const { food_list, searchQuery } = useContext(StoreContext);

  const filteredFoods = food_list.filter((item) => {
    const matchesCategory = category === "All" || category === item.category;
    const matchesSearch = !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className='food-display' id='food-display'>
      <h2>{searchQuery ? `Search Results for "${searchQuery}"` : "Top dishes near you"}</h2>

      {filteredFoods.length === 0 ? (
        <div className="food-no-results">
          <div className="no-results-icon">🔍</div>
          <h3>No matching dishes found</h3>
          <p>Try searching for a different dish, ingredient, or category.</p>
        </div>
      ) : (
        <div className="food-display-list">
          {filteredFoods.map((item, index) => (
            <FoodItem
              key={item._id || index}
              id={item._id}
              name={item.name}
              description={item.description}
              price={item.price}
              image={item.image}
              available={item.available}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FoodDisplay;

