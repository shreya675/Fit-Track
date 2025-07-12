// NutritionPage.jsx
import React, { useState, useEffect } from "react";
import "./nutrition.css";
import dayjs from "dayjs";
import { db, auth } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const NutritionPage = () => {
  const [mealName, setMealName] = useState("");
  const [mealType, setMealType] = useState("");
  const [calories, setCalories] = useState("");
  const [meals, setMeals] = useState([]);
  const [userId, setUserId] = useState(null);

  // STEP 1: Track user auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  // STEP 2: Fetch meals after userId is ready
  useEffect(() => {
    const fetchMeals = async () => {
      try {
        const snapshot = await getDocs(collection(db, "users", userId, "meals"));
        const fetched = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMeals(fetched);
      } catch (error) {
        console.error("Error fetching meals:", error);
      }
    };

    if (userId) {
      fetchMeals();
    }
  }, [userId]);

  // STEP 3: Add meal
  const handleAddMeal = async () => {
    if (!mealName || !mealType || !calories || !userId) return;

    const newMeal = {
      name: mealName,
      type: mealType,
      calories: parseInt(calories),
      date: dayjs().format("YYYY-MM-DD"),
    };

    try {
      const docRef = await addDoc(collection(db, "users", userId, "meals"), newMeal);
      setMeals((prev) => [...prev, { id: docRef.id, ...newMeal }]);
      setMealName("");
      setMealType("");
      setCalories("");
    } catch (error) {
      console.error("Error saving meal:", error);
    }
  };

  // Filter for today's meals
  const todayMeals = meals.filter(
    (meal) => meal.date === dayjs().format("YYYY-MM-DD")
  );

  const totalCalories = todayMeals.reduce((sum, m) => sum + m.calories, 0);

  return (
    <div className="nutrition-container">
      <div className="nutrition-header">
        <h2>Nutrition Tracker</h2>
        <button className="add-meal-btn" onClick={handleAddMeal} disabled={!userId}>
          Add Meal
        </button>
      </div>

      <div className="input-section">
        <input
          type="text"
          placeholder="Food name"
          value={mealName}
          onChange={(e) => setMealName(e.target.value)}
        />
        <select
          value={mealType}
          onChange={(e) => setMealType(e.target.value)}
        >
          <option value="">Select type</option>
          <option value="Breakfast">Breakfast</option>
          <option value="Lunch">Lunch</option>
          <option value="Snack">Snack</option>
          <option value="Dinner">Dinner</option>
        </select>
        <input
          type="number"
          placeholder="Calories"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
        />
      </div>

      <div className="total-calories">
        Total Calories Today: <strong>{totalCalories}</strong>
      </div>

      <div className="meal-history">
        <h3>Today's Meals - {dayjs().format("DD MMM YYYY")}</h3>
        {todayMeals.length > 0 ? (
          <div className="meals-list">
            {todayMeals.map((meal) => (
              <div key={meal.id} className="meal-card">
                <span>{meal.name}</span>
                <span>{meal.type}</span>
                <span>{meal.calories} cal</span>
              </div>
            ))}
          </div>
        ) : (
          <p>No meals added today.</p>
        )}
      </div>
    </div>
  );
};

export default NutritionPage;
