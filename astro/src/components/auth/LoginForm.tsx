/**
 * Login Form — React island with Zod validation.
 * Ported from frontend/app/login/page.tsx.
 */
import { useState } from "react";
import { apiFetch } from "../../lib/api-client";
import { loginSchema, formatZodErrors } from "../../lib/validation";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setErrors({});

    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      setErrors(formatZodErrors(validation.error));
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 dark:text-earth-300 mb-1">
          Email
        </label>
        <input
          type="email"
          id="login-email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="w-full px-4 py-2.5 border border-gray-200 dark:border-earth-600 rounded-lg bg-white dark:bg-earth-800 text-gray-900 dark:text-earth-100 focus:ring-2 focus:ring-sage-500 focus:border-sage-500"
        />
        {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 dark:text-earth-300 mb-1">
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            id="login-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full px-4 py-2.5 pr-10 border border-gray-200 dark:border-earth-600 rounded-lg bg-white dark:bg-earth-800 text-gray-900 dark:text-earth-100 focus:ring-2 focus:ring-sage-500 focus:border-sage-500"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-earth-300"
          >
            {showPassword ? "🙈" : "👁"}
          </button>
        </div>
        {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password}</p>}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full px-6 py-3 bg-gradient-to-r from-sage-600 to-earth-600 text-white font-medium rounded-xl shadow hover:shadow-lg transition-all disabled:opacity-50"
      >
        {loading ? "Signing in..." : "Sign In"}
      </button>

      <div className="text-center text-sm">
        <a href="/forgot-password" className="text-sage-600 dark:text-sage-400 hover:underline">Forgot password?</a>
        <span className="mx-2 text-gray-300 dark:text-earth-600">|</span>
        <a href="/register" className="text-sage-600 dark:text-sage-400 hover:underline">Create account</a>
      </div>
    </form>
  );
}
