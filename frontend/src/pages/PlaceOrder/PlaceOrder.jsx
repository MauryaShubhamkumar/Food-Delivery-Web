import React, { useContext, useState } from "react";
import "./PlaceOrder.css";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";

const PlaceOrder = () => {
  const { getTotalCartAmount, token, food_list, cartItems, url, setcartItems } = useContext(StoreContext);
  const navigate = useNavigate();

  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    phone: ""
  });

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData(prev => ({ ...prev, [name]: value }));
  };

  const placeOrderSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      alert("Please login first to place an order!");
      return;
    }

    let orderItems = [];
    food_list.forEach((item) => {
      const itemId = String(item._id || item.id);
      if (cartItems[itemId] > 0) {
        let itemInfo = { ...item, quantity: cartItems[itemId] };
        orderItems.push(itemInfo);
      }
    });

    if (orderItems.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    let orderData = {
      address: data,
      items: orderItems,
      amount: getTotalCartAmount() + 40,
    };

    try {
      const response = await fetch(`${url}/api/order/place`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          token: token
        },
        body: JSON.stringify(orderData)
      });

      const resData = await response.json();

      if (resData.success) {
        setcartItems({});
        alert("🎉 Order placed successfully!");
        navigate("/myorders");
      } else {
        alert(`Order error: ${resData.message}`);
      }
    } catch (err) {
      alert("Error submitting order to backend server");
    }
  };

  return (
    <form className="place-order" onSubmit={placeOrderSubmit}>
      <div className="place-order-left">
        <h2 className="title">Delivery Information</h2>
        <div className="multi-fields">
          <input name="firstName" onChange={onChangeHandler} value={data.firstName} type="text" placeholder="First Name" required />
          <input name="lastName" onChange={onChangeHandler} value={data.lastName} type="text" placeholder="Last Name" required />
        </div>
        <input name="email" onChange={onChangeHandler} value={data.email} type="email" placeholder="Email address" required />
        <input name="street" onChange={onChangeHandler} value={data.street} type="text" placeholder="Street Address" required />
        <div className="multi-fields">
          <input name="city" onChange={onChangeHandler} value={data.city} type="text" placeholder="City" required />
          <input name="state" onChange={onChangeHandler} value={data.state} type="text" placeholder="State" required />
        </div>
        <div className="multi-fields">
          <input name="zipCode" onChange={onChangeHandler} value={data.zipCode} type="text" placeholder="Zip code" required />
          <input name="country" onChange={onChangeHandler} value={data.country} type="text" placeholder="Country" required />
        </div>
        <input name="phone" onChange={onChangeHandler} value={data.phone} type="text" placeholder="Phone" required />
      </div>
      <div className="place-order-right">
        <div className="cart-total">
          <h2>Order Summary</h2>
          <div>
            <div className="card-total-details">
              <p>Subtotal</p>
              <p>₹{getTotalCartAmount()}</p>
            </div>
            <hr />
            <div className="card-total-details">
              <p>Delivery Fee</p>
              <p>₹{getTotalCartAmount() === 0 ? 0 : 40}</p>
            </div>
            <hr />
            <div className="card-total-details total-highlight">
              <b>Total</b>
              <b>₹{getTotalCartAmount() === 0 ? 0 : getTotalCartAmount() + 40}</b>
            </div>
          </div>
          <button type="submit" className="payment-btn">
            PROCEED TO PAYMENT
          </button>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;

