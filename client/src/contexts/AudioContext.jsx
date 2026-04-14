import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

const AudioContext = createContext(null)

const STORAGE_KEYS = {
    bgmEnabled: 'audio.bgm.enabled',
    sfxEnabled: 'audio.sfx.enabled',
    bgmVolume: 'audio.bgm.volume',
    sfxVolume: 'audio.sfx.volume',
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

function readStoredBool(key, fallback) {
    if (typeof window === 'undefined') return fallback
    const raw = window.localStorage.getItem(key)
    if (raw == null) return fallback
    return raw === 'true'
}

function readStoredVolume(key, fallback) {
    if (typeof window === 'undefined') return fallback
    const raw = Number(window.localStorage.getItem(key))
    if (!Number.isFinite(raw)) return fallback
    return clamp(raw, 0, 1)
}

function scheduleTone(ctx, output, {
    frequency,
    startTime,
    duration,
    type = 'sine',
    peakGain = 0.12,
    attack = 0.01,
    release = 0.15,
    slideTo,
}) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = type
    osc.frequency.setValueAtTime(Math.max(20, frequency), startTime)
    if (slideTo && Number.isFinite(slideTo)) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), startTime + duration)
    }

    gain.gain.setValueAtTime(0.0001, startTime)
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peakGain), startTime + attack)
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + Math.max(attack + 0.01, duration + release))

    osc.connect(gain)
    gain.connect(output)

    osc.start(startTime)
    osc.stop(startTime + Math.max(attack + 0.01, duration + release + 0.02))
}

