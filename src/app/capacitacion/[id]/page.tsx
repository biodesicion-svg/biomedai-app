'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ─── Types ───────────────────────────────────────────────────────────────────
interface Slide {
  id: number;
  tipo: string;
  titulo: string;
  subtitulo?: string;
  icono: string;
  color: string;
  contenido: string;
}

interface Pregunta {
  id: number;
  pregunta: string;
  opciones: string[];
  correcta: number;
  explicacion: string;
}

interface Capacitacion {
  id: string;
  titulo: string;
  equipo: string;
  descripcion: string;
  slides_json: Slide[];
  preguntas_json: Pregunta[];
  puntaje_aprobacion: number;
  institution_id: string;
}

interface Institution {
  id: string;
  nombre: string;
  logo_url?: string;
}

interface Participante {
  nombre: string;
  empresa: string;
  servicio: string;
  cargo: string;
}

type Fase = 'identificacion' | 'slides' | 'evaluacion' | 'resultado';

// ─── Main Component ──────────────────────────────────────────────────────────
export default function CapacitacionPublicaPage({ params }: { params: { id: string } }) {
  const [cap, setCap] = useState<Capacitacion | null>(null);
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [loading, setLoading] = useState(true);
  const [fase, setFase] = useState<Fase>('identificacion');
  const [participante, setParticipante] = useState<Participante>({ nombre: '', empresa: '', servicio: '', cargo: '' });
  const [slideActual, setSlideActual] = useState(0);
  const [respuestas, setRespuestas] = useState<(number | null)[]>([]);
  const [respuestaSeleccionada, setRespuestaSeleccionada] = useState<number | null>(null);
  const [mostrarExplicacion, setMostrarExplicacion] = useState(false);
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [score, setScore] = useState(0);
  const [sesionId, setSesionId] = useState<string | null>(null);
  const [startTime] = useState(Date.now());
  const [animating, setAnimating] = useState(false);
  const [slideProgress, setSlideProgress] = useState(0);

  useEffect(() => {
    loadCapacitacion();
  }, [params.id]);

  // Slide auto-progress bar
  useEffect(() => {
    if (fase !== 'slides') return;
    setSlideProgress(0);
    const interval = setInterval(() => {
      setSlideProgress(p => Math.min(p + 0.5, 100));
    }, 150);
    return () => clearInterval(interval);
  }, [slideActual, fase]);

  async function loadCapacitacion() {
    const { data: capData } = await supabase
      .from('capacitaciones')
      .select('*')
      .eq('id', params.id)
      .eq('activo', true)
      .single();

    if (!capData) { setLoading(false); return; }
    setCap(capData);

    const { data: instData } = await supabase
      .from('institutions')
      .select('id, nombre, logo_url')
      .eq('id', capData.institution_id)
      .single();

    if (instData) setInstitution(instData);
    setRespuestas(new Array(capData.preguntas_json.length).fill(null));
    setLoading(false);
  }

  function iniciarCapacitacion() {
    if (!participante.nombre.trim() || !participante.cargo.trim()) return;
    setFase('slides');
  }

  function nextSlide() {
    if (!cap) return;
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      if (slideActual < cap.slides_json.length - 1) {
        setSlideActual(s => s + 1);
      } else {
        setFase('evaluacion');
        setPreguntaActual(0);
      }
      setAnimating(false);
    }, 300);
  }

  function prevSlide() {
    if (slideActual > 0 && !animating) {
      setAnimating(true);
      setTimeout(() => {
        setSlideActual(s => s - 1);
        setAnimating(false);
      }, 300);
    }
  }

  function responder(opcionIdx: number) {
    if (respuestaSeleccionada !== null) return;
    setRespuestaSeleccionada(opcionIdx);
    setMostrarExplicacion(true);
    const nuevas = [...respuestas];
    nuevas[preguntaActual] = opcionIdx;
    setRespuestas(nuevas);
  }

  function siguientePregunta() {
    if (!cap) return;
    setRespuestaSeleccionada(null);
    setMostrarExplicacion(false);
    if (preguntaActual < cap.preguntas_json.length - 1) {
      setPreguntaActual(p => p + 1);
    } else {
      finalizarEvaluacion();
    }
  }

  async function finalizarEvaluacion() {
    if (!cap) return;
    const correctas = respuestas.filter((r, i) => r === cap.preguntas_json[i].correcta).length;
    const puntaje = Math.round((correctas / cap.preguntas_json.length) * 100);
    const aprobado = puntaje >= cap.puntaje_aprobacion;
    const tiempoSegundos = Math.round((Date.now() - startTime) / 1000);

    setScore(puntaje);

    const { data } = await supabase
      .from('capacitacion_sesiones')
      .insert({
        capacitacion_id: cap.id,
        institution_id: cap.institution_id,
        nombre: participante.nombre,
        empresa: participante.empresa,
        servicio: participante.servicio,
        cargo: participante.cargo,
        respuestas_json: respuestas,
        score: puntaje,
        aprobado,
        tiempo_segundos: tiempoSegundos,
      })
      .select('id')
      .single();

    if (data) setSesionId(data.id);
    setFase('resultado');
  }

  if (loading) return <LoadingScreen />;
  if (!cap) return <NotFoundScreen />;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', sans-serif" }}>
      {/* Header institucional */}
      <header style={{
        background: '#fff',
        borderBottom: '1px solid #e2e8f0',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
      }}>
        {institution?.logo_url && (
          <img src={institution.logo_url} alt="Logo" style={{ height: 36, objectFit: 'contain' }} />
        )}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2B5B' }}>
            {institution?.nombre || 'SYNAP'}
          </div>
          <div style={{ fontSize: 11, color: '#64748b' }}>Capacitación en Equipos Biomédicos</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            background: '#f1f5f9',
            borderRadius: 20,
            padding: '4px 12px',
            fontSize: 12,
            color: '#475569',
            fontWeight: 500
          }}>
            {cap.equipo}
          </div>
          {fase === 'slides' && (
            <div style={{ fontSize: 12, color: '#94a3b8' }}>
              {slideActual + 1} / {cap.slides_json.length}
            </div>
          )}
        </div>
      </header>

      {/* Contenido según fase */}
      {fase === 'identificacion' && (
        <IdentificacionFase
          cap={cap}
          participante={participante}
          setParticipante={setParticipante}
          onIniciar={iniciarCapacitacion}
        />
      )}
      {fase === 'slides' && (
        <SlidesFase
          cap={cap}
          slideActual={slideActual}
          animating={animating}
          slideProgress={slideProgress}
          onNext={nextSlide}
          onPrev={prevSlide}
        />
      )}
      {fase === 'evaluacion' && (
        <EvaluacionFase
          cap={cap}
          preguntaActual={preguntaActual}
          respuestaSeleccionada={respuestaSeleccionada}
          mostrarExplicacion={mostrarExplicacion}
          respuestas={respuestas}
          onResponder={responder}
          onSiguiente={siguientePregunta}
        />
      )}
      {fase === 'resultado' && (
        <ResultadoFase
          cap={cap}
          score={score}
          participante={participante}
          institution={institution}
          sesionId={sesionId}
        />
      )}
    </div>
  );
}

