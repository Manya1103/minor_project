// client/src/components/FormInput.js

import React, { useState } from "react";

const FormInput = ({
  label,
  name,
  type,
  value,
  onChange,
  placeholder,
  required = false,
  autoComplete,
}) => {
  const [inputType, setInputType] = useState(type);

  const togglePasswordVisibility = () => {
    setInputType(inputType === "password" ? "text" : "password");
  };

  const isPassword = type === "password";
  
  // Auto-determine autocomplete if not provided
  const getAutoComplete = () => {
    if (autoComplete) return autoComplete;
    if (type === "password") return "current-password";
    if (type === "email" || name === "email") return "email";
    if (name === "username") return "username";
    return "off";
  };

  return (
    <label className="flex flex-col">
      <p className="pb-2 text-sm font-medium leading-normal text-slate-800 dark:text-slate-200">
        {label}
      </p>
      <div className="flex w-full">
        <input
          type={inputType}
          name={name}
          value={value}
          onChange={onChange}
          autoComplete={getAutoComplete()}
          className={`form-input h-12 w-full flex-1 resize-none overflow-hidden border bg-transparent px-4 py-2.5 text-base font-normal leading-normal text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-primary ${
            isPassword ? "rounded-l-lg border-r-0" : "rounded-lg border-slate-300"
          }`}
          placeholder={placeholder}
          required={required}
        />
        {isPassword && (
          <div
            onClick={togglePasswordVisibility}
            className="flex h-12 cursor-pointer items-center justify-center rounded-r-lg border border-l-0 border-slate-300 bg-transparent px-3 dark:border-slate-700"
          >
            <span className="material-symbols-outlined text-xl text-slate-500 dark:text-slate-400">
              {inputType === "password" ? "visibility" : "visibility_off"}
            </span>
          </div>
        )}
      </div>
    </label>
  );
};

export default FormInput;