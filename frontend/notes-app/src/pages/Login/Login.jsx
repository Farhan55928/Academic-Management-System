import React, { useState } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import { Link, useNavigate } from 'react-router';
import PasswordInput from '../../components/Input/PasswordInput';
import { validateEmail } from '../../utils/helper';
import UseAxiosSecure from '../../Axios/UseAxiosSecure';
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setpassword] = useState('');
  const [error, setError] = useState(null);
  const axiosSecure = UseAxiosSecure();
  const navigate = useNavigate();
  const handleLgoin = async (e) => {
    e.preventDefault();
    setError('');
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!password) {
      setError('Please enter a valid password');
      return;
    }

    // Login API call
    try {
      const response = await axiosSecure.post('/api/users/login', {
        email: email,
        password: password,
      });
      const result = response?.data;
      const error = result.error;
      const message = result.message;
      const data = result.data;
      // console.log(result);
      console.log(error, message);
      localStorage.setItem('token', data.accesstoken);
      console.log(data.accesstoken);
      navigate('/');
      // Handle successful login notification
    } catch (error) {
      // Handle login error
      console.log(`Error in login: `, error);
    }
  };
  return (
    <>
      <Navbar />
      <div className="flex items-center justify-center mt-28">
        <div className="w-96 border rounded bg-white px-7 py-10">
          <form onSubmit={handleLgoin}>
            <h4 className="text-2xl mb-7">Login</h4>
            <input
              type="text"
              name="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
              }}
              id="email"
              placeholder="Email"
              className="input-box"
            />
            <PasswordInput
              value={password}
              onChange={(e) => setpassword(e.target.value)}
              placeholder={'Password'}
            />
            {error && <p className="text-red-500 text-xs py-1">{error}</p>}
            <button type="submit" className="btn-primary">
              Login
            </button>
            <p className="text-sm text-center mt-4">
              Not Registered Yet?{' '}
              <Link
                className="font-medium text-primary underline"
                to={'/register'}
              >
                Create an Account
              </Link>{' '}
            </p>
          </form>
        </div>
      </div>
    </>
  );
};

export default Login;