// ─── Fase 1: Identificación ──────────────────────────────────────────────────
function IdentificacionFase({ cap, participante, setParticipante, onIniciar }: {
  cap: Capacitacion;
  participante: Participante;
  setParticipante: (p: Participante) => void;
  onIniciar: () => void;
}) {
  const valido = participante.nombre.trim().length > 2 && participante.cargo.trim().length > 1;

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '40px 20px' }}>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #1B2B5B 0%, #2d4a8f 100%)',
        borderRadius: 20,
        padding: '40px 36px',
        color: '#fff',
        marginBottom: 32,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: -20, right: -20,
          width: 120, height: 120, borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)'
        }} />
        <div style={{ fontSize: 48, marginBottom: 12 }}>{cap.slides_json[0]?.icono || '📋'}</div>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, lineHeight: 1.2 }}>
          {cap.titulo}
        </div>
        <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 20 }}>{cap.descripcion}</div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 8, padding: '6px 14px', fontSize: 12 }}>
            📖 {cap.slides_json.length} slides
          </div>
          <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 8, padding: '6px 14px', fontSize: 12 }}>
            ✅ {cap.preguntas_json.length} preguntas
          </div>
          <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 8, padding: '6px 14px', fontSize: 12 }}>
            🎯 Mínimo {cap.puntaje_aprobacion}% para aprobar
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: '28px 28px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#1B2B5B', marginBottom: 6 }}>
          Registro del participante
        </div>
        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>
          Tus datos quedarán registrados en el certificado de capacitación.
        </div>

        {[
          { key: 'nombre', label: 'Nombre completo', placeholder: 'Ej: María González', required: true },
          { key: 'empresa', label: 'Empresa / Contratista', placeholder: 'Ej: TecnoMed S.A.S.' },
          { key: 'servicio', label: 'Servicio / Área', placeholder: 'Ej: UCI Adultos' },
          { key: 'cargo', label: 'Cargo', placeholder: 'Ej: Enfermera Jefe', required: true },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>
              {f.label} {f.required && <span style={{ color: '#DC2626' }}>*</span>}
            </label>
            <input
              type="text"
              placeholder={f.placeholder}
              value={(participante as any)[f.key]}
              onChange={e => setParticipante({ ...participante, [f.key]: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: '1.5px solid #e2e8f0',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
                fontFamily: 'inherit'
              }}
              onFocus={e => e.target.style.borderColor = '#1B2B5B'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
        ))}

        <button
          onClick={onIniciar}
          disabled={!valido}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: 10,
            border: 'none',
            background: valido ? 'linear-gradient(135deg, #1B2B5B, #2d4a8f)' : '#e2e8f0',
            color: valido ? '#fff' : '#94a3b8',
            fontSize: 15,
            fontWeight: 600,
            cursor: valido ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
            marginTop: 8
          }}
        >
          Comenzar capacitación →
        </button>
      </div>
    </div>
  );
}

