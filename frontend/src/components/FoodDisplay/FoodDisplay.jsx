import React, { useContext } from 'react';
import './FoodDisplay.css';
import { StoreContext } from '../../context/StoreContext';
import FoodItem from '../FoodItem/FoodItem';
import { Search } from 'lucide-react';

const FoodDisplay = ({ category, isHomePage = true }) => {
  const { food_list, searchQuery, setSearchQuery } = useContext(StoreContext);

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
          <div className="no-results-icon"><Search size={40} color="#94a3b8" /></div>
          <h3>No matching dishes found</h3>
          <p>Try searching for a different dish, ingredient, or category.</p>
          {searchQuery && (
            <button className="btn-primary" style={{ marginTop: '12px' }} onClick={() => setSearchQuery('')}>
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div className="food-display-list">
          {filteredFoods.map((item, index) => (
            <FoodItem
              key={item._id || item.id || index}
              id={item._id || item.id}
              name={item.name}
              description={item.description}
              price={item.price}
              image={item.image}
              available={item.available}
              restaurantName={item.restaurant_name}
              restaurantSlug={item.restaurant_slug}
              isHomePage={isHomePage}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FoodDisplay;
