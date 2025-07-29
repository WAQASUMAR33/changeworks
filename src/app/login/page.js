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
                setErrorMsg(data.message || 'Login failed');
                setLoading(false);
                return;
            }

            localStorage.setItem('token', data.token);

            const role = data.user?.role?.toLowerCase();
            if (role === 'admin') {
                router.push('/admin');
            } else if (role === 'publisher') {
                router.push('/publisher');
            } else if (role === 'advertiser') {
                router.push('/advertiser');
            } else {
                setErrorMsg('Unknown user role');
            }

        } catch (err) {
            console.error(err);
            setErrorMsg('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row">
            {/* Left Side */}
            <div className="w-full md:w-1/2 bg-[#7e7efd] flex flex-col justify-center items-center p-6 md:p-10 text-center">
                <Image
                    src="/imgs/logo.png"
                    alt="HVM Logo"
                    width={120}
                    height={120}
                    className="mb-4"
                />
                <h2 className="text-lg md:text-xl font-semibold mb-4 text-black">
                    Login in to HVM with
                </h2>
                <div className="flex space-x-4 mb-4 md:mb-6">
                    <button className="bg-white p-3 rounded-full shadow-md">
                        <Image src="/imgs/google.webp" alt="Google" width={24} height={24} />
                    </button>
                    <button className="bg-white p-3 rounded-full shadow-md">
                        <Image src="/imgs/facebook.png" alt="Facebook" width={24} height={24} />
                    </button>
                    <button className="bg-white p-3 rounded-full shadow-md">
                        <Image src="/imgs/x.png" alt="X" width={24} height={24} />
                    </button>
                </div>
                <p className="text-sm mb-4 text-black">Or</p>
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
                            className="w-full bg-blue-600 text-white py-2 rounded-md font-semibold hover:bg-blue-700 transition"
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
