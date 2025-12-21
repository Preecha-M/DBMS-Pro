import bcrypt from "bcryptjs"
import { pool } from "../../db/pool.js"
import { signToken } from "../../utils/signToken.js"

export async function loginService(username, password) {
  const client = await pool.connect()
  
  try {
    const q = `
      SELECT employee_id, username, password, role, status
      FROM employee
      WHERE username=$1
    `
    
    const { rows } = await client.query(q, [username])
    const emp = rows[0]
    if (!emp) {
      throw Object.assign(new Error("Invalid credentials"), { status: 401 })
    }
    
    if ((emp.status || "").toLowerCase() === "resigned") {
      throw Object.assign(new Error("Employee resigned"), { status: 401 })
    }
    
    const ok = await bcrypt.compare(password, emp.password)
    if (!ok) {
      throw Object.assign(new Error("Invalid credentials"), { status: 401 })
    }
    
    const token = signToken({
      employee_id: emp.employee_id,
      username: emp.username,
      role: emp.role || "Staff"
    })
    
    return {
      token
    }
    
  } finally {
    client.release()
  }
}