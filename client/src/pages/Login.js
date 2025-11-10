import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../services/api";
import { AuthContext } from "../context/AuthContext";
import FormInput from "../components/FormInput";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  // const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { loginUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await login(formData);
      loginUser(res.data.token, res.data.user);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden font-display bg-neutral-light-gray dark:bg-background-dark">
      <div className="layout-container flex h-full grow flex-col">
        {/* Header */}
        <header className="absolute top-0 left-0 right-0 z-10 p-6 lg:px-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-neutral-dark-gray dark:text-white">
              <div className="size-6 text-action-primary">
                <svg
                  fill="none"
                  viewBox="0 0 48 48"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g clipPath="url(#clip0_6_319)">
                    <path
                      d="M8.57829 8.57829C5.52816 11.6284 3.451 15.5145 2.60947 19.7452C1.76794 23.9758 2.19984 28.361 3.85056 32.3462C5.50128 36.3314 8.29667 39.7376 11.8832 42.134C15.4698 44.5305 19.6865 45.8096 24 45.8096C28.3135 45.8096 32.5302 44.5305 36.1168 42.134C39.7033 39.7375 42.4987 36.3314 44.1494 32.3462C45.8002 28.361 46.2321 23.9758 45.3905 19.7452C44.549 15.5145 42.4718 11.6284 39.4217 8.57829L24 24L8.57829 8.57829Z"
                      fill="currentColor"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_6_319">
                      <rect fill="white" height="48" width="48" />
                    </clipPath>
                  </defs>
                </svg>
              </div>
              <h2 className="text-xl font-bold leading-tight tracking-[-0.015em]">
                PocketPilot
              </h2>
            </div>
            {/* <Link
              to="/register"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              Don't have an account?{" "}
              <span className="font-bold text-primary">Sign Up</span>
            </Link> */}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex min-h-screen flex-1">
          <div className="flex flex-col lg:flex-row w-full">
            {/* Left Column - Hidden on mobile */}
            <div className="relative flex-1 hidden lg:flex items-center justify-center bg-gray-100 dark:bg-background-dark/50 p-6 lg:p-10">
              <div
                className="absolute inset-0 bg-cover bg-center opacity-10 dark:opacity-20"
                style={{
                  backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuCuU6i1D5-s7wQwSpSPbNqoX6gURWyiE_CTVXl6I8LC5-0Fpfz_Mvtzzi8nWvaZ16KlRA1uA0CzoSfvla64naWxGMDtd67JwhqKuz-H5vzXIsspSXObc-OMuvSllGJSWRWL6WccGHCMYLmKAu735k43JHGE3yWMKAXob7nmfBkXLf0dKFoUskX93M1Iz0RICXhX3WQ-lTstP6OSv_gb0tGAQmhkm5AzCpzAtvuV7i0M67_uwu6TAmKHF5m_GAEp90koPgGknXMzdWrW')`,
                }}
              />
              <div className="relative z-10 max-w-md text-center lg:text-left">
                <h1 className="text-3xl lg:text-4xl xl:text-5xl font-black leading-tight tracking-[-0.033em] text-neutral-dark-gray dark:text-white">
                  Welcome Back to PocketPilot
                </h1>
                <p className="mt-4 text-base lg:text-lg font-normal leading-normal text-neutral-dark-gray/80 dark:text-white/80">
                  Take control of your finances. Securely access your financial
                  dashboard and continue your journey to financial freedom.
                </p>
              </div>
            </div>

            {/* Right Column */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-neutral-white dark:bg-background-dark">
              <div className="w-full max-w-md space-y-6 sm:space-y-8">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-neutral-dark-gray dark:text-white">
                    Log in to your account
                  </h2>
                   <Link
              to="/register"
              className="text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white inline-block mt-2"
            >
              Don't have an account?{" "}
              <span className="font-bold text-primary">Sign Up</span>
            </Link>
                </div>

                {error && (
                  <div className="p-3 sm:p-4 text-xs sm:text-sm text-red-600 bg-red-50 dark:bg-red-900/10 dark:text-red-400 rounded-lg">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                    <FormInput
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email address"
                  required
                />

                  {/* Using the reusable component for password */}
                  <FormInput
                    label="Password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                  />

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex h-11 sm:h-12 w-full items-center justify-center rounded-lg bg-primary px-6 text-sm sm:text-base font-semibold text-slate-900 shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="truncate">
                      {loading ? "Logging in..." : "Log In"}
                    </span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Login;
