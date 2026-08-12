import React, { useState, useEffect, useContext } from 'react';
import './Home.css';
import Header from '../../components/Header/Header';
import ExploreRestaurants from '../../components/ExploreRestaurants/ExploreRestaurants';
import ExploreMenu from '../../components/ExploreMenu/ExploreMenu';
import FoodDisplay from '../../components/FoodDisplay/FoodDisplay';
import { StoreContext } from '../../context/StoreContext';

const Home = () => {
  const [category, setCategory] = useState("All");
  const { setStorefrontRestaurant } = useContext(StoreContext);

  useEffect(() => {
    setStorefrontRestaurant(null);
  }, []);

  return (
    <div>
      <Header />
      <ExploreRestaurants />
      <ExploreMenu category={category} setCategory={setCategory} />
      <FoodDisplay category={category}/>
    </div>
  );
};

export default Home;