export function AudioProvider({ children }) {
    const [bgmEnabled, setBgmEnabled] = useState(() => readStoredBool(STORAGE_KEYS.bgmEnabled, true))
    const [sfxEnabled, setSfxEnabled] = useState(() => readStoredBool(STORAGE_KEYS.sfxEnabled, true))
    const [bgmVolume, setBgmVolume] = useState(() => readStoredVolume(STORAGE_KEYS.bgmVolume, 0.3))
    const [sfxVolume, setSfxVolume] = useState(() => readStoredVolume(STORAGE_KEYS.sfxVolume, 0.7))

    const audioCtxRef = useRef(null)
    const masterGainRef = useRef(null)
    const bgmGainRef = useRef(null)
    const sfxGainRef = useRef(null)
    const bgmLoopTimerRef = useRef(null)
    const beatRef = useRef(0)
    const unlockedRef = useRef(false)

    const stopBgmLoop = useCallback(() => {
        if (bgmLoopTimerRef.current) {
            window.clearInterval(bgmLoopTimerRef.current)
            bgmLoopTimerRef.current = null
        }
    }, [])

    const ensureAudioGraph = useCallback(async () => {
        if (typeof window === 'undefined') return null

        const AudioCtor = window.AudioContext || window.webkitAudioContext
        if (!AudioCtor) return null

        if (!audioCtxRef.current) {
            const ctx = new AudioCtor()

            const master = ctx.createGain()
            master.gain.value = 0.9
            master.connect(ctx.destination)

            const bgmGain = ctx.createGain()
            bgmGain.gain.value = bgmEnabled ? clamp(bgmVolume, 0, 1) : 0
            bgmGain.connect(master)

            const sfxGain = ctx.createGain()
            sfxGain.gain.value = sfxEnabled ? clamp(sfxVolume, 0, 1) : 0
            sfxGain.connect(master)

            audioCtxRef.current = ctx
            masterGainRef.current = master
            bgmGainRef.current = bgmGain
            sfxGainRef.current = sfxGain
        }

        const ctx = audioCtxRef.current
        if (ctx?.state === 'suspended') {
            try {
                await ctx.resume()
            } catch {
                return null
            }
        }

        return ctx
    }, [bgmEnabled, bgmVolume, sfxEnabled, sfxVolume])

    const startBgmLoop = useCallback(async () => {
        if (!bgmEnabled || bgmLoopTimerRef.current) return

        const ctx = await ensureAudioGraph()
        if (!ctx || !bgmGainRef.current) return

        const melody = [523.25, 659.25, 783.99, 659.25, 587.33, 659.25, 523.25, 0]
        const bass = [130.81, 130.81, 146.83, 146.83, 164.81, 164.81, 146.83, 146.83]
        const beatMs = 430
        const lookAhead = 0.06

        const tick = () => {
            const beat = beatRef.current
            const when = ctx.currentTime + lookAhead

            const leadNote = melody[beat % melody.length]
            if (leadNote > 0) {
                scheduleTone(ctx, bgmGainRef.current, {
                    frequency: leadNote,
                    startTime: when,
                    duration: 0.22,
                    type: 'triangle',
                    peakGain: 0.08,
                    attack: 0.015,
                    release: 0.18,
                    slideTo: leadNote * 0.995,
                })
            }

            if (beat % 2 === 0) {
                const bassNote = bass[beat % bass.length]
                scheduleTone(ctx, bgmGainRef.current, {
                    frequency: bassNote,
                    startTime: when,
                    duration: 0.35,
                    type: 'sine',
                    peakGain: 0.06,
                    attack: 0.02,
                    release: 0.22,
                    slideTo: bassNote * 0.98,
                })
            }

            beatRef.current += 1
        }

        tick()
        bgmLoopTimerRef.current = window.setInterval(tick, beatMs)
    }, [bgmEnabled, ensureAudioGraph])

    const unlockAudio = useCallback(async () => {
        if (unlockedRef.current) return

        const ctx = await ensureAudioGraph()
        if (!ctx) return

        unlockedRef.current = true
        if (bgmEnabled) {
            startBgmLoop()
        }
    }, [bgmEnabled, ensureAudioGraph, startBgmLoop])

    const playSfx = useCallback(async (kind = 'click') => {
        if (!sfxEnabled) return

        const ctx = await ensureAudioGraph()
        if (!ctx || !sfxGainRef.current) return

        const now = ctx.currentTime + 0.005

        if (kind === 'correct') {
            scheduleTone(ctx, sfxGainRef.current, {
                frequency: 523.25,
                startTime: now,
                duration: 0.08,
                type: 'triangle',
                peakGain: 0.1,
            })
            scheduleTone(ctx, sfxGainRef.current, {
                frequency: 659.25,
                startTime: now + 0.09,
                duration: 0.1,
                type: 'triangle',
                peakGain: 0.11,
            })
            scheduleTone(ctx, sfxGainRef.current, {
                frequency: 783.99,
                startTime: now + 0.2,
                duration: 0.13,
                type: 'triangle',
                peakGain: 0.12,
            })
            return
        }

        if (kind === 'wrong') {
            scheduleTone(ctx, sfxGainRef.current, {
                frequency: 329.63,
                startTime: now,
                duration: 0.1,
                type: 'sawtooth',
                peakGain: 0.12,
                slideTo: 220,
            })
            scheduleTone(ctx, sfxGainRef.current, {
                frequency: 220,
                startTime: now + 0.11,
                duration: 0.14,
                type: 'sawtooth',
                peakGain: 0.12,
                slideTo: 164.81,
            })
            return
        }

        if (kind === 'success') {
            scheduleTone(ctx, sfxGainRef.current, {
                frequency: 587.33,
                startTime: now,
                duration: 0.09,
                type: 'square',
                peakGain: 0.1,
            })
            scheduleTone(ctx, sfxGainRef.current, {
                frequency: 783.99,
                startTime: now + 0.1,
                duration: 0.11,
                type: 'square',
                peakGain: 0.1,
            })
            scheduleTone(ctx, sfxGainRef.current, {
                frequency: 987.77,
                startTime: now + 0.21,
                duration: 0.16,
                type: 'square',
                peakGain: 0.11,
            })
            return
        }

        scheduleTone(ctx, sfxGainRef.current, {
            frequency: 740,
            startTime: now,
            duration: 0.05,
            type: 'square',
            peakGain: 0.08,
            slideTo: 620,
        })
    }, [ensureAudioGraph, sfxEnabled])

    useEffect(() => {
        if (typeof window === 'undefined') return
        window.localStorage.setItem(STORAGE_KEYS.bgmEnabled, String(bgmEnabled))
    }, [bgmEnabled])

    useEffect(() => {
        if (typeof window === 'undefined') return
        window.localStorage.setItem(STORAGE_KEYS.sfxEnabled, String(sfxEnabled))
    }, [sfxEnabled])

    useEffect(() => {
        if (typeof window === 'undefined') return
        window.localStorage.setItem(STORAGE_KEYS.bgmVolume, String(clamp(bgmVolume, 0, 1)))
    }, [bgmVolume])

    useEffect(() => {
        if (typeof window === 'undefined') return
        window.localStorage.setItem(STORAGE_KEYS.sfxVolume, String(clamp(sfxVolume, 0, 1)))
    }, [sfxVolume])

    useEffect(() => {
        if (!audioCtxRef.current || !bgmGainRef.current) return

        const ctx = audioCtxRef.current
        const target = bgmEnabled ? clamp(bgmVolume, 0, 1) : 0
        bgmGainRef.current.gain.cancelScheduledValues(ctx.currentTime)
        bgmGainRef.current.gain.setTargetAtTime(target, ctx.currentTime, 0.08)

        if (bgmEnabled) {
            startBgmLoop()
        } else {
            stopBgmLoop()
        }
    }, [bgmEnabled, bgmVolume, startBgmLoop, stopBgmLoop])

    useEffect(() => {
        if (!audioCtxRef.current || !sfxGainRef.current) return

        const ctx = audioCtxRef.current
        const target = sfxEnabled ? clamp(sfxVolume, 0, 1) : 0
        sfxGainRef.current.gain.cancelScheduledValues(ctx.currentTime)
        sfxGainRef.current.gain.setTargetAtTime(target, ctx.currentTime, 0.05)
    }, [sfxEnabled, sfxVolume])

    useEffect(() => {
        const handleFirstInteraction = () => {
            unlockAudio()
        }

        window.addEventListener('pointerdown', handleFirstInteraction, true)
        window.addEventListener('keydown', handleFirstInteraction, true)

        return () => {
            window.removeEventListener('pointerdown', handleFirstInteraction, true)
            window.removeEventListener('keydown', handleFirstInteraction, true)
        }
    }, [unlockAudio])

    useEffect(() => {
        return () => {
            stopBgmLoop()
            if (audioCtxRef.current) {
                audioCtxRef.current.close().catch(() => {})
            }
        }
    }, [stopBgmLoop])

    const value = useMemo(() => ({
        bgmEnabled,
        setBgmEnabled,
        sfxEnabled,
        setSfxEnabled,
        bgmVolume,
        setBgmVolume,
        sfxVolume,
        setSfxVolume,
        unlockAudio,
        playSfx,
    }), [bgmEnabled, sfxEnabled, bgmVolume, sfxVolume, unlockAudio, playSfx])

    return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
}

export function useAudio() {
    const context = useContext(AudioContext)
    if (!context) {
        throw new Error('useAudio must be used within AudioProvider')
    }
    return context
}