// ─── Fase 2: Slides ──────────────────────────────────────────────────────────
function SlidesFase({ cap, slideActual, animating, slideProgress, onNext, onPrev }: {
  cap: Capacitacion;
  slideActual: number;
  animating: boolean;
  slideProgress: number;
  onNext: () => void;
  onPrev: () => void;
}) {
  const slide = cap.slides_json[slideActual];
  const esUltimo = slideActual === cap.slides_json.length - 1;

  const tipoConfig: Record<string, { bg: string; badge: string; badgeColor: string }> = {
    intro:        { bg: 'linear-gradient(135deg, #1B2B5B 0%, #2d4a8f 100%)', badge: 'Introducción', badgeColor: '#60a5fa' },
    concepto:     { bg: 'linear-gradient(135deg, #0f172a 0%, #1B2B5B 100%)', badge: 'Concepto clave', badgeColor: '#818cf8' },
    procedimiento:{ bg: 'linear-gradient(135deg, #064e3b 0%, #16A34A 100%)', badge: 'Procedimiento', badgeColor: '#34d399' },
    seguridad:    { bg: 'linear-gradient(135deg, #7f1d1d 0%, #DC2626 100%)', badge: 'Seguridad', badgeColor: '#fca5a5' },
    alarmas:      { bg: 'linear-gradient(135deg, #78350f 0%, #D97706 100%)', badge: 'Alarmas', badgeColor: '#fcd34d' },
    mantenimiento:{ bg: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)', badge: 'Mantenimiento', badgeColor: '#93c5fd' },
    caso:         { bg: 'linear-gradient(135deg, #581c87 0%, #9333ea 100%)', badge: 'Caso clínico', badgeColor: '#d8b4fe' },
    modos:        { bg: 'linear-gradient(135deg, #134e4a 0%, #0d9488 100%)', badge: 'Modos', badgeColor: '#5eead4' },
  };

  const cfg = tipoConfig[slide.tipo] || tipoConfig['concepto'];

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
      {/* Progress bar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          {cap.slides_json.map((s, i) => (
            <div key={i} style={{
              flex: 1,
              height: 4,
              borderRadius: 4,
              background: i < slideActual ? '#1B2B5B' : i === slideActual ? '#e2e8f0' : '#e2e8f0',
              margin: '0 2px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              {i < slideActual && <div style={{ position: 'absolute', inset: 0, background: '#1B2B5B' }} />}
              {i === slideActual && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: '#1B2B5B',
                  width: `${slideProgress}%`,
                  transition: 'width 0.1s linear'
                }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Slide card */}
      <div style={{
        background: cfg.bg,
        borderRadius: 20,
        padding: '36px 32px',
        color: '#fff',
        minHeight: 380,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        opacity: animating ? 0 : 1,
        transform: animating ? 'translateY(8px)' : 'translateY(0)',
        transition: 'opacity 0.3s, transform 0.3s',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: -30, left: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

        {/* Badge tipo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <span style={{
            background: 'rgba(255,255,255,0.12)',
            borderRadius: 20,
            padding: '4px 12px',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.05em',
            color: cfg.badgeColor,
            textTransform: 'uppercase' as const
          }}>
            {cfg.badge}
          </span>
          <span style={{ fontSize: 11, opacity: 0.5 }}>
            {slideActual + 1} de {cap.slides_json.length}
          </span>
        </div>

        {/* Icono y título */}
        <div style={{ fontSize: 52, marginBottom: 12, lineHeight: 1 }}>{slide.icono}</div>
        <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 6, lineHeight: 1.2 }}>{slide.titulo}</div>
        {slide.subtitulo && (
          <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 20 }}>{slide.subtitulo}</div>
        )}

        {/* Contenido */}
        <div
          style={{
            fontSize: 15,
            lineHeight: 1.7,
            opacity: 0.92,
            flex: 1,
            marginTop: 8
          }}
          dangerouslySetInnerHTML={{ __html: slide.contenido }}
        />
      </div>

      {/* Navegación */}
      <div style={{ display: 'flex', gap: 12, marginTop: 20, alignItems: 'center' }}>
        <button
          onClick={onPrev}
          disabled={slideActual === 0}
          style={{
            padding: '12px 20px',
            borderRadius: 10,
            border: '1.5px solid #e2e8f0',
            background: '#fff',
            color: slideActual === 0 ? '#cbd5e1' : '#374151',
            cursor: slideActual === 0 ? 'not-allowed' : 'pointer',
            fontSize: 14,
            fontWeight: 500,
            fontFamily: 'inherit'
          }}
        >
          ← Anterior
        </button>

        <div style={{ flex: 1, textAlign: 'center', fontSize: 13, color: '#94a3b8' }}>
          {cap.slides_json.map((_, i) => (
            <span key={i} style={{
              display: 'inline-block',
              width: i === slideActual ? 20 : 6,
              height: 6,
              borderRadius: 3,
              background: i === slideActual ? '#1B2B5B' : '#cbd5e1',
              margin: '0 2px',
              transition: 'all 0.2s'
            }} />
          ))}
        </div>

        <button
          onClick={onNext}
          style={{
            padding: '12px 24px',
            borderRadius: 10,
            border: 'none',
            background: esUltimo ? '#16A34A' : '#1B2B5B',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            fontFamily: 'inherit',
            boxShadow: '0 4px 12px rgba(27,43,91,0.3)'
          }}
        >
          {esUltimo ? '✅ Ir a la evaluación' : 'Siguiente →'}
        </button>
      </div>
    </div>
  );
}

