"use client";

import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { triggerHaptic } from '@/utils/haptics';

interface LoginResponse {
  token: string;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    math_admin: boolean;
  };
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { login: contextLogin } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const NEXT_PUBLIC_ENV = process.env.NEXT_PUBLIC_ENV;
  const { execute: executeLogin, isLoading, error, clearError } = useApi<LoginResponse>('auth-token/volunteer/', {
    method: 'POST',
    isPublic: true,
  });

  useEffect(() => {
    setIsMounted(true);
    if (isMounted && !RECAPTCHA_SITE_KEY) {
      console.error("Error: La variable de entorno NEXT_PUBLIC_RECAPTCHA_SITE_KEY no está configurada o no es accesible.");
    }
  }, [isMounted, RECAPTCHA_SITE_KEY]);

  if (!isMounted) {
    return null;
  }
  return (
    <GoogleReCaptchaProvider reCaptchaKey={RECAPTCHA_SITE_KEY || ''} language="es">
      <LoginForm
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        isMounted={isMounted}
        isLoading={isLoading}
        error={error}
        handleLoginApi={async (email: string, password: string, recaptcha: string) => {
          return executeLogin({ email, password, recaptcha });
        }}
        RECAPTCHA_SITE_KEY={RECAPTCHA_SITE_KEY}
        NEXT_PUBLIC_ENV={NEXT_PUBLIC_ENV}
        contextLogin={contextLogin}
        router={router}
        clearError={clearError}
      />
    </GoogleReCaptchaProvider>
  );

}

function LoginForm({ email, setEmail, password, setPassword, isMounted, isLoading, error, handleLoginApi, RECAPTCHA_SITE_KEY, NEXT_PUBLIC_ENV, contextLogin, router, clearError }: any) {
  const { executeRecaptcha } = useGoogleReCaptcha();

  const [loginError, setLoginError] = useState<string>("");

  const getFriendlyError = (err: any): string => {
    if (err?.body?.detail) {
      if (err.body.detail.toLowerCase().includes('bad request')) {
        return 'Revisa tus credenciales y vuelve a intentar.';
      }
      return err.body.detail;
    }
    if (err?.detail) {
      if (typeof err.detail === 'string' && err.detail.toLowerCase().includes('bad request')) {
        return 'Revisa tus credenciales y vuelve a intentar.';
      }
      return err.detail;
    }
    if (err?.message) {
      if (err.message === 'Load failed') return 'No se pudo cargar la información. Verifica tu conexión o intenta más tarde.';
      if (err.message.toLowerCase().includes('bad request')) return 'Revisa tus credenciales y vuelve a intentar.';
      return err.message;
    }
    return "Ocurrió un error inesperado. Por favor, intenta de nuevo.";
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    triggerHaptic(20);
    clearError();
    setLoginError("");

    if (NEXT_PUBLIC_ENV === 'prod') {
      if (!RECAPTCHA_SITE_KEY) {
        setLoginError('Falta la configuración de reCAPTCHA. Por favor, avise al administrador.');
        return;
      }
      if (!executeRecaptcha) {
        setLoginError('No se pudo inicializar reCAPTCHA.');
        return;
      }
      try {
        const recaptchaToken = await executeRecaptcha('sign_in');
        if (!recaptchaToken) {
          setLoginError('No se pudo obtener el token de reCAPTCHA. Por favor, intente de nuevo.');
          return;
        }
        const data = await handleLoginApi(email, password, recaptchaToken);
        if (data && data.token && data.user) {
          localStorage.setItem('authToken', data.token);
          const userName = `${data.user.first_name} ${data.user.last_name || ''}`.trim();
          localStorage.setItem('userName', userName);
          if (data.user.math_admin) localStorage.setItem('isAdmin', 'true');
          if (data.user.id) localStorage.setItem('userId', data.user.id.toString());
          contextLogin(data.token, data.user);
          router.push('/');
        } else if (data && data.detail) {
          setLoginError(data.detail);
        } else {
          setLoginError("Credenciales incorrectas o usuario no encontrado.");
        }
      } catch (err: any) {
        console.error("Falló el intento de login:", err);
        setLoginError(getFriendlyError(err));
      }
    } else {
      try {
        const data = await handleLoginApi(email, password, 'mock-recaptcha-token');
        if (data && data.token && data.user) {
          localStorage.setItem('authToken', data.token);
          const userName = `${data.user.first_name} ${data.user.last_name || ''}`.trim();
          localStorage.setItem('userName', userName);
          if (data.user.math_admin) localStorage.setItem('isAdmin', 'true');
          if (data.user.id) localStorage.setItem('userId', data.user.id.toString());
          contextLogin(data.token, data.user);
          router.push('/');
        } else if (data && data.detail) {
          setLoginError(data.detail);
        } else {
          setLoginError("Credenciales incorrectas o usuario no encontrado.");
        }
      } catch (err: any) {
        console.error("Falló el intento de login:", err);
        setLoginError(getFriendlyError(err));
      }
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-dvh bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-sm p-8 space-y-8 nm-surface dark:bg-gray-800 shadow-2xl rounded-xl">
        <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-white">Bienvenido</h1>
        <form
          onSubmit={handleSubmit} className="space-y-7"
        >
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              id="email" name="email" type="email" autoComplete="email" required
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="mt-2 block w-full px-4 py-3 nm-input rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-0 focus:border-transparent active:outline-none active:ring-0 active:border-transparent sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              style={{ boxShadow: 'none' }}
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Contraseña
            </label>
            <input
              id="password" name="password" type="password" autoComplete="current-password" required
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="mt-2 block w-full px-4 py-3 nm-input rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-0 focus:border-transparent active:outline-none active:ring-0 active:border-transparent sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              style={{ boxShadow: 'none' }}
              placeholder="••••••••"
            />
          </div>

          {(error || loginError) && (
            <p className="text-sm text-red-600 dark:text-red-400 text-center p-3 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-md">
              {loginError || error}
            </p>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading || (isMounted && !RECAPTCHA_SITE_KEY)}
              className="w-full flex justify-center py-3 px-4 nm-btn-primary text-base font-semibold transition-all duration-150 ease-in-out active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}