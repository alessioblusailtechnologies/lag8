'use client';

import { useState, FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import styles from './login.module.scss';

export default function LoginPage() {
  const { login, register, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleMode = () => {
    setIsRegister((v) => !v);
    setError(null);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (isRegister) {
        await register(email, password, fullName || undefined);
        setIsRegister(false);
        setPassword('');
      } else {
        await login(email, password);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Errore durante l'autenticazione";
      setError(msg);
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginCard}>
        <div className={styles.loginLogo}>
          <div className={styles.mark}>
            <span className={styles.markInner}>L8</span>
          </div>
          <div className={styles.loginBrand}>
            lag8<span className={styles.ai}>.ai</span>
          </div>
        </div>

        <h1 className={styles.loginTitle}>
          {isRegister ? 'Crea un account' : 'Accedi al tuo account'}
        </h1>
        <p className={styles.loginSubtitle}>
          {isRegister
            ? 'Inserisci i tuoi dati per registrarti'
            : 'Inserisci le tue credenziali per continuare'}
        </p>

        {error && <div className={styles.loginError}>{error}</div>}

        <form onSubmit={onSubmit} className={styles.loginForm}>
          {isRegister && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Nome completo</label>
              <input
                className={styles.formInput}
                type="text"
                placeholder="es. Marco Pellegrini"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          )}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Email</label>
            <input
              className={styles.formInput}
              type="email"
              placeholder="email@esempio.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Password</label>
            <input
              className={styles.formInput}
              type="password"
              placeholder="La tua password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className={styles.loginBtn} type="submit" disabled={loading}>
            {loading ? 'Caricamento...' : isRegister ? 'Registrati' : 'Accedi'}
          </button>
        </form>

        <div className={styles.loginSwitch}>
          {isRegister ? (
            <>
              Hai già un account?{' '}
              <button className={styles.linkBtn} onClick={toggleMode}>
                Accedi
              </button>
            </>
          ) : (
            <>
              Non hai un account?{' '}
              <button className={styles.linkBtn} onClick={toggleMode}>
                Registrati
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