// ─── Fase 3: Evaluación ──────────────────────────────────────────────────────
function EvaluacionFase({ cap, preguntaActual, respuestaSeleccionada, mostrarExplicacion, respuestas, onResponder, onSiguiente }: {
  cap: Capacitacion;
  preguntaActual: number;
  respuestaSeleccionada: number | null;
  mostrarExplicacion: boolean;
  respuestas: (number | null)[];
  onResponder: (i: number) => void;
  onSiguiente: () => void;
}) {
  const pregunta = cap.preguntas_json[preguntaActual];
  const esUltima = preguntaActual === cap.preguntas_json.length - 1;
  const correctas = respuestas.filter((r, i) => r === cap.preguntas_json[i]?.correcta && r !== null).length;

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px' }}>
      {/* Header evaluación */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: '20px 24px',
        marginBottom: 20,
        border: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ fontSize: 13, color: '#64748b' }}>Evaluación final</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1B2B5B' }}>
            Pregunta {preguntaActual + 1} de {cap.preguntas_json.length}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: '#64748b' }}>Correctas</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#16A34A' }}>{correctas}</div>
        </div>
      </div>

      {/* Barra progreso preguntas */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {cap.preguntas_json.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 5, borderRadius: 4,
            background: i < preguntaActual
              ? (respuestas[i] === cap.preguntas_json[i].correcta ? '#16A34A' : '#DC2626')
              : i === preguntaActual ? '#D97706' : '#e2e8f0'
          }} />
        ))}
      </div>

      {/* Pregunta */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: '28px 28px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
      }}>
        <div style={{ fontSize: 17, fontWeight: 600, color: '#0f172a', marginBottom: 24, lineHeight: 1.4 }}>
          {pregunta.pregunta}
        </div>

        {/* Opciones */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
          {pregunta.opciones.map((opcion, i) => {
            const seleccionada = respuestaSeleccionada === i;
            const esCorrecta = i === pregunta.correcta;
            const mostrar = respuestaSeleccionada !== null;

            let bg = '#f8fafc';
            let border = '#e2e8f0';
            let color = '#374151';

            if (mostrar && esCorrecta) { bg = '#f0fdf4'; border = '#16A34A'; color = '#166534'; }
            else if (mostrar && seleccionada && !esCorrecta) { bg = '#fef2f2'; border = '#DC2626'; color = '#991b1b'; }

            return (
              <button
                key={i}
                onClick={() => onResponder(i)}
                disabled={respuestaSeleccionada !== null}
                style={{
                  padding: '14px 18px',
                  borderRadius: 10,
                  border: `2px solid ${border}`,
                  background: bg,
                  color,
                  fontSize: 14,
                  textAlign: 'left' as const,
                  cursor: respuestaSeleccionada !== null ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  transition: 'all 0.2s',
                  fontFamily: 'inherit',
                  fontWeight: seleccionada || (mostrar && esCorrecta) ? 600 : 400
                }}
              >
                <span style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: mostrar && esCorrecta ? '#16A34A' : mostrar && seleccionada ? '#DC2626' : '#e2e8f0',
                  color: mostrar && (esCorrecta || seleccionada) ? '#fff' : '#64748b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, flexShrink: 0
                }}>
                  {mostrar && esCorrecta ? '✓' : mostrar && seleccionada && !esCorrecta ? '✗' : String.fromCharCode(65 + i)}
                </span>
                {opcion}
              </button>
            );
          })}
        </div>

        {/* Explicación */}
        {mostrarExplicacion && (
          <div style={{
            marginTop: 20,
            padding: '16px 18px',
            borderRadius: 10,
            background: respuestaSeleccionada === pregunta.correcta ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${respuestaSeleccionada === pregunta.correcta ? '#bbf7d0' : '#fecaca'}`,
          }}>
            <div style={{
              fontSize: 13,
              fontWeight: 700,
              marginBottom: 4,
              color: respuestaSeleccionada === pregunta.correcta ? '#166534' : '#991b1b'
            }}>
              {respuestaSeleccionada === pregunta.correcta ? '✅ ¡Correcto!' : '❌ Incorrecto'}
            </div>
            <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
              {pregunta.explicacion}
            </div>
          </div>
        )}

        {/* Botón siguiente */}
        {respuestaSeleccionada !== null && (
          <button
            onClick={onSiguiente}
            style={{
              width: '100%',
              marginTop: 20,
              padding: '14px',
              borderRadius: 10,
              border: 'none',
              background: esUltima ? '#16A34A' : '#1B2B5B',
              color: '#fff',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit'
            }}
          >
            {esUltima ? '📊 Ver resultado' : 'Siguiente pregunta →'}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Fase 4: Resultado ───────────────────────────────────────────────────────
function ResultadoFase({ cap, score, participante, institution, sesionId }: {
  cap: Capacitacion;
  score: number;
  participante: Participante;
  institution: Institution | null;
  sesionId: string | null;
}) {
  const aprobado = score >= cap.puntaje_aprobacion;
  const fecha = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px' }}>
      {/* Resultado badge */}
      <div style={{
        textAlign: 'center',
        padding: '32px 20px 24px',
        marginBottom: 24
      }}>
        <div style={{ fontSize: 72, marginBottom: 12 }}>
          {aprobado ? '🎉' : '📚'}
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: aprobado ? '#16A34A' : '#DC2626', marginBottom: 8 }}>
          {aprobado ? '¡Capacitación aprobada!' : 'No aprobado'}
        </div>
        <div style={{ fontSize: 16, color: '#64748b' }}>
          {aprobado
            ? 'Has completado exitosamente esta capacitación.'
            : `Necesitas mínimo ${cap.puntaje_aprobacion}% para aprobar. ¡Inténtalo de nuevo!`}
        </div>
      </div>

      {/* Score circular */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: '28px',
        marginBottom: 20,
        border: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        gap: 24
      }}>
        <div style={{
          width: 100, height: 100, borderRadius: '50%',
          background: `conic-gradient(${aprobado ? '#16A34A' : '#DC2626'} ${score * 3.6}deg, #e2e8f0 0deg)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          position: 'relative'
        }}>
          <div style={{
            width: 78, height: 78, borderRadius: '50%',
            background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column' as const
          }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: aprobado ? '#16A34A' : '#DC2626' }}>{score}%</span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1B2B5B', marginBottom: 4 }}>
            {cap.titulo}
          </div>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
            Participante: <strong>{participante.nombre}</strong>
          </div>
          <div style={{ fontSize: 13, color: '#64748b' }}>
            Puntaje mínimo: {cap.puntaje_aprobacion}% &nbsp;|&nbsp; Obtenido: <strong style={{ color: aprobado ? '#16A34A' : '#DC2626' }}>{score}%</strong>
          </div>
        </div>
      </div>

      {/* Certificado (si aprobó) */}
      {aprobado && sesionId && (
        <div style={{
          background: 'linear-gradient(135deg, #1B2B5B 0%, #2d4a8f 100%)',
          borderRadius: 16,
          padding: '28px',
          color: '#fff',
          marginBottom: 20,
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
          <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 4, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>
            Certificado de Capacitación
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
            {institution?.nombre || 'Institución de Salud'}
          </div>
          <div style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.6, marginBottom: 20 }}>
            Se certifica que <strong>{participante.nombre}</strong>
            {participante.cargo && <>, {participante.cargo}</>}
            {participante.empresa && <> de {participante.empresa}</>}
            , completó y aprobó la capacitación en <strong>{cap.equipo}</strong> con un puntaje de <strong>{score}%</strong>.
            <br />Fecha: {fecha}
          </div>
          <a
            href={`/api/capacitaciones/certificado?sesion=${sesionId}`}
            target="_blank"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: '#16A34A',
              color: '#fff',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none'
            }}
          >
            📄 Descargar certificado PDF
          </a>
        </div>
      )}

      {/* No aprobado — reintentar */}
      {!aprobado && (
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: '24px',
          border: '1px solid #fecaca',
          marginBottom: 20,
          textAlign: 'center' as const
        }}>
          <div style={{ fontSize: 15, color: '#374151', marginBottom: 16 }}>
            Repasa el material y vuelve a intentarlo. ¡Puedes lograrlo!
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 28px',
              borderRadius: 8,
              border: 'none',
              background: '#1B2B5B',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit'
            }}
          >
            🔄 Volver a intentar
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Loading / Not Found ─────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 16, animation: 'spin 1s linear infinite' }}>⏳</div>
        <div style={{ color: '#64748b', fontSize: 15 }}>Cargando capacitación...</div>
      </div>
    </div>
  );
}

function NotFoundScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <div style={{ fontSize: 18, fontWeight: 600, color: '#1B2B5B', marginBottom: 8 }}>Capacitación no encontrada</div>
        <div style={{ color: '#64748b' }}>El enlace puede haber expirado o no estar disponible.</div>
      </div>
    </div>
  );
}
