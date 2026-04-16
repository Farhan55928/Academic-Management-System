import React, { useState } from 'react';
import ProfileInfo from '../Cards/ProfileInfo';
import SearchBar from '../SearchBar';
import { useNavigate } from 'react-router';

const Navbar = ({ userinfo }) => {
  const navigate = useNavigate();
  const [searchQuery, setsearchQuery] = useState('');
  const HandleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };
  const HandleClearSearch = (e) => {
    e.preventDefault();
    setsearchQuery('');
  };
  return (
    <div className="flex items-center justify-between px-6 py-2 bg-white drop-shadow">
      <h2 className="text-xl font-bold font-mono text-black py-2">Notify</h2>
      <SearchBar
        value={searchQuery}
        onChange={(e) => {
          setsearchQuery(e.target.value);
        }}
        onClearSearch={HandleClearSearch}
      />
      <ProfileInfo userinfo={userinfo} onLogout={HandleLogout} />
    </div>
  );
};

export default Navbar;
