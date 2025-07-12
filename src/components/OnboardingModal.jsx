// src/components/OnboardingModal.jsx

import React, { useState, useContext } from "react";
import "./onboarding.css"; // optional CSS file
import { UserContext } from "../context/UserContext";
import welcomeImg from '../assets/welcome.svg';
import maleIcon from '../assets/man.png';
import femaleIcon from '../assets/woman.png';
import Happy from '../assets/happy.png';
import weight from '../assets/weight.png'; 
import height from '../assets/height.png'; 
import sleep from "../assets/sleep.png"; // adjust path if needed





const OnboardingModal = ({ onFinish }) => {
  
  const { setUserData } = useContext(UserContext);
  const [selectedGender, setSelectedGender] = useState("");
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
  gender: "",
  age: "",
  weight: "",
  height: "",
  fitnessGoal: "",
  activity: "",
  sleep: "",
  steps: "",
  workoutTime: "",
  calories: "",
  weeklySteps: "",
  weeklyWorkout: "",
  weeklyCalories: ""
  });

  const handleNext = () => {
    if (step < 11) {
     setStep(step + 1);
    } 

  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  


  return (
    <div className="modal-overlay">
      <div className="modal">
        {step === 0 && (
          <div>
            <h2>Welcome to FitTrack</h2>
            <img src={welcomeImg} alt="Welcome" className="welcome-icon" />
            <p>Let’s set up your fitness preferences</p>
            <button onClick={handleNext}>Start</button>
          </div>
        )}

        {step === 1 && (
          <div>
            <div className="vertical-button-group">
              <h2> What's Your Gender?</h2>
              <button
                className={`option-btn-vertical ${selectedGender === "Male" ? "selected" : ""}`}
                onClick={() => {
                  setSelectedGender("Male");
                  handleChange("gender", "Male");
                  handleNext();
                }}
              >
                <span>Male</span>
                <img src={maleIcon} alt="Male" />
              </button>

              <button
                className={`option-btn-vertical ${selectedGender === "Female" ? "selected" : ""}`}
                onClick={() => {
                  setSelectedGender("Female");
                  handleChange("gender", "Female");
                  handleNext();
                }}
              >
                <span>Female</span>
                <img src={femaleIcon} alt="female" />
              </button>

              <button
                className={`option-btn-vertical ${selectedGender === "Others" ? "selected" : ""}`}
                onClick={() => {
                  setSelectedGender("Others");
                  handleChange("gender", "Others");
                  handleNext();
                }}
              >
                <span>Others</span>
              </button>
            </div>
              
          </div>
        )}

        {step === 2 && (
          <div>
            <h2>Your Name? <img src={Happy} alt="Happy Face" className="emoji-icon" />
            </h2>
            
            <input
              type="text"
              placeholder="Enter your name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="input-field"
            />
            <button
              className="next-btn"
              onClick={() => {
                if (formData.name.trim() !== "") handleNext();
              }}
            >
              Next
            </button>
          </div>
        )}



        {step === 3 && (
          <div className="onboarding-step">
            <h2 className="question-heading">
              Your Age?
            </h2>
            
            <input
              type="number"
              placeholder="Enter your age"
              value={formData.age}
              onChange={(e) => handleChange("age", e.target.value)}
              className="input-field"
            />
            
            <button className="next-btn" onClick={handleNext}>Next</button>
          </div>
        )}


        {step === 4 && (
            <div className="onboarding-step">
              <h2 className="question-heading">
                Your Weight (in kg)? 
                <img src={weight} alt="Weight Icon" className="emoji-icon" />
              </h2>
              
              <input
                type="number"
                placeholder="e.g. 60"
                value={formData.weight}
                onChange={(e) => handleChange("weight", e.target.value)}
                className="input-field"
              />

              <button
                className="next-btn"
                onClick={() => {
                  if (formData.weight.trim() !== "") handleNext();
                }}
              >
                Next
              </button>
            </div>
          )}


        {step === 5 && (
            <div>
              <h2>Your Height (in cm)?
                <img src={height} alt="Height Icon" className="emoji-icon" />
              </h2>
              <input
                type="number"
                placeholder="e.g. 165"
                value={formData.height}
                onChange={(e) => handleChange("height", e.target.value)}
                className="input-field"
              />
              <button
                className="next-btn"
                onClick={() => {
                  if (formData.height.trim() !== "") handleNext();
                }}
              >
                Next
              </button>
            </div>
          )}


        {step === 6 && (
          <div className="onboarding-step">
            <h2 className="question-heading">Fitness Goal?</h2>

            <div className="button-column">
              {["Lose Weight", "Build Muscle", "Improve Endurance", "General Fitness"].map((goal) => (
                <button
                  key={goal}
                  className={`option-btn ${formData.fitnessGoal === goal ? "selected" : ""}`}
                  onClick={() => {
                    handleChange("fitnessGoal", goal);
                    handleNext();
                  }}
                >
                  {goal}
                </button>
              ))}
            </div>
          </div>
        )}

        
          

        {step === 7 && (
          <div>
            <h2>Activity Level?</h2>
            <div className="button-row">
              {["Sedentary", "Lightly Active", "Active", "Very Active"].map((level) => (
                <button
                  key={level}
                  className={`option-btn ${formData.activity === level ? "selected" : ""}`}
                  onClick={() => {
                    handleChange("activity", level);
                     handleNext();
                    // You may call a function to submit or close modal here
                     // or show a message
                  }}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 8 && (
          <div className="onboarding-step">
            <h2 className="question-heading">
              How much do you sleep every night?
              <img src={sleep} alt="Sleep Icon" className="emoji-icon" />
            </h2>

                  <div className="button-column">
                    {["More than 8 Hours", "7-8 Hours", "6-7 Hours", "Less than 6 Hours"].map((sleep) => (
                      <button
                        key={sleep}
                        className={`option-btn ${formData.sleep === sleep ? "selected" : ""}`}
                        onClick={() => {
                          handleChange("sleep", sleep);
                          handleNext();
                        }}
                      >
                        {sleep}
                      </button>
                    ))}
                  </div>
                </div>
              )}


          {step === 9 && (
            <div className="popup-content">
              <h2 className="question">Set Your Daily Goals</h2>

              <div className="input-group">
                <label>Target Steps (per day)</label>
                <input
                  type="number"
                  placeholder="e.g. 10000"
                  value={formData.steps}
                  onChange={(e) => handleChange("steps", e.target.value)}
                />
              </div>

              <div className="input-group">
                <label>Workout Time (minutes)</label>
                <input
                  type="number"
                  placeholder="e.g. 45"
                  value={formData.workoutTime}
                  onChange={(e) => handleChange("workoutTime", e.target.value)}
                />
              </div>

              <div className="input-group">
                <label>Calories to Burn (per day)</label>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  value={formData.calories}
                  onChange={(e) => handleChange("calories", e.target.value)}
                />
              </div>

              <button className="next-btn" onClick={() => setStep(10)}>Next</button>
            </div>
          )}

          {step === 10 && (
            <div className="popup-content">
              <h2 className="question">Set Your Weekly Goals</h2>

              <div className="input-group">
                <label>Total Steps (per week)</label>
                <input
                  type="number"
                  placeholder="e.g. 70000"
                  value={formData.weeklySteps}
                  onChange={(e) => handleChange("weeklySteps", e.target.value)}
                />
              </div>

              <div className="input-group">
                <label>Total Workout Time (minutes/week)</label>
                <input
                  type="number"
                  placeholder="e.g. 300"
                  value={formData.weeklyWorkout}
                  onChange={(e) => handleChange("weeklyWorkout", e.target.value)}
                />
              </div>

              <div className="input-group">
                <label>Total Calories to Burn (week)</label>
                <input
                  type="number"
                  placeholder="e.g. 3500"
                  value={formData.weeklyCalories}
                  onChange={(e) => handleChange("weeklyCalories", e.target.value)}
                />
              </div>

             <button
                  className="next-btn"
                  onClick={async () => {
                    const finalData = {
                      ...formData,
                      dailySteps: formData.steps,
                      dailyWorkout: formData.workoutTime,
                      dailyCalories: formData.calories,
                    };
                    
                    if (onFinish) {
                      await onFinish(finalData);
                    }
                  }}
                >
                  Finish
                </button>


            </div>
          )}

        
      </div>
    </div>
  );
};

export default OnboardingModal;
