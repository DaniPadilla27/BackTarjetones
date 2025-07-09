const express = require("express")
const router = express.Router()
const { sql, config } = require("./db")
const crypto = require("crypto")

// Implementación exacta compatible con .NET TripleDES + MD5
function encryptString(inputString, secretKey) {
  try {
    // 1. Crear hash MD5 de la clave secreta (igual que en VB.NET)
    const md5Hash = crypto.createHash("md5")
    md5Hash.update(secretKey, "ascii")
    const keyBytes = md5Hash.digest()

    // 2. TripleDES necesita 24 bytes, pero MD5 da 16 bytes
    // En .NET, TripleDES automáticamente extiende la clave
    const tripleDesKey = Buffer.concat([keyBytes, keyBytes.slice(0, 8)])

    // 3. Convertir string a bytes UTF-8 (igual que Encoding.UTF8.GetBytes en VB.NET)
    const inputBytes = Buffer.from(inputString, "utf8")

    // 4. Crear cipher TripleDES en modo ECB (sin IV)
    const cipher = crypto.createCipheriv("des-ede3-ecb", tripleDesKey, null)
    cipher.setAutoPadding(true)

    // 5. Encriptar
    let encrypted = cipher.update(inputBytes)
    const final = cipher.final()
    encrypted = Buffer.concat([encrypted, final])

    // 6. Convertir a hexadecimal en mayúsculas (igual que en VB.NET)
    return encrypted.toString("hex").toUpperCase()
  } catch (error) {
    console.error("Error en encriptación:", error)
    return ""
  }
}

router.post("/login", async (req, res) => {
  const { usuario, password } = req.body

  if (!usuario || !password) {
    return res.status(400).json({ error: "Usuario y contraseña requeridos" })
  }

  // Encriptar la contraseña usando la misma lógica que VB.NET
  const encryptedPassword = encryptString(password, "Pwd")

  console.log(`🔐 Login attempt:`)
  console.log(`   Usuario: ${usuario}`)
  console.log(`   Password original: ${password}`)
  console.log(`   Password encriptado: ${encryptedPassword}`)

  try {
    await sql.connect(config)

    // Buscar usuario con contraseña encriptada
    const result = await sql.query`
      SELECT TOP 1 *
      FROM usuarios
      WHERE usuario = ${usuario} AND contraseña = ${encryptedPassword}
    `

    if (result.recordset.length === 0) {
      // Para debug: mostrar qué contraseñas hay en la BD para este usuario
      const debugResult = await sql.query`
        SELECT contraseña
        FROM usuarios
        WHERE usuario = ${usuario}
      `

      if (debugResult.recordset.length > 0) {
        console.log(`❌ Login fallido:`)
        console.log(`   Contraseña en BD: ${debugResult.recordset[0].contraseña}`)
        console.log(`   Contraseña calculada: ${encryptedPassword}`)
        console.log(`   ¿Coinciden?: ${debugResult.recordset[0].contraseña === encryptedPassword}`)
      } else {
        console.log(`❌ Usuario '${usuario}' no encontrado en la base de datos`)
      }

      return res.status(401).json({ error: "Nombre de usuario o contraseña no válidos." })
    }

    const user = result.recordset[0]
    console.log(`✅ Usuario encontrado: ${user.nombre}`)

    // Verificar si el usuario está activo
    if (user.inactivo) {
      console.log(`❌ Usuario inactivo: ${usuario}`)
      return res.status(403).json({ error: "Usuario inactivo." })
    }

    // Respuesta exitosa simplificada (sin permisos)
    const response = {
      status: true,
      usuario: usuario.toUpperCase(),
      name: user.nombre,
      pCnf: user.config || false,
      pUsu: user.usuarios || false,
      idRegion: user.idSedeRegion || null,
      pPanel: user.panel || false,
      message: "Login exitoso",
    }

    console.log(`✅ Login exitoso para: ${usuario}`)
    res.json(response)
  } catch (error) {
    console.error("❌ Error en login:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

// Endpoint adicional para probar la encriptación
router.post("/test-encrypt", (req, res) => {
  const { text, key } = req.body

  if (!text || !key) {
    return res.status(400).json({ error: "Se requieren text y key" })
  }

  const encrypted = encryptString(text, key)

  res.json({
    original: text,
    key: key,
    encrypted: encrypted,
  })
})

module.exports = router
