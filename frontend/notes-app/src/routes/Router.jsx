import React from 'react';
import { createBrowserRouter } from 'react-router';
import Home from '../pages/Home/Home';
import Login from '../pages/Login/Login';
import SignUp from '../pages/Signup/SignUp';

const router = createBrowserRouter([
  {
    path: '/',
    Component: Home,
  },
  {
    path: '/login',
    Component: Login,
  },
  {
    path: '/register',
    Component: SignUp,
  },
]);

export default router;
