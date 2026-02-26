'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { Toast } from '@/components/ui/Toast';
import Link from 'next/link';
import { PageWrapper, BackLink } from '@/components/ui/DesignSystem';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export default function ProfilePage() {
  const { user, isAuthenticated, refreshAuth } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Partial<ProfileFormData>>({});

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/profile');
    } else {
      setLoading(false);
      if (user) {
        setFormData({
          firstName: user.field_first_name || '',
          lastName: user.field_last_name || '',
          email: user.mail || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }
    }
  }, [isAuthenticated, user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ProfileFormData> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Password change validation
    if (formData.newPassword || formData.confirmPassword) {
      if (!formData.currentPassword) {
        newErrors.currentPassword = 'Current password is required to change password';
      }

      if (formData.newPassword && formData.newPassword.length < 8) {
        newErrors.newPassword = 'Password must be at least 8 characters';
      }

      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      const updateData: any = {
        field_first_name: formData.firstName,
        field_last_name: formData.lastName,
        mail: formData.email,
      };

      // Include password change if provided
      if (formData.newPassword) {
        updateData.current_password = formData.currentPassword;
        updateData.pass = formData.newPassword;
      }

      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update profile');
      }

      // Refresh user data
      await refreshAuth();

      // Clear password fields
      setFormData((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));

      setToast({ message: 'Profile updated successfully!', type: 'success' });
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to update profile', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageWrapper>
        <div className="min-h-screen flex items-center justify-center bg-earth-50/30">
          <Loading text="Loading profile..." />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
    <div className="max-w-4xl mx-auto px-4 py-8 bg-earth-50/30 min-h-screen">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={5000}
        />
      )}

      {/* Breadcrumbs */}
      <nav className="mb-6 text-sm">
        <Link href="/" className="text-sage-600 hover:text-sage-800">Home</Link>
        {' / '}
        <span className="text-gray-800">My Profile</span>
      </nav>

      <h1 className="text-4xl font-bold text-gray-800 mb-8">My Profile</h1>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <Card className="sticky top-4">
            <div className="text-center">
              <div className="w-24 h-24 bg-earth-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-1">
                {user?.name || 'User'}
              </h2>
              <p className="text-sm text-gray-600 mb-4">{user?.mail}</p>

              {user?.roles && user.roles.length > 0 && (
                <div className="space-y-1">
                  {user.roles.map((role: string, idx: number) => (
                    <span
                      key={idx}
                      className="inline-block bg-sage-100 text-sage-700 text-xs px-2 py-1 rounded mr-1"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
              <Link
                href="/profile"
                className="block px-4 py-2 text-gray-800 bg-earth-50 rounded-lg font-medium"
              >
                Profile Settings
              </Link>
              {user?.roles?.includes('admin') && (
                <a
                  href="https://backend.ddev.site/admin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  Admin Panel
                </a>
              )}
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card title="Personal Information">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  name="firstName"
                  label="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  error={errors.firstName}
                  required
                />

                <Input
                  name="lastName"
                  label="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  error={errors.lastName}
                  required
                />
              </div>

              <Input
                name="email"
                type="email"
                label="Email Address"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                required
              />

              <div className="flex justify-end">
                <Button type="submit" loading={saving}>
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>

          {/* Change Password */}
          <Card title="Change Password">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                name="currentPassword"
                type="password"
                label="Current Password"
                value={formData.currentPassword}
                onChange={handleChange}
                error={errors.currentPassword}
                helperText="Required to change your password"
              />

              <Input
                name="newPassword"
                type="password"
                label="New Password"
                value={formData.newPassword}
                onChange={handleChange}
                error={errors.newPassword}
                helperText="At least 8 characters"
              />

              <Input
                name="confirmPassword"
                type="password"
                label="Confirm New Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
              />

              <div className="flex justify-end">
                <Button type="submit" loading={saving} variant="secondary">
                  Update Password
                </Button>
              </div>
            </form>
          </Card>

          {/* Account Information */}
          <Card title="Account Information">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Username:</span>
                <span className="font-medium text-gray-900">{user?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">User ID:</span>
                <span className="font-medium text-gray-900">{user?.uid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Account Created:</span>
                <span className="font-medium text-gray-900">
                  {user?.created ? new Date(parseInt(user.created) * 1000).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Login:</span>
                <span className="font-medium text-gray-900">
                  {user?.access ? new Date(parseInt(user.access) * 1000).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-8">
        <BackLink href="/" label="Return to Home" />
      </div>
    </div>
    </PageWrapper>
  );
}
