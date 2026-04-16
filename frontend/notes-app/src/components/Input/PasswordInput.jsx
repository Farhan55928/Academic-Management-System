import React, { useState } from 'react';
import { FaRegEye, FaRegEyeSlash } from 'react-icons/fa';

const PasswordInput = ({ value, onChange, placeholder }) => {
  const [isShowPassword, setShowPassword] = useState(false);
  const toggleShowPassword = () => {
    setShowPassword(!isShowPassword);
  };
  return (
    <div className="flex items-center bg-transparent border-[1.5px] px-5 py-3 rounded mb-3">
      <input
        type={isShowPassword ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        name="password"
        id="password"
        placeholder={placeholder || 'Password'}
        className="w-full text-sm bg-transparent py-3 mr-3 rounded outline-none"
      />
      {!isShowPassword && ( 
        <FaRegEye
          size={22}
          className="text-primary cursor-pointer"
          onClick={toggleShowPassword}
        />
      )}
      {isShowPassword && (
        <FaRegEyeSlash
          size={22}
          className="text-primary cursor-pointer"
          onClick={toggleShowPassword}
        />
      )}
    </div>
  );
};

export default PasswordInput;
