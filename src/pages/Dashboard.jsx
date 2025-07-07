// src/pages/Dashboard.jsx

import React, { useEffect, useState, useContext } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase"; // adjust path if needed
import { useAuth } from "../context/AuthContext"; // however you access current user
import './Dashboard.css';
import OnboardingModal from '../components/OnboardingModal';
import { UserContext } from "../context/UserContext";

const Dashboard = () => {
  const { userData, updateUserData } = useContext(UserContext);
  

  const [userProfile, setUserProfile] = useState(null);

  const { currentUser } = useAuth(); // Get the logged in user
  const [showPopup, setShowPopup] = useState(true);
  const [formData, setFormData] = useState({
  age: "",
  gender: "",
  fitnessGoal: "",
  activity: ""
});


  useEffect(() => {
  const checkUserInfo = async () => {
    if (!currentUser) return;

    const userDocRef = doc(db, "users", currentUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const data = userDoc.data();
          setUserProfile(data);

          const hasAllGoals =
            data.dailyCalories && data.dailySteps && data.dailyWorkout &&
            data.weeklyCalories && data.weeklySteps && data.weeklyWorkout;

          if (hasAllGoals) {
            setShowPopup(false); // already onboarded
          } else {
            setShowPopup(true); // incomplete data
          }

          updateUserData({
            dailyCalories: Number(data.dailyCalories) || 2000,
            dailySteps: Number(data.dailySteps) || 5000,
            dailyWorkout: Number(data.dailyWorkout) || 60,
            weeklyCalories: Number(data.weeklyCalories) || 10000,
            weeklySteps: Number(data.weeklySteps) || 35000,
            weeklyWorkout: Number(data.weeklyWorkout) || 300
          }
        );// 👈 Save user data to state
    } else {
      setShowPopup(true);
    }
  };

  checkUserInfo();
}, [currentUser]);


  

  const handleFinish = async (data) => {
  try {
     console.log("Data received from modal:", data);
    if (!currentUser) return;

    const userDocRef = doc(db, "users", currentUser.uid);
    await setDoc(userDocRef, {
      ...data,
      email: currentUser.email,
    });

    setUserProfile(data);
    setShowPopup(false);  // ✅ closes the modal
    console.log("Finished onboarding and popup closed");
      } catch (error) {
        console.error("Error saving profile:", error);
      }
    };


  return (
    <div className="dashboard-container">

      <div className="main-content">
        <div className="top-cards">
          <div className="card profile-card">
            <div className="avatar"></div>
            {userProfile ? (
  <>
              <h3>{userProfile.name || "User"}</h3>
              <p>Fitness Enthusiast</p>
              <div className="info-grid">
                <div><strong>{userProfile.age}</strong><br />Age</div>
                <div><strong>{userProfile.weight}</strong><br />Weight (kg)</div>
                <div><strong>{userProfile.height}</strong><br />Height (cm)</div>
                <div><strong>{userProfile.fitnessGoal}</strong><br />Goal</div>
              </div>
            </>
          ) : (
            <p>Loading profile...</p>
          )}

          </div>

          <div className="card goals-card">
            <h4>Daily Goals</h4>
              <div className="goal-item">Calories Burned
                <span>1500 / {userData?.dailyCalories || '0'}</span>

              </div>

            <div className="progress-bar">
                <div style={{ width: `${Math.min((1500 / (userData?.dailyCalories || 1)) * 100, 100)}%` }}></div>
            </div>

            <div className="goal-item">
                Steps Taken 
                <span>500 / {userData?.dailySteps || '0'}</span>
            </div>
              <div className="progress-bar">
                <div style={{ width: `${Math.min((500 / (userData?.dailySteps || 1 )) * 100, 100)}%` }}></div>
              </div>
                    
            <div className="goal-item">
              Workout Time 
              <span>45 / {userData?.dailyWorkout || '0'}</span>
            </div>
            <div className="progress-bar">
              <div style={{ width: `${Math.min((45 / (userData?.dailyWorkout || 1)) * 100, 100) }%` }}></div>
            </div>

          </div>

          <div className="card goals-card">
            <h4>Weekly Goals</h4>
             <div className="goal-item">
                  Calories Burned 
                  <span>1500 / {userData?.weeklyCalories || '0'}</span>
                </div>
                <div className="progress-bar">
                  <div style={{ width: `${Math.min((1500 / (userData?.weeklyCalories || 1)) * 100 ,100)}%` }}></div>
                </div>

                <div className="goal-item">
                  Steps Taken 
                  <span>500 / {userData?.weeklySteps || '0'}</span>
                </div>
                <div className="progress-bar">
                  <div style={{ width: `${ Math.min((500 / (userData?.weeklySteps ||1)) * 100 ,100 )}%` }}></div>
                </div>

                <div className="goal-item">
                  Workout Time 
                  <span>45 / {userData?.weeklyWorkout || '0'}</span>
                </div>
                <div className="progress-bar">
                  <div style={{ width: `${Math.min((45 / (userData?.weeklyWorkout || 1)) * 100 ,100) }%` }}></div>
                </div>
          </div>
        </div>

        <div className="bottom-section">
          <div className="card workout-history">
            <h4>Workout History</h4>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Workout</th>
                  <th>Duration</th>
                  <th>Calories</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>2024-10-07</td><td>Chest</td><td>60</td><td>1500 kcals</td></tr>
                <tr><td>2024-10-08</td><td>Back</td><td>60</td><td>1500 kcals</td></tr>
                <tr><td>2024-10-11</td><td>Running</td><td>15</td><td>500 kcals</td></tr>
                <tr><td>2024-10-11</td><td>Running</td><td>15</td><td>1200 kcals</td></tr>
                <tr><td>2024-10-12</td><td>Running</td><td>15</td><td>200 kcals</td></tr>
              </tbody>
            </table>
          </div>

          <div className="bottom-grid">
              {/* Weight Progress */}
              <div className="card">
                <h4>Weight Progress</h4>
                <div className="chart-placeholder">
                  <img src="/weight-chart.png" alt="Weight Progress" />
                </div>
              </div>

              {/* Weekly Progress */}
              <div className="card">
                <h4>Weekly Progress</h4>
                <div className="chart-placeholder">
                  <img src="/weekly-chart.png" alt="Weekly Progress" />
                </div>
              </div>

              {/* Exercise Suggestions */}
              <div className="card suggestions-card">
                <h4>Exercise Suggestions</h4>
                <div className="suggestion">
                  <div className="left">
                    <span className="exercise-name">Band Hip Adductions</span>
                    <span className="exercise-type">strength</span>
                  </div>
                  <span className="add-icon">+</span>
                </div>
                <div className="suggestion">
                  <div className="left">
                    <span className="exercise-name">Groin and Back Stretch</span>
                    <span className="exercise-type">stretching</span>
                  </div>
                  <span className="add-icon">+</span>
                </div>
                <div className="suggestion">
                  <div className="left">
                    <span className="exercise-name">Side Lying Groin Stretch</span>
                    <span className="exercise-type">stretching</span>
                  </div>
                  <span className="add-icon">+</span>
                </div>
              </div>
            </div>

          
        </div>
      </div>
      {showPopup && (
        <OnboardingPopup
          setShowPopup={setShowPopup}
          updateUserData={updateUserData}
          currentUser={currentUser}
        />
      )}






    </div>
  );
};

export default Dashboard;
