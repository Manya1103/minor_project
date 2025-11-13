import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import FormInput from "../components/FormInput"; // Import the new component

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { loginUser } = useContext(AuthContext);
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match");
    }

    if (formData.password.length < 6) {
      return setError("Password must be at least 6 characters");
    }

    setLoading(true);

    try {
      const res = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      loginUser(res.data.token, res.data.user);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-display bg-background-light dark:bg-background-dark">
      <header className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 lg:px-10 lg:py-8">
        <img 
          src={isDark ? "/PocketPilot-Logo-dark.png" : "/PocketPilot-Logo.png"}
          alt="PocketPilot - Your Smart Financial Co-Pilot" 
          className="h-40 w-auto"
        />
        <div className="hidden items-center gap-9 sm:flex">
          <Link
            to="/login"
            className="text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            Already have an account?{" "}
            <span className="font-bold text-primary">Log In</span>
          </Link>
        </div>
      </header>

      <main className="flex w-full max-w-6xl flex-1 items-center justify-center py-20 sm:py-24">
        <div className="grid w-full grid-cols-1 gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="flex w-full flex-col justify-center space-y-6 sm:space-y-8 rounded-lg bg-white p-6 mt-10 shadow-md dark:bg-gray-800 sm:p-8 lg:w-auto lg:bg-transparent lg:p-0 lg:shadow-none dark:lg:bg-transparent">
            <div >
              <div className="flex flex-col gap-2">
                <p className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight tracking-[-0.033em] text-slate-900 dark:text-white">
                  Start Your Financial Journey
                </p>
                <p className="text-sm sm:text-base font-normal leading-normal text-slate-500 dark:text-slate-400">
                  It only takes a minute to get started.
                </p>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 sm:p-4 text-xs sm:text-sm text-red-500 dark:bg-red-900/10 dark:text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-6">
                {/* Replaced old labels/inputs with the new component */}
                <FormInput
                  label="Full Name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                />
                <FormInput
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email address"
                  required
                />
                <FormInput
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  required
                />
                <FormInput
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  required
                />
              </div>

              <div className="flex items-start">
                <div className="flex h-5 sm:h-6 items-center">
                  <input
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary dark:border-slate-600 dark:bg-slate-800 dark:ring-offset-slate-900"
                    id="terms"
                    name="terms"
                    type="checkbox"
                    required
                  />
                </div>
                <div className="ml-3 text-xs sm:text-sm leading-5 sm:leading-6">
                  <label
                    className="text-slate-500 dark:text-slate-400"
                    htmlFor="terms"
                  >
                    By creating an account, you agree to our{" "}
                    <Link
                      to="/terms"
                      className="font-medium text-primary hover:underline"
                    >
                      Terms of Service
                    </Link>
                    .
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex h-11 sm:h-12 w-full items-center justify-center rounded-lg bg-primary px-6 text-sm sm:text-base font-semibold text-slate-900 shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating account..." : "Create My Free Account"}
              </button>

              <div className="flex justify-center sm:hidden">
                <Link
                  to="/login"
                  className="text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  Already have an account?{" "}
                  <span className="font-bold text-primary">Log In</span>
                </Link>
              </div>
            </form>
          </div>

          <div className="hidden items-center justify-center lg:flex">
            <div className="relative flex h-full w-full items-center justify-center rounded-2xl bg-slate-100 p-8 dark:bg-slate-900/50">
              <img
                className="h-full w-full rounded-xl object-cover"
                src={isDark ? "/PocketPilot-Logo-1.png" : "/PocketPilot-Logo.png"}
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-background-dark/50 to-transparent"></div>
              <div className="absolute bottom-5 left-8 right-8 rounded-lg border border-white/10 bg-black/20 p-6 text-white backdrop-blur-lg">
                <h3 className="mb-2 text-lg sm:text-xl font-bold">
                  Chart Your Course to Financial Freedom
                </h3>
                <p className="text-xs sm:text-sm text-slate-300">
                  PocketPilot makes it simple to track your spending, set goals,
                  and build a brighter financial future. Welcome aboard!
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Register;