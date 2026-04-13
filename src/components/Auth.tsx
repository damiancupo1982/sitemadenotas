import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, ArrowLeft, Shield } from 'lucide-react';

const SECURITY_QUESTION = 'DNI de tu madre';
const SECURITY_ANSWER = '13846717';

type ForgotStep = 'question' | 'reset';

export function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState<ForgotStep>('question');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess('Cuenta creada. Ya puedes iniciar sesion.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSecurityQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) {
      setError('Ingresa tu email primero.');
      return;
    }
    if (securityAnswer.trim() === SECURITY_ANSWER) {
      setForgotStep('reset');
    } else {
      setError('Respuesta incorrecta. Intenta de nuevo.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Las contrasenhas no coinciden.');
      return;
    }
    if (newPassword.length < 6) {
      setError('La contrasenha debe tener al menos 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ email, newPassword }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cambiar la contrasenha.');
      setSuccess('Contrasenha actualizada correctamente. Ya puedes iniciar sesion.');
      resetForgotFlow();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForgotFlow = () => {
    setIsForgotPassword(false);
    setForgotStep('question');
    setSecurityAnswer('');
    setNewPassword('');
    setConfirmPassword('');
    setEmail('');
    setError('');
  };

  if (isForgotPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <button
            onClick={resetForgotFlow}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver
          </button>

          <div className="flex items-center justify-center mb-6">
            <div className="bg-amber-100 p-3 rounded-full">
              <Shield className="w-8 h-8 text-amber-600" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center mb-2 text-slate-800">
            Recuperar Contrasena
          </h1>

          {forgotStep === 'question' && (
            <>
              <p className="text-center text-slate-500 text-sm mb-6">
                Responde la pregunta de seguridad para continuar
              </p>
              <form onSubmit={handleSecurityQuestion} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email de tu cuenta
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
                    placeholder="tu@email.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Pregunta de seguridad
                  </label>
                  <div className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-sm font-medium">
                    {SECURITY_QUESTION}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tu respuesta
                  </label>
                  <input
                    type="text"
                    value={securityAnswer}
                    onChange={(e) => setSecurityAnswer(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
                    placeholder="Ingresa la respuesta..."
                    required
                  />
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-lg transition"
                >
                  Verificar
                </button>
              </form>
            </>
          )}

          {forgotStep === 'reset' && (
            <>
              <p className="text-center text-slate-500 text-sm mb-6">
                Respuesta correcta. Ingresa tu nueva contrasena.
              </p>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nueva contrasena
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
                    placeholder="Minimo 6 caracteres"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Confirmar contrasena
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
                    placeholder="Repite la contrasena"
                    required
                  />
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Guardando...' : 'Cambiar Contrasena'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <div className="bg-blue-600 p-3 rounded-full">
            <LogIn className="w-8 h-8 text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center mb-2 text-slate-800">
          Gestion de Negocios
        </h1>
        <p className="text-center text-slate-600 mb-8">
          {isSignUp ? 'Crear nueva cuenta' : 'Ingresa a tu cuenta'}
        </p>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Contrasena
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Cargando...' : isSignUp ? 'Registrarse' : 'Iniciar Sesion'}
          </button>
        </form>

        <div className="space-y-2 mt-4">
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccess(''); }}
            className="w-full text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            {isSignUp ? 'Ya tienes cuenta? Inicia sesion' : 'No tienes cuenta? Registrate'}
          </button>
          {!isSignUp && (
            <button
              onClick={() => { setIsForgotPassword(true); setError(''); setSuccess(''); }}
              className="w-full text-slate-600 hover:text-slate-700 text-sm font-medium"
            >
              Olvidaste tu contrasena?
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
