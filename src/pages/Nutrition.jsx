import React from "react";
import "./nutrition.css";

const Nutrition = () => {
  return (
    <div className="nutrition-container">
      <h2 className="section-title">Today's Meals</h2>
      <div className="today-header">
        <span className="today-subtitle">July 6, 2025</span>
        <button className="add-meal-btn">+ Add Meal</button>
      </div>
      <table className="nutrition-table">
        <thead>
          <tr>
            <th>Food</th>
            <th>Meal</th>
            <th>Calories</th>
            <th>Time</th>
            <th>Carbs</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Oats</td>
            <td>Breakfast</td>
            <td>250 kcal</td>
            <td>08:00 AM</td>
            <td>30 g</td>
          </tr>
        </tbody>
      </table>

      <h2 className="section-title">Meal History</h2>
      <table className="nutrition-table">
        <thead>
          <tr>
            <th>Food</th>
            <th>Meal</th>
            <th>Calories</th>
            <th>Time</th>
            <th>Carbs</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Meat</td>
            <td>Breakfast</td>
            <td>400 kcal</td>
            <td>08:00 AM</td>
            <td>20 g</td>
          </tr>
          <tr>
            <td>Burger</td>
            <td>Lunch</td>
            <td>500 kcal</td>
            <td>01:00 PM</td>
            <td>30 g</td>
          </tr>
          <tr>
            <td>Burrito</td>
            <td>Dinner</td>
            <td>600 kcal</td>
            <td>08:00 PM</td>
            <td>40 g</td>
          </tr>
          <tr>
            <td>Ice Cream</td>
            <td>Snack</td>
            <td>300 kcal</td>
            <td>04:00 PM</td>
            <td>25 g</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default Nutrition;
