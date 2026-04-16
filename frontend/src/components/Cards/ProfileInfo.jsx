import React from 'react';
import { getInitials } from '../../utils/helper';
const ProfileInfo = ({ userinfo, onLogout }) => {
  // console.log(userinfo);
  return (
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 flex items-center justify-center rounded-full text-slate-950 font-medium bg-slate-100">
        {getInitials(userinfo?.fullname)}
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">{userinfo?.fullname}</p>
        <button className="text-sm text-slate-700 underline" onClick={onLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default ProfileInfo;
