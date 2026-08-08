import React, { useContext } from "react";
import "./ExploreMenu.css";
import { menu_list } from "../../assets/assets";
import { StoreContext } from "../../context/StoreContext";

const ExploreMenu = ({ category, setCategory }) => {
  const { categories: backendCategories } = useContext(StoreContext);

  // Only display categories that are active in backend
  const displayMenu = backendCategories && backendCategories.length > 0
    ? menu_list.filter(m => backendCategories.some(bc => bc.name === m.menu_name))
    : menu_list;

  return (
    <div className="explore-menu" id="explore-menu">
      <div className="explore-menu-header">
        <h2>Explore Our Menu</h2>
        <p className="explore-menu-text">
          Choose from a diverse menu featuring a delectable array of dishes
          crafted with the finest ingredients and culinary expertise. Elevate your dining experience, one delicious meal at a time.
        </p>
      </div>
      <div className="explore-menu-list">
        {displayMenu.map((item, index) => {
          const isActive = category === item.menu_name;
          return (
            <div
              onClick={() =>
                setCategory((prev) =>
                  prev === item.menu_name ? "All" : item.menu_name
                )
              }
              key={index}
              className={`explore-menu-list-item ${isActive ? "active-item" : ""}`}
            >
              <div className="explore-menu-img-wrapper">
                <img className={isActive ? "active" : ""} src={item.menu_image} alt={item.menu_name} />
              </div>
              <p>{item.menu_name}</p>
            </div>
          );
        })}
      </div>
      <hr />
    </div>
  );
};

export default ExploreMenu;
