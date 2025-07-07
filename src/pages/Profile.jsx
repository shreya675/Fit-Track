import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "../context/UserContext";
import { getDoc, doc } from "firebase/firestore";
import { auth, db } from "../firebase"; // ensure this is correct path
import './profile.css';

const Profile = () => {
  const { userData: contextUserData } = useContext(UserContext);
  const [userData, setUserData] = useState(contextUserData || null);
  const [loading, setLoading] = useState(!contextUserData);
useEffect(() => {
  const fetchUserData = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
        } else {
          setUserData(null);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setUserData(null);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  fetchUserData();
}, [contextUserData]);  // this will re-run if context updates


  if (loading) return <p>Loading...</p>;
  if (!userData) return <p>You haven't completed onboarding yet.</p>;

  return (
    <div className="profile-section">
      <h2>Your Profile</h2>
      <ul>
        <li><strong>Name:</strong> {userData.name}</li>
        <li><strong>Gender:</strong> {userData.gender}</li>
        <li><strong>Age:</strong> {userData.age}</li>
        <li><strong>Weight:</strong> {userData.weight} kg</li>
        <li><strong>Height:</strong> {userData.height} cm</li>
        <li><strong>Fitness Goal:</strong> {userData.fitnessGoal}</li>
        <li><strong>Activity Level:</strong> {userData.activity}</li>
        <li><strong>Sleep Duration:</strong> {userData.sleep}</li>
      </ul>
    </div>
  );
};

export default Profile;
