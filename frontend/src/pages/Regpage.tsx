import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';

const Regpage = () => {
  const navigate = useNavigate();
  const { refreshAuth } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegisterMode = mode === 'register';

  const resetMessages = () => {
    setError('');
    setSuccessMessage('');
  };

  const handleModeChange = (nextMode: 'login' | 'register') => {
    setMode(nextMode);
    resetMessages();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetMessages();

    if (isRegisterMode && username.trim().length < 3) {
      setError('Username must be at least 3 characters long.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);

    try {
      const endpoint = isRegisterMode ? '/api/auth/register' : '/api/auth/login';
      const payload = isRegisterMode
        ? { username: username.trim(), email: email.trim(), password }
        : { email: email.trim(), password };

      const response = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const rawResponse = await response.text();
      let data: { message?: string } | string | null = null;

      if (rawResponse) {
        try {
          data = JSON.parse(rawResponse);
        } catch {
          data = rawResponse;
        }
      }

      if (!response.ok) {
        const message =
          typeof data === 'string'
            ? data
            : data?.message ?? 'Authentication failed. Please try again.';
        throw new Error(message);
      }

      if (isRegisterMode) {
        setSuccessMessage('Account created successfully. You can log in now.');
        setMode('login');
        setPassword('');
        return;
      }

      await refreshAuth();
      setSuccessMessage('Logged in successfully.');
      navigate('/dashboard');
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : 'Something went wrong. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <img src="/logo_new.png" className="rounded-full mb-5 w-70 h-50 mx-auto" />

        <div className="flex border rounded-md mb-6 overflow-hidden">
          <button
            type="button"
            onClick={() => handleModeChange('login')}
            className={`flex-1 py-2 font-medium transition ${
              mode === 'login'
                ? 'bg-gray-400 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('register')}
            className={`flex-1 py-2 font-medium transition ${
              mode === 'register'
                ? 'bg-gray-400 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {isRegisterMode && (
            <div>
              <p className="font-medium text-black flex-1">Username</p>
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="your_username"
                className="w-full border p-2 rounded focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
          )}

          <div>
            <p className="font-medium text-black flex-1">Email</p>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="email@example.com"
              className="w-full border p-2 rounded focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>
          <div>
            <p className="font-medium text-black flex-1">Password</p>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className="w-full border p-2 rounded focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {successMessage && <p className="text-sm text-green-600">{successMessage}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-neutral-800 text-white py-3 rounded-md mt-2 font-bold hover:bg-black disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Please wait...' : isRegisterMode ? 'Register' : 'Login'}
          </button>
        </form>

        <button type="button" className="text-sm text-gray-500 mt-4 underline block mx-auto">
          Forgot password?
        </button>
      </div>
    </div>
  );
};

export default Regpage;
