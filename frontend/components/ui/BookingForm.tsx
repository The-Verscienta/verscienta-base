'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api-client';

interface BookingFormProps {
  practitionerId: string;
  practitionerName: string;
  className?: string;
  onSuccess?: () => void;
}

export function BookingForm({
  practitionerId,
  practitionerName,
  className = '',
  onSuccess,
}: BookingFormProps) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    preferredDate: '',
    preferredTime: 'flexible' as 'morning' | 'afternoon' | 'evening' | 'flexible',
    visitType: 'initial_consultation' as 'initial_consultation' | 'follow_up' | 'telehealth',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (success) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-xl p-6 text-center ${className}`}>
        <svg className="w-12 h-12 text-green-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="font-semibold text-green-800 mb-1">Booking Request Sent</h3>
        <p className="text-green-600 text-sm">
          {practitionerName} will contact you to confirm your appointment.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await apiFetch('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({
          practitionerId,
          ...form,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to submit booking.');
        return;
      }

      setSuccess(true);
      onSuccess?.();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Get tomorrow's date as min date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className={`bg-white dark:bg-earth-900 rounded-xl border border-gray-100 dark:border-earth-700 p-6 ${className}`}>
      <h3 className="font-semibold text-gray-800 dark:text-earth-100 mb-4">
        Request Appointment with {practitionerName}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="booking-name" className="block text-sm font-medium text-gray-700 dark:text-earth-200 mb-1">
            Full Name *
          </label>
          <input
            id="booking-name"
            type="text"
            required
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 dark:border-earth-600 dark:bg-earth-800 dark:text-earth-100 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-sage-500 outline-none transition"
          />
        </div>
        <div>
          <label htmlFor="booking-email" className="block text-sm font-medium text-gray-700 dark:text-earth-200 mb-1">
            Email *
          </label>
          <input
            id="booking-email"
            type="email"
            required
            value={form.email}
            onChange={(e) => updateField('email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 dark:border-earth-600 dark:bg-earth-800 dark:text-earth-100 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-sage-500 outline-none transition"
          />
        </div>
        <div>
          <label htmlFor="booking-phone" className="block text-sm font-medium text-gray-700 dark:text-earth-200 mb-1">
            Phone (optional)
          </label>
          <input
            id="booking-phone"
            type="tel"
            value={form.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 dark:border-earth-600 dark:bg-earth-800 dark:text-earth-100 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-sage-500 outline-none transition"
          />
        </div>
        <div>
          <label htmlFor="booking-date" className="block text-sm font-medium text-gray-700 dark:text-earth-200 mb-1">
            Preferred Date *
          </label>
          <input
            id="booking-date"
            type="date"
            required
            min={minDate}
            value={form.preferredDate}
            onChange={(e) => updateField('preferredDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 dark:border-earth-600 dark:bg-earth-800 dark:text-earth-100 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-sage-500 outline-none transition"
          />
        </div>
        <div>
          <label htmlFor="booking-time" className="block text-sm font-medium text-gray-700 dark:text-earth-200 mb-1">
            Preferred Time
          </label>
          <select
            id="booking-time"
            value={form.preferredTime}
            onChange={(e) => updateField('preferredTime', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 dark:border-earth-600 dark:bg-earth-800 dark:text-earth-100 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-sage-500 outline-none transition"
          >
            <option value="flexible">Flexible</option>
            <option value="morning">Morning (9AM-12PM)</option>
            <option value="afternoon">Afternoon (12PM-5PM)</option>
            <option value="evening">Evening (5PM-8PM)</option>
          </select>
        </div>
        <div>
          <label htmlFor="booking-type" className="block text-sm font-medium text-gray-700 dark:text-earth-200 mb-1">
            Visit Type
          </label>
          <select
            id="booking-type"
            value={form.visitType}
            onChange={(e) => updateField('visitType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 dark:border-earth-600 dark:bg-earth-800 dark:text-earth-100 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-sage-500 outline-none transition"
          >
            <option value="initial_consultation">Initial Consultation</option>
            <option value="follow_up">Follow-up Visit</option>
            <option value="telehealth">Telehealth</option>
          </select>
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="booking-message" className="block text-sm font-medium text-gray-700 dark:text-earth-200 mb-1">
          Additional Notes (optional)
        </label>
        <textarea
          id="booking-message"
          value={form.message}
          onChange={(e) => updateField('message', e.target.value)}
          placeholder="Describe your health concerns or reason for visit..."
          rows={3}
          maxLength={500}
          className="w-full px-3 py-2 border border-gray-200 dark:border-earth-600 dark:bg-earth-800 dark:text-earth-100 dark:placeholder-earth-500 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-sage-500 outline-none transition resize-none"
        />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full px-4 py-3 bg-sage-600 text-white rounded-lg font-medium hover:bg-sage-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {submitting ? 'Submitting...' : 'Request Appointment'}
      </button>

      <p className="text-xs text-gray-400 dark:text-earth-500 mt-3 text-center">
        This is a request only. The practitioner will confirm availability.
      </p>
    </form>
  );
}
