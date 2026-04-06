'use client';

import { useEffect, useState } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout
} from '@stripe/react-stripe-js';

interface StripePaymentProps {
  clientSecret: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function StripePayment({ clientSecret, onSuccess, onCancel }: StripePaymentProps) {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  useEffect(() => {
    const initializeStripe = async () => {
      const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      if (stripeKey) {
        setStripePromise(loadStripe(stripeKey));
      }
    };
    initializeStripe();
  }, []);

  if (!clientSecret) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg">
        <p className="text-gray-700">Подготовка платежа...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 rounded-lg">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Оплата банковской картой</h3>
        <p className="text-gray-600 text-sm">Введите данные вашей карты для оплаты</p>
      </div>
      
      {stripePromise ? (
        <EmbeddedCheckoutProvider 
          stripe={stripePromise} 
          options={{ clientSecret }}
        >
          <div className="mb-4">
            <EmbeddedCheckout />
          </div>
        </EmbeddedCheckoutProvider>
      ) : (
        <div className="py-4 text-center">
          <p className="text-gray-600">Загрузка формы оплаты...</p>
        </div>
      )}
      
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
        >
          Отмена
        </button>
        <button
          onClick={onSuccess}
          className="flex-1 py-2 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all"
        >
          Оплатить
        </button>
      </div>
    </div>
  );
}