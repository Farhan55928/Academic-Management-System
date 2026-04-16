import { useState } from 'react';
import PasswordInput from '../../components/Input/PasswordInput';
import Navbar from '../../components/Navbar/Navbar';
import { Link, useNavigate } from 'react-router';
import { validateEmail } from '../../utils/helper';
import UseAxiosSecure from '../../Axios/UseAxiosSecure';

const SignUp = () => {
  const axiosSecure = UseAxiosSecure();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [password, setpassword] = useState('');

  const HandleSignUp = async (e) => {
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
    if (!name) {
      setError('Please enter a valid Name');
      return;
    }
    console.log(name, email, password);
    const userpayload = {
      fullname: name,
      email,
      password,
    };
    // signup API Call
    try {
      const response = await axiosSecure.post(
        '/api/users/create-account',
        userpayload
      );
      console.log(`Successful User Account Creation`, response.data);
      localStorage.setItem('token', response.data.data.accesstoken);
      navigate('/');
    } catch (error) {
      console.log(error.response.data.message);
    }
    setEmail('');
    setName('');
    setpassword('');
  };

  return (
    <>
      <Navbar />
      <div className="flex items-center justify-center mt-28">
        <div className="w-96 border rounded bg-white px-7 py-10">
          <form onSubmit={HandleSignUp}>
            <h4 className="text-2xl mb-7">SignUp</h4>
            <input
              type="text"
              name="name"
              id="name"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-box"
            />
            <input
              type="text"
              name="email"
              id="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-box"
            />
            <PasswordInput
              value={password}
              onChange={(e) => setpassword(e.target.value)}
              placeholder={'Password'}
            />

            {error && <p className="text-red-500 text-xs py-1">{error}</p>}
            <button type="submit" className="btn-primary">
              Register
            </button>
            <p className="text-sm text-center mt-4">
              Already have an Account?{' '}
              <Link
                className="font-medium text-primary underline"
                to={'/login'}
              >
                Login
              </Link>{' '}
            </p>
          </form>
        </div>
      </div>
    </>
  );
};

export default SignUp;
