import { useContext, useState } from "react";
import axios from "axios";
import { UserContext } from "./UserContext.jsx";

export default function RegisterAndLoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginOrRegister, setIsLoginOrRegister] = useState('login');

  const { setUsername: setLoggedInUsername, setId } = useContext(UserContext);

  async function handleSubmit(ev) {
    ev.preventDefault();

    const url =
      isLoginOrRegister === 'register' ? '/register' : '/login';

    try {
      const { data } = await axios.post(url, { username, password });

      // 🔥 DEBUG (VERY IMPORTANT)
      console.log("LOGIN RESPONSE:", data);

      if (!data?.id) {
        alert("Login failed: No user id received");
        return;
      }

      // ✅ SET USER DATA
      setLoggedInUsername(username);
      setId(data.id);

      console.log("USER ID SET:", data.id);

    } catch (err) {
      console.log("LOGIN ERROR:", err);
      alert('Something went wrong');
    }
  }

  return (
    <div className="bg-blue-50 h-screen flex items-center">
      <form className="w-64 mx-auto mb-12" onSubmit={handleSubmit}>
        
        <input
          value={username}
          onChange={ev => setUsername(ev.target.value)}
          type="text"
          placeholder="username"
          className="block w-full rounded-sm p-2 mb-2 border"
        />

        <input
          value={password}
          onChange={ev => setPassword(ev.target.value)}
          type="password"
          placeholder="password"
          className="block w-full rounded-sm p-2 mb-2 border"
        />

        <button className="bg-blue-500 text-white block w-full rounded-sm p-2">
          {isLoginOrRegister === 'register' ? 'Register' : 'Login'}
        </button>

        <div className="text-center mt-2">

          {isLoginOrRegister === 'register' && (
            <div>
              Already a member?
              <button
                type="button"
                className="ml-1 text-blue-600"
                onClick={() => setIsLoginOrRegister('login')}
              >
                Login here
              </button>
            </div>
          )}

          {isLoginOrRegister === 'login' && (
            <div>
              Dont have an account?
              <button
                type="button"
                className="ml-1 text-blue-600"
                onClick={() => setIsLoginOrRegister('register')}
              >
                Register
              </button>
            </div>
          )}

        </div>
      </form>
    </div>
  );
}