'use client';
import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

   const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });

            const data = await res.json();

            if (!res.ok) {
                setErrorMsg(data.error || 'Login failed');
                return;
            }

            // Save token and user info
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Redirect based on role
            if (data.user.role === 'ADMIN') {
                router.push('/admin');
            } else if (data.user.role === 'DONOR') {
                router.push('/admin');
            } else {
                router.push('/admin');
            }

        } catch (err) {
            console.error('Login error:', err);
            setErrorMsg('Something went wrong');
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="min-h-screen flex flex-col md:flex-row">
            {/* Left Side */}
            <div className="w-full md:w-1/2 bg-[#302E56] flex flex-col justify-center items-center p-6 md:p-10 text-center">
             
                <Image
                    src="/imgs/changeworks.jpg"
                    alt="Illustration"
                    width={250}
                    height={250}
                    className="max-w-full h-auto"
                />
            </div>

            {/* Right Side */}
            <div className="w-full md:w-1/2 bg-white flex justify-center items-center p-6 md:p-10">
                <div className="w-full max-w-sm">
                    <h2 className="text-2xl font-bold mb-6 text-center md:text-left">Login</h2>

                    {errorMsg && (
                        <div className="mb-4 text-sm text-red-600 bg-red-100 px-4 py-2 rounded">
                            {errorMsg}
                        </div>
                    )}

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <div>
                            <label className="block mb-1 font-medium">Email</label>
                            <input
                                name="email"
                                type="email"
                                placeholder="Enter your Email address"
                                value={form.email}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="relative">
                            <label className="block mb-1 font-medium">Password</label>
                            <input
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter your Password"
                                value={form.password}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-9 text-gray-600 focus:outline-none"
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-sm gap-y-2">
                            <label className="flex items-center gap-2">
                                <input type="checkbox" className="h-4 w-4" />
                                Remember me
                            </label>
                            <a href="#" className="text-blue-600 hover:underline">
                                Forget Password?
                            </a>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-[#302E56] text-white py-2 rounded-md font-semibold hover:bg-blue-700 transition"
                            disabled={loading}
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>

                    <p className="mt-6 text-sm text-center">
                        If you don’t have an account?{' '}
                        <a href="/signup" className="text-blue-600 hover:underline">
                            Register now
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
