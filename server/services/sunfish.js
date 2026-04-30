/**
 * sunfish.js — Sunfish API Service Layer
 *
 * Endpoint resmi Akebono:
 *   AUTH    : POST https://api-gateway.akebono-astra.co.id/bebas/api/keperluanBersama/authCekKeDataUser.php
 *   EMPLOYEE: GET  https://api-prod.akebono-astra.co.id/emp/get-by-npk?npk={npk}
 */

const axios = require('axios')
const https = require('https')

const sunfishClient = axios.create({
    timeout: 15000,
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
})

const isSunfishEnabled = () => {
    return !!(process.env.SUNFISH_AUTH_URL && process.env.SUNFISH_AUTH_URL.trim())
}

/**
 * STEP 1 — Validasi login ke Sunfish
 */
const validateLogin = async (npk, password) => {
    const url = process.env.SUNFISH_AUTH_URL
    const params = new URLSearchParams()
    params.append('npk', npk)
    params.append('password', password)

    try {
        const response = await sunfishClient.post(url, params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })

        const data = response.data
        // Logika validasi PHP endpoint
        const isValid =
            data?.status  === true  || data?.status  === 'true'  || data?.status  === 1    ||
            data?.success === true  || data?.success === 'true'  || data?.success === 1    ||
            data?.result  === 'success' || data?.result === 'true'                         ||
            data?.code    === 200   || data?.code    === '200'                             ||
            data?.isValid === true

        if (!isValid) {
            console.warn(`[Sunfish] Validation failed for NPK ${npk}. Response data:`, JSON.stringify(data))
        }

        return {
            valid: isValid,
            message: isValid ? 'OK' : (data?.message || data?.msg || 'NPK atau kata sandi salah')
        }
    } catch (err) {
        console.error(`[Sunfish] API error for NPK ${npk}:`, err.message)
        if (err.response) {
            console.error(`[Sunfish] Response Status: ${err.response.status}`)
            console.error(`[Sunfish] Response Body:`, JSON.stringify(err.response.data))
        }
        
        if (err.response?.status === 401 || err.response?.status === 403) {
            const apiMsg = err.response.data?.message || err.response.data?.msg
            return { valid: false, message: apiMsg || 'NPK atau kata sandi salah' }
        }
        throw new Error('Tidak dapat terhubung ke server autentikasi Sunfish.')
    }
}

/**
 * STEP 2 — Ambil data karyawan (Nama & Departemen)
 * Menggunakan field asli dari API Akebono: full_name, Department_Name, Section_Name
 */
const fetchEmployee = async (npk) => {
    const baseUrl = process.env.SUNFISH_EMPLOYEE_URL
    if (!baseUrl) return null

    try {
        const response = await sunfishClient.get(baseUrl, { params: { npk } })
        const apiRes = response.data
        
        // Sesuai data user: data dibungkus dalam properti 'data'
        const emp = apiRes.data || (Array.isArray(apiRes) ? apiRes[0] : apiRes)

        if (!emp) return null

        return {
            name:       emp.full_name       || emp.NAMA    || emp.nama   || npk,
            department: emp.Department_Name || emp.BAGIAN  || emp.bagian || 'Umum',
            position:   emp.Section_Name    || emp.JABATAN || emp.jabatan || 'Karyawan',
            email:      emp.email           || emp.EMAIL   || null,
        }
    } catch (err) {
        console.error('[Sunfish] fetchEmployee error:', err.message)
        return null
    }
}

module.exports = { isSunfishEnabled, validateLogin, fetchEmployee }
