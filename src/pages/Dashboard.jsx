import React, { useEffect, useMemo, useState, useContext } from "react";
import dayjs from "dayjs";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import './Dashboard.css';
import OnboardingModal from '../components/OnboardingModal';
import { UserContext } from "../context/UserContext";
import WeeklyChart from '../components/Weeklychart';
import GoalProgressChart from "../components/GoalProgressChart";

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const emptyWeek = () =>
  weekDays.map((day) => ({
    day,
    calories: 0,
    steps: 0,
    workout: 0,
  }));

const toDate = (value) => {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  return new Date(value);
};

const calculateStreak = (sessions) => {
  const workoutDays = new Set(sessions.map((session) => session.date).filter(Boolean));
  let streak = 0;
  let cursor = dayjs();

  while (workoutDays.has(cursor.format("YYYY-MM-DD"))) {
    streak += 1;
    cursor = cursor.subtract(1, "day");
  }

  return streak;
};

const Dashboard = () => {
  const { userData, updateUserData } = useContext(UserContext);
  const [userProfile, setUserProfile] = useState(null);
  const [sessions, setSessions] = useState([]);
  const { currentUser } = useAuth();
  const [showPopup, setShowPopup] = useState(true);

  useEffect(() => {
    const checkUserInfo = async () => {
      if (!currentUser || !db) return;

      const userDocRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserProfile(data);

        const hasAllGoals =
          data.dailyCalories && data.dailySteps && data.dailyWorkout &&
          data.weeklyCalories && data.weeklySteps && data.weeklyWorkout;

        setShowPopup(!hasAllGoals);

        updateUserData({
          dailyCalories: Number(data.dailyCalories) || 2000,
          dailySteps: Number(data.dailySteps) || 5000,
          dailyWorkout: Number(data.dailyWorkout) || 60,
          weeklyCalories: Number(data.weeklyCalories) || 10000,
          weeklySteps: Number(data.weeklySteps) || 35000,
          weeklyWorkout: Number(data.weeklyWorkout) || 300,
        });
      } else {
        setShowPopup(true);
      }
    };

    checkUserInfo();
  }, [currentUser, updateUserData]);

  useEffect(() => {
    if (!currentUser || !db) return undefined;

    const sessionsRef = collection(db, "users", currentUser.uid, "workoutSessions");
    const sessionsQuery = query(sessionsRef);

    const unsubscribe = onSnapshot(sessionsQuery, (snapshot) => {
      const nextSessions = snapshot.docs
        .map((sessionDoc) => ({
          id: sessionDoc.id,
          ...sessionDoc.data(),
        }))
        .sort((a, b) => {
          const dateA = toDate(a.completedAt)?.getTime() || 0;
          const dateB = toDate(b.completedAt)?.getTime() || 0;
          return dateB - dateA;
        });

      setSessions(nextSessions);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const metrics = useMemo(() => {
    const today = dayjs().format("YYYY-MM-DD");
    const startOfWeek = dayjs().startOf("week").add(1, "day");
    const weekData = emptyWeek();

    let dailyCalories = 0;
    let dailySteps = 0;
    let dailyWorkout = 0;
    let weeklyCalories = 0;
    let weeklySteps = 0;
    let weeklyWorkout = 0;
    let totalCalories = 0;
    let totalWorkout = 0;

    sessions.forEach((session) => {
      const completedDate = toDate(session.completedAt);
      const sessionDay = session.date || (completedDate ? dayjs(completedDate).format("YYYY-MM-DD") : "");
      const calories = Number(session.calories) || 0;
      const steps = Number(session.steps) || 0;
      const workout = Number(session.durationMinutes) || 0;
      totalCalories += calories;
      totalWorkout += workout;

      if (sessionDay === today) {
        dailyCalories += calories;
        dailySteps += steps;
        dailyWorkout += workout;
      }

      if (sessionDay && dayjs(sessionDay).isAfter(startOfWeek.subtract(1, "day"))) {
        weeklyCalories += calories;
        weeklySteps += steps;
        weeklyWorkout += workout;

        const weekIndex = dayjs(sessionDay).day() === 0 ? 6 : dayjs(sessionDay).day() - 1;
        weekData[weekIndex].calories += calories;
        weekData[weekIndex].steps += steps;
        weekData[weekIndex].workout += workout;
      }
    });

    const goalData = weekData.map((item) => ({
      day: item.day,
      workout: Math.min(Math.round((item.workout / (Number(userData?.dailyWorkout) || 1)) * 100), 100),
      calories: Math.min(Math.round((item.calories / (Number(userData?.dailyCalories) || 1)) * 100), 100),
      steps: Math.min(Math.round((item.steps / (Number(userData?.dailySteps) || 1)) * 100), 100),
    }));

    return {
      dailyCalories,
      dailySteps,
      dailyWorkout,
      weeklyCalories,
      weeklySteps,
      weeklyWorkout,
      totalCalories,
      totalWorkout,
      totalWorkouts: sessions.length,
      streak: calculateStreak(sessions),
      averageWorkout: sessions.length ? Math.round(totalWorkout / sessions.length) : 0,
      bestWorkout: sessions.reduce((best, session) => {
        if (!best) return session;
        return (Number(session.calories) || 0) > (Number(best.calories) || 0) ? session : best;
      }, null),
      latestWorkout: sessions[0] || null,
      weekData,
      goalData,
    };
  }, [sessions, userData]);

  const handleFinish = async (data) => {
    try {
      if (!currentUser || !db) return;

      const userDocRef = doc(db, "users", currentUser.uid);
      await setDoc(userDocRef, {
        ...data,
        email: currentUser.email,
      });

      setUserProfile(data);
      setShowPopup(false);
    } catch (error) {
      console.error("Error saving profile:", error);
    }
  };

  const dailyGoals = [
    ["Calories Burned", metrics.dailyCalories, userData?.dailyCalories || 0],
    ["Steps Taken", metrics.dailySteps, userData?.dailySteps || 0],
    ["Workout Time", metrics.dailyWorkout, userData?.dailyWorkout || 0],
  ];

  const weeklyGoals = [
    ["Calories Burned", metrics.weeklyCalories, userData?.weeklyCalories || 0],
    ["Steps Taken", metrics.weeklySteps, userData?.weeklySteps || 0],
    ["Workout Time", metrics.weeklyWorkout, userData?.weeklyWorkout || 0],
  ];

  const overviewCards = [
    ["Total Workouts", metrics.totalWorkouts, "completed sessions"],
    ["Active Minutes", metrics.totalWorkout, "all time"],
    ["Calories Burned", metrics.totalCalories, "all time"],
    ["Current Streak", metrics.streak, "days"],
    ["Average Workout", metrics.averageWorkout, "minutes"],
    ["Best Burn", metrics.bestWorkout ? `${metrics.bestWorkout.calories}` : 0, metrics.bestWorkout?.title || "no workout yet"],
  ];

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
            <h2 className="goals-heading">Daily Goals</h2>
            {dailyGoals.map(([label, value, goal]) => (
              <div key={label}>
                <div className="goal-item">
                  {label}
                  <span>{value} / {goal}</span>
                </div>
                <div className="progress-bar">
                  <div style={{ width: `${Math.min((value / (goal || 1)) * 100, 100)}%` }}></div>
                </div>
              </div>
            ))}
          </div>

          <div className="card goals-card">
            <h2 className="goals-heading">Weekly Goals</h2>
            {weeklyGoals.map(([label, value, goal]) => (
              <div key={label}>
                <div className="goal-item">
                  {label}
                  <span>{value} / {goal}</span>
                </div>
                <div className="progress-bar">
                  <div style={{ width: `${Math.min((value / (goal || 1)) * 100, 100)}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="overview-grid">
          {overviewCards.map(([label, value, detail]) => (
            <div className="overview-card" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
              <small>{detail}</small>
            </div>
          ))}
        </div>

        {metrics.latestWorkout && (
          <div className="latest-session">
            <div>
              <span>Latest Workout</span>
              <strong>{metrics.latestWorkout.title}</strong>
            </div>
            <div>
              <span>Duration</span>
              <strong>{metrics.latestWorkout.durationMinutes} min</strong>
            </div>
            <div>
              <span>Category</span>
              <strong>{metrics.latestWorkout.category || "Workout"}</strong>
            </div>
          </div>
        )}
        
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
              {sessions.length > 0 ? (
                sessions.slice(0, 8).map((session) => (
                  <tr key={session.id}>
                    <td>{session.date || dayjs(toDate(session.completedAt)).format("YYYY-MM-DD")}</td>
                    <td>{session.title}</td>
                    <td>{session.durationMinutes} min</td>
                    <td>{session.calories} kcals</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4">Complete a workout to start building history.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bottom-grid">
          <div className="card">
            <GoalProgressChart data={metrics.goalData} />
          </div>

          <div className="card">
            <WeeklyChart data={metrics.weekData} />
          </div>

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

      {showPopup && (
        <OnboardingModal
          onFinish={handleFinish}
          updateUserData={updateUserData}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default Dashboard;
