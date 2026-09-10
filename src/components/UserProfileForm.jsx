import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { User } from 'lucide-react';
import { toast, ToastContainer, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import service from '../Appwrite/config';
import authService from '../Appwrite/auth';
import conf from '../conf/Conf';

function UserProfileForm({ onComplete }) {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();
  const [hasChanged, setHasChanged] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const onSubmit = useCallback(async (data) => {
    setLoading(true);
    try {
      const userData = await authService.getCurrentUser();

      if (userData) {
        // Save weight log separately
        const weightAdd = await service.addWeight(data.weight, userData.$id);
        console.log("Weight add response:", weightAdd);

        if (isEdit) {
          // Update profile
          const updatedProfile = await service.updateUserProfile(userData.$id, { ...data });
          if (updatedProfile) {
            toast.success("Profile updated successfully!");
          } else {
            toast.error("Failed to update profile.");
          }
        } else {
          // Create new profile
          const newProfile = await service.createUserProfile({ ...data, docId: userData.$id });
          if (newProfile) {
            toast.success("Profile created successfully!");
            setIsEdit(true);
            if (onComplete) {
              onComplete(); // ✅ Close modal
              return;
            }
          } else {
            toast.error("Failed to create profile.");
          }
        }
      }
      setHasChanged(false);
    } catch (error) {
      console.error("Error submitting the form:", error);
      toast.error("Error submitting the form.");
    } finally {
      setLoading(false);
    }
  }, [isEdit, onComplete]);

  const fetchUserProfile = useCallback(async () => {
    setFetching(true);
    try {
      const userData = await authService.getCurrentUser();
      const existingProfile = await service.getUserInformation(conf.appwriteUserInfoCollectionId, userData.$id);

      if (existingProfile) {
        setIsEdit(true);
        setValue("name", existingProfile.name);
        setValue("age", existingProfile.age);
        setValue("weight", existingProfile.weight);
        setValue("hight", existingProfile.hight);
        setValue("fitnessGoals", existingProfile.fitnessGoals);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast.error("Error fetching user profile.");
    } finally {
      setFetching(false);
    }
  }, [setValue]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const formContent = useMemo(() => (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name:</label>
        <input
          id="name"
          {...register("name", { required: "Name is required" })}
          onChange={() => setHasChanged(true)}
          className="w-full px-3 py-2 border border-gray-300 text-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">Age:</label>
          <input
            type="number"
            id="age"
            {...register("age", {
              required: "Age is required",
              min: { value: 1, message: "Age must be positive" },
              valueAsNumber: true
            })}
            onChange={() => setHasChanged(true)}
            className="w-full px-3 py-2 border border-gray-300 text-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.age && <p className="mt-1 text-sm text-red-500">{errors.age.message}</p>}
        </div>
        <div className="flex-1">
          <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">Weight KG:</label>
          <input
            type="number"
            id="weight"
            {...register("weight", {
              required: "Weight is required",
              min: { value: 1, message: "Weight must be positive" },
              valueAsNumber: true
            })}
            onChange={() => setHasChanged(true)}
            className="w-full px-3 py-2 border border-gray-300 text-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.weight && <p className="mt-1 text-sm text-red-500">{errors.weight.message}</p>}
        </div>
      </div>
      <div>
        <label htmlFor="hight" className="block text-sm font-medium text-gray-700 mb-1">Height Inches:</label>
        <input
          type="number"
          id="hight"
          step="0.1"
          {...register("hight", {
            required: "Height is required",
            min: { value: 1, message: "Height must be positive" },
            valueAsNumber: true
          })}
          onChange={() => setHasChanged(true)}
          className="w-full px-3 py-2 border border-gray-300 text-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.hight && <p className="mt-1 text-sm text-red-500">{errors.hight.message}</p>}
      </div>
      <div>
        <label htmlFor="fitnessGoals" className="block text-sm font-medium text-gray-700 mb-1">Fitness Goal:</label>
        <input
          id="fitnessGoals"
          {...register("fitnessGoals", { required: "Fitness goal is required" })}
          onChange={() => setHasChanged(true)}
          className="w-full px-3 py-2 border border-gray-300 text-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. weight gain"
        />
        {errors.fitnessGoals && <p className="mt-1 text-sm text-red-500">{errors.fitnessGoals.message}</p>}
      </div>
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
          onClick={() => {
            if (onComplete) onComplete();
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          className={`px-4 py-2 ${loading ? 'bg-gray-400' : 'bg-blue-600'} text-white rounded-md hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500`}
          disabled={loading}
        >
          {loading ? 'Saving...' : hasChanged ? (isEdit ? "Update" : "Save") : "Save"}
        </button>
      </div>
    </form>
  ), [handleSubmit, onSubmit, register, errors, hasChanged, isEdit, loading, onComplete]);

  return (
    <div className="w-full max-w-6xl mt-10 mx-auto bg-white p-8 rounded-lg shadow-xl">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={true}
        newestOnTop={false}
        closeOnClick={true}
        rtl={false}
        pauseOnFocusLoss={true}
        draggable={true}
        pauseOnHover={true}
        theme="light"
        transition={Slide}
      />
      <div className="flex justify-center mb-8">
        <div className="w-32 h-32 bg-indigo-100 rounded-full flex items-center justify-center">
          <User size={64} className="text-indigo-600" />
        </div>
      </div>
      {fetching ? (
        <div className="flex justify-center items-center">
          <div className="spinner-border text-indigo-600" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        formContent
      )}
    </div>
  );
}

export default UserProfileForm;
