import React, { useState, useEffect } from 'react';
import {
  Activity,
  Play,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Radio,
  Server
} from 'lucide-react';
import api from '../services/api';

export default function ShiftRightConsole() {
  const [canaryStatus, setCanaryStatus] = useState(null);
  const [unleashFlagActive, setUnleashFlagActive] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [trafficResults, setTrafficResults] = useState([]);
  const [trafficStats, setTrafficStats] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  // Charger le statut au chargement
  useEffect(() => {
    refreshStatus();
  }, []);

  async function refreshStatus() {
    try {
      const res = await api.getShiftRightStatus();
      if (res) {
        setCanaryStatus(res.canaryRouter || { canaryPercentage: 10, status: 'ACTIVE_90_10' });
        if (res.unleash?.flags?.chaos_faulty_payment !== undefined) {
          setUnleashFlagActive(res.unleash.flags.chaos_faulty_payment);
        }
      }
    } catch (err) {
      console.warn('Erreur chargement statut Shift-Right:', err.message);
    }
  }

  // Activer la panne Unleash
  const handleToggleChaos = async (action) => {
    try {
      const res = await api.toggleUnleashFlag('chaos_faulty_payment', action);
      setUnleashFlagActive(action === 'on');
      setActionMessage({
        type: action === 'on' ? 'error' : 'success',
        text: action === 'on'
          ? '⚠️ Panne simulée Unleash ACTIVÉE : Les paiements vont échouer (HTTP 500).'
          : '✓ Kill Switch Unleash DÉCLENCHÉ : Service restauré en < 2s (HTTP 200).'
      });
      refreshStatus();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  // Rollback Canary (100% Stable)
  const handleRollback = async () => {
    try {
      const res = await api.rollbackCanary();
      setCanaryStatus(res.canaryRouter);
      setActionMessage({
        type: 'warning',
        text: '🔄 Rollback Nginx appliqué : 100% du trafic est désormais forcé vers la version Stable V1.'
      });
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  // Rétablir Canary (90% Stable / 10% Canary)
  const handlePromote = async () => {
    try {
      const res = await api.promoteCanary(10);
      setCanaryStatus(res.canaryRouter);
      setActionMessage({
        type: 'success',
        text: '✓ Routage Canary réactivé : 90% Stable V1 / 10% Canary V2.'
      });
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  // Tir de simulation de 10 requêtes consécutives
  const handleRunSimulation = async (count = 10) => {
    setSimulating(true);
    setTrafficResults([]);
    setActionMessage(null);

    const results = [];
    let stable = 0;
    let canary = 0;
    let success = 0;
    let fail = 0;

    for (let i = 1; i <= count; i++) {
      const start = Date.now();
      try {
        const res = await api.simulateShiftRightTransaction({
          userId: `student-cloud-${i}`,
          amount: 150.0
        });

        const duration = Date.now() - start;
        const release = res.metadata?.releaseType || res.releaseType || 'STABLE';
        const isSuccess = res.status === 200 || res.success;

        if (release === 'CANARY') canary++;
        else stable++;

        if (isSuccess) success++;
        else fail++;

        results.push({
          id: i,
          status: 200,
          releaseType: release,
          version: res.metadata?.version || (release === 'CANARY' ? 'v2.0.0-canary' : 'v1.0.0-stable'),
          duration,
          message: res.message || 'Transaction validée'
        });
      } catch (err) {
        const duration = Date.now() - start;
        fail++;
        stable++;
        results.push({
          id: i,
          status: 500,
          releaseType: 'STABLE',
          version: 'v1.0.0-stable',
          duration,
          message: err.message || 'ÉCHEC CRITIQUE (Simulated Failure)'
        });
      }

      setTrafficResults([...results]);
      // Pause de 80ms entre chaque requête pour visualiser l'animation
      await new Promise(r => setTimeout(r, 80));
    }

    setTrafficStats({
      total: count,
      stable,
      canary,
      success,
      fail,
      stablePct: ((stable / count) * 100).toFixed(0),
      canaryPct: ((canary / count) * 100).toFixed(0),
      failPct: ((fail / count) * 100).toFixed(0)
    });

    setSimulating(false);
  };

  const isRolledBack = canaryStatus?.canaryPercentage === 0;

  return (
    <div className="glass-panel" style={{
      padding: 28,
      marginBottom: 36,
      border: '1px solid rgba(99, 102, 241, 0.3)',
      background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 27, 75, 0.5) 100%)'
    }}>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div className="badge badge-primary" style={{ marginBottom: 6 }}>
            <Activity size={14} /> LIVE SHIFT-RIGHT CONTROLLER
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            Console Interactive : Routage Canary & Kill Switch Unleash
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '6px 0 0 0' }}>
            Démontrez en direct le routage progressif 90/10, l'injection de panne et le Rollback sans terminal.
          </p>
        </div>

        {/* Badges d'état en temps réel */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{
            padding: '8px 14px',
            borderRadius: 8,
            fontSize: '0.82rem',
            fontWeight: 600,
            background: isRolledBack ? 'rgba(239, 68, 68, 0.15)' : 'rgba(99, 102, 241, 0.15)',
            border: `1px solid ${isRolledBack ? 'rgba(239, 68, 68, 0.4)' : 'rgba(99, 102, 241, 0.4)'}`,
            color: isRolledBack ? '#fca5a5' : '#a5b4fc',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <Server size={14} />
            Routeur : {isRolledBack ? '100% Stable (Rollback)' : '90% Stable / 10% Canary'}
          </div>

          <div style={{
            padding: '8px 14px',
            borderRadius: 8,
            fontSize: '0.82rem',
            fontWeight: 600,
            background: unleashFlagActive ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.15)',
            border: `1px solid ${unleashFlagActive ? '#ef4444' : '#10b981'}`,
            color: unleashFlagActive ? '#fca5a5' : '#6ee7b7',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <Radio size={14} />
            Unleash Flag : {unleashFlagActive ? 'PANNE ACTIVE (500)' : 'NOMINAL (200)'}
          </div>
        </div>
      </div>

      {/* Message d'action feedback */}
      {actionMessage && (
        <div style={{
          padding: '12px 18px',
          borderRadius: 8,
          marginBottom: 20,
          fontSize: '0.9rem',
          fontWeight: 600,
          background: actionMessage.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : actionMessage.type === 'warning' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
          border: `1px solid ${actionMessage.type === 'error' ? '#ef4444' : actionMessage.type === 'warning' ? '#f59e0b' : '#10b981'}`,
          color: actionMessage.type === 'error' ? '#fca5a5' : actionMessage.type === 'warning' ? '#fde68a' : '#6ee7b7'
        }}>
          {actionMessage.text}
        </div>
      )}

      {/* Barre des boutons d'actions */}
      <div style={{
        display: 'flex',
        gap: 12,
        flexWrap: 'wrap',
        padding: 16,
        background: 'rgba(0, 0, 0, 0.25)',
        borderRadius: 12,
        marginBottom: 20
      }}>
        {/* Bouton Tir de requêtes */}
        <button
          onClick={() => handleRunSimulation(10)}
          disabled={simulating}
          className="btn btn-primary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          {simulating ? <RotateCcw size={16} className="animate-spin" /> : <Play size={16} />}
          Lancer 10 Requêtes Réelles
        </button>

        {/* Bascule Panne Unleash */}
        {!unleashFlagActive ? (
          <button
            onClick={() => handleToggleChaos('on')}
            className="btn btn-outline btn-sm"
            style={{ borderColor: '#ef4444', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <ShieldAlert size={16} color="#ef4444" /> Activer Panne Unleash (500)
          </button>
        ) : (
          <button
            onClick={() => handleToggleChaos('off')}
            className="btn btn-accent btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)' }}
          >
            <ShieldCheck size={16} /> Déclencher Kill Switch (Rétablir)
          </button>
        )}

        {/* Bascule Rollback Canary */}
        {!isRolledBack ? (
          <button
            onClick={handleRollback}
            className="btn btn-outline btn-sm"
            style={{ borderColor: '#f59e0b', color: '#fde68a', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RotateCcw size={16} color="#f59e0b" /> Déclencher Rollback Canary (100% Stable)
          </button>
        ) : (
          <button
            onClick={handlePromote}
            className="btn btn-outline btn-sm"
            style={{ borderColor: '#6366f1', color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Zap size={16} color="#818cf8" /> Réactiver Canary (90% / 10%)
          </button>
        )}
      </div>

      {/* Tableau des requêtes en direct */}
      {trafficResults.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
              Journal des Transactions en Temps Réel ({trafficResults.length}/10)
            </h4>
            {trafficStats && (
              <div style={{ fontSize: '0.82rem', display: 'flex', gap: 14 }}>
                <span style={{ color: '#818cf8' }}>Stable: <strong>{trafficStats.stable} ({trafficStats.stablePct}%)</strong></span>
                <span style={{ color: '#fde047' }}>Canary: <strong>{trafficStats.canary} ({trafficStats.canaryPct}%)</strong></span>
                <span style={{ color: trafficStats.fail > 0 ? '#ef4444' : '#10b981' }}>
                  Succès: <strong>{trafficStats.success}/{trafficStats.total}</strong>
                </span>
              </div>
            )}
          </div>

          <div style={{
            maxHeight: 220,
            overflowY: 'auto',
            background: 'rgba(0, 0, 0, 0.4)',
            borderRadius: 8,
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <table style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-dim)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px' }}>#</th>
                  <th style={{ padding: '8px 12px' }}>Statut HTTP</th>
                  <th style={{ padding: '8px 12px' }}>Pool Canary</th>
                  <th style={{ padding: '8px 12px' }}>Version</th>
                  <th style={{ padding: '8px 12px' }}>Latence</th>
                  <th style={{ padding: '8px 12px' }}>Message</th>
                </tr>
              </thead>
              <tbody>
                {trafficResults.map((req) => (
                  <tr key={req.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '6px 12px', color: 'var(--text-dim)' }}>#{String(req.id).padStart(2, '0')}</td>
                    <td style={{ padding: '6px 12px' }}>
                      <span className={`badge ${req.status === 200 ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.72rem' }}>
                        {req.status} {req.status === 200 ? 'OK' : 'ERR'}
                      </span>
                    </td>
                    <td style={{ padding: '6px 12px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: req.releaseType === 'CANARY' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                        color: req.releaseType === 'CANARY' ? '#fde047' : '#818cf8',
                        border: `1px solid ${req.releaseType === 'CANARY' ? '#ca8a04' : '#4f46e5'}`
                      }}>
                        {req.releaseType === 'CANARY' ? '[CANARY v2]' : '[STABLE v1]'}
                      </span>
                    </td>
                    <td style={{ padding: '6px 12px', color: 'var(--text-muted)' }}>{req.version}</td>
                    <td style={{ padding: '6px 12px', color: 'var(--text-muted)' }}>{req.duration} ms</td>
                    <td style={{ padding: '6px 12px', color: req.status === 200 ? 'var(--text-muted)' : '#fca5a5' }}>
                      {req.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
