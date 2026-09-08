import React, { useContext, useEffect, useMemo, useState } from "react";
import { UserContext } from "../context/UserContext";
import { collection, getDoc, doc, onSnapshot, query } from "firebase/firestore";
import { auth, db } from "../firebase";
import dayjs from "dayjs";
import { Activity, CalendarDays, Flame, HeartPulse, Ruler, Scale, Target, TrendingUp } from "lucide-react";
import './profile.css';

const toNumber = (value) => Number(value) || 0;

const toDate = (value) => {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  return new Date(value);
};

const getBmiCategory = (bmi) => {
  if (!bmi) return "Not available";
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Healthy range";
  if (bmi < 30) return "Overweight";
  return "Higher risk range";
};

const activityMultiplier = {
  Sedentary: 1.2,
  "Lightly Active": 1.375,
  Active: 1.55,
  "Very Active": 1.725,
};

const Profile = () => {
  const { userData: contextUserData } = useContext(UserContext);
  const [userData, setUserData] = useState(contextUserData || null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(!contextUserData);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth || !db) {
        setLoading(false);
        return;
      }

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
  }, [contextUserData]);

  useEffect(() => {
    const user = auth?.currentUser;
    if (!user || !db) return undefined;

    const sessionsQuery = query(collection(db, "users", user.uid, "workoutSessions"));
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
  }, []);

  const profileStats = useMemo(() => {
    const weight = toNumber(userData?.weight);
    const height = toNumber(userData?.height);
    const age = toNumber(userData?.age);
    const heightMeters = height / 100;
    const bmi = weight && height ? weight / (heightMeters * heightMeters) : 0;
    const genderAdjustment = userData?.gender === "Female" ? -161 : 5;
    const bmr = weight && height && age ? Math.round((10 * weight) + (6.25 * height) - (5 * age) + genderAdjustment) : 0;
    const maintenance = Math.round(bmr * (activityMultiplier[userData?.activity] || 1.375));
    const weeklyMinutes = sessions.reduce((sum, session) => sum + toNumber(session.durationMinutes), 0);
    const weeklyBurn = sessions.reduce((sum, session) => sum + toNumber(session.calories), 0);
    const lastThirtyDays = sessions.filter((session) => {
      const sessionDate = session.date || dayjs(toDate(session.completedAt)).format("YYYY-MM-DD");
      return sessionDate && dayjs(sessionDate).isAfter(dayjs().subtract(30, "day"));
    });
    const consistency = Math.min(Math.round((lastThirtyDays.length / 12) * 100), 100);

    return {
      bmi: bmi ? bmi.toFixed(1) : "N/A",
      bmiCategory: getBmiCategory(bmi),
      bmr: bmr || "N/A",
      maintenance: maintenance || "N/A",
      weeklyMinutes,
      weeklyBurn,
      sessionsCount: sessions.length,
      consistency,
      latestWorkout: sessions[0],
    };
  }, [sessions, userData]);


  if (loading) return <div className="profile-state">Loading profile...</div>;
  if (!userData) return <div className="profile-state">You haven't completed onboarding yet.</div>;

  return (
    <div className="profile-section">
      <section className="profile-hero">
        <div className="profile-avatar">{(userData.name || "U").charAt(0).toUpperCase()}</div>
        <div>
          <span>Member Profile</span>
          <h1>{userData.name || "Fitness Member"}</h1>
          <p>{userData.fitnessGoal || "General Fitness"} plan - {userData.activity || "Activity level not set"}</p>
        </div>
      </section>

      <section className="profile-metrics">
        <div>
          <Scale size={20} />
          <span>BMI</span>
          <strong>{profileStats.bmi}</strong>
          <small>{profileStats.bmiCategory}</small>
        </div>
        <div>
          <Flame size={20} />
          <span>Est. Maintenance</span>
          <strong>{profileStats.maintenance}</strong>
          <small>kcal/day</small>
        </div>
        <div>
          <CalendarDays size={20} />
          <span>Total Sessions</span>
          <strong>{profileStats.sessionsCount}</strong>
          <small>saved workouts</small>
        </div>
        <div>
          <TrendingUp size={20} />
          <span>30-Day Consistency</span>
          <strong>{profileStats.consistency}%</strong>
          <small>based on 3 sessions/week</small>
        </div>
      </section>

      <section className="profile-grid">
        <div className="profile-panel">
          <h2>Body Profile</h2>
          <div className="detail-grid">
            <div><Ruler size={18} /><span>Height</span><strong>{userData.height || "N/A"} cm</strong></div>
            <div><Scale size={18} /><span>Weight</span><strong>{userData.weight || "N/A"} kg</strong></div>
            <div><HeartPulse size={18} /><span>Age</span><strong>{userData.age || "N/A"}</strong></div>
            <div><Activity size={18} /><span>Gender</span><strong>{userData.gender || "N/A"}</strong></div>
          </div>
        </div>

        <div className="profile-panel">
          <h2>Training Targets</h2>
          <div className="target-list">
            <div><Target size={18} /><span>Daily steps</span><strong>{userData.dailySteps || userData.steps || 0}</strong></div>
            <div><Target size={18} /><span>Daily workout</span><strong>{userData.dailyWorkout || userData.workoutTime || 0} min</strong></div>
            <div><Target size={18} /><span>Daily burn</span><strong>{userData.dailyCalories || userData.calories || 0} kcal</strong></div>
            <div><Target size={18} /><span>Weekly workout</span><strong>{userData.weeklyWorkout || 0} min</strong></div>
          </div>
        </div>

        <div className="profile-panel wide-panel">
          <h2>Activity Snapshot</h2>
          <div className="snapshot-row">
            <div><span>This cycle</span><strong>{profileStats.weeklyMinutes} min</strong><small>active time logged</small></div>
            <div><span>Energy output</span><strong>{profileStats.weeklyBurn} kcal</strong><small>from completed sessions</small></div>
            <div><span>Sleep pattern</span><strong>{userData.sleep || "N/A"}</strong><small>self reported</small></div>
          </div>
          {profileStats.latestWorkout ? (
            <div className="latest-profile-session">
              <span>Latest session</span>
              <strong>{profileStats.latestWorkout.title}</strong>
              <small>{profileStats.latestWorkout.durationMinutes} min - {profileStats.latestWorkout.category || "Workout"}</small>
            </div>
          ) : (
            <div className="latest-profile-session empty">Complete a workout to unlock trend history.</div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Profile;
