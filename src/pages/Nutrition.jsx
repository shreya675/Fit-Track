import React, { useMemo, useState, useEffect } from "react";
import "./nutrition.css";
import dayjs from "dayjs";
import { db, auth } from "../firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const mealTypes = ["Breakfast", "Lunch", "Snack", "Dinner"];

const quickMeals = [
  { name: "Oats Bowl", type: "Breakfast", calories: 320 },
  { name: "Grilled Chicken Rice", type: "Lunch", calories: 520 },
  { name: "Fruit Yogurt", type: "Snack", calories: 180 },
  { name: "Paneer Salad", type: "Dinner", calories: 430 },
];

const NutritionPage = () => {
  const [mealName, setMealName] = useState("");
  const [mealType, setMealType] = useState("");
  const [calories, setCalories] = useState("");
  const [meals, setMeals] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    if (!auth) return undefined;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid || null);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId || !db) return undefined;

    const mealsQuery = query(collection(db, "users", userId, "meals"));
    const unsubscribe = onSnapshot(mealsQuery, (snapshot) => {
      const fetched = snapshot.docs
        .map((mealDoc) => ({
          id: mealDoc.id,
          ...mealDoc.data(),
        }))
        .sort((a, b) => String(b.createdAt?.seconds || b.date).localeCompare(String(a.createdAt?.seconds || a.date)));

      setMeals(fetched);
    });

    return () => unsubscribe();
  }, [userId]);

  const saveMeal = async (meal) => {
    if (!userId || !db) return;

    await addDoc(collection(db, "users", userId, "meals"), {
      ...meal,
      calories: Number(meal.calories),
      date: dayjs().format("YYYY-MM-DD"),
      createdAt: serverTimestamp(),
    });
  };

  const handleAddMeal = async () => {
    if (!mealName || !mealType || !calories || !userId) return;

    try {
      await saveMeal({ name: mealName, type: mealType, calories });
      setMealName("");
      setMealType("");
      setCalories("");
    } catch (error) {
      console.error("Error saving meal:", error);
    }
  };

  const handleQuickMeal = async (meal) => {
    try {
      await saveMeal(meal);
    } catch (error) {
      console.error("Error saving quick meal:", error);
    }
  };

  const handleDeleteMeal = async (mealId) => {
    if (!userId || !db) return;

    try {
      await deleteDoc(doc(db, "users", userId, "meals", mealId));
    } catch (error) {
      console.error("Error deleting meal:", error);
    }
  };

  const todayMeals = useMemo(
    () => meals.filter((meal) => meal.date === dayjs().format("YYYY-MM-DD")),
    [meals]
  );

  const mealStats = useMemo(() => {
    const totals = mealTypes.reduce((acc, type) => ({ ...acc, [type]: 0 }), {});

    todayMeals.forEach((meal) => {
      totals[meal.type] = (totals[meal.type] || 0) + (Number(meal.calories) || 0);
    });

    return totals;
  }, [todayMeals]);

  const totalCalories = todayMeals.reduce((sum, meal) => sum + (Number(meal.calories) || 0), 0);

  return (
    <div className="nutrition-container">
      <div className="nutrition-header">
        <div>
          <h2>Nutrition Tracker</h2>
          <p>{dayjs().format("DD MMM YYYY")}</p>
        </div>
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
        <select value={mealType} onChange={(e) => setMealType(e.target.value)}>
          <option value="">Select type</option>
          {mealTypes.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Calories"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
        />
      </div>

      <div className="quick-meals">
        {quickMeals.map((meal) => (
          <button key={meal.name} onClick={() => handleQuickMeal(meal)}>
            {meal.name}
          </button>
        ))}
      </div>

      <div className="nutrition-stats">
        <div className="total-calories">
          Total Calories Today: <strong>{totalCalories}</strong>
        </div>
        {mealTypes.map((type) => (
          <div className="meal-stat" key={type}>
            <span>{type}</span>
            <strong>{mealStats[type]}</strong>
          </div>
        ))}
      </div>

      <div className="meal-history">
        <h3>Today's Meals</h3>
        {todayMeals.length > 0 ? (
          <div className="meals-list">
            {todayMeals.map((meal) => (
              <div key={meal.id} className="meal-card">
                <span>{meal.name}</span>
                <span>{meal.type}</span>
                <span>{meal.calories} cal</span>
                <button onClick={() => handleDeleteMeal(meal.id)}>Delete</button>
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
