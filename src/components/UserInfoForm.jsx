// src/components/UserInfoForm.jsx
import React, { useState } from "react";
import { db, auth } from "../firebase";
import { doc, setDoc } from "firebase/firestore";

const UserInfoForm = ({ onComplete }) => {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    goal: "",
    weight: "",
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (user) {
      try {
        await setDoc(doc(db, "users", user.uid), formData);
        onComplete(); // Hide form and show dashboard
      } catch (err) {
        console.error("Error saving user info:", err);
      }
    }
  };

  return (
    <div className="popup-form">
      <h2>Welcome! Let's set up your profile</h2>
      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Name" onChange={handleChange} required />
        <input name="age" type="number" placeholder="Age" onChange={handleChange} required />
        <input name="goal" placeholder="Fitness Goal" onChange={handleChange} required />
        <input name="weight" type="number" placeholder="Current Weight (kg)" onChange={handleChange} required />
        <button type="submit">Save</button>
      </form>
    </div>
  );
};

export default UserInfoForm;
