import React, { useState, useEffect, useMemo } from 'react'

const mockTopCategories = [
  { category: "Coffee", total_revenue: 180000, total_order: 620 },
  { category: "Tea", total_revenue: 95000, total_order: 310 },
  { category: "Bakery", total_revenue: 72000, total_order: 210 },
  { category: "Other", total_revenue: 38000, total_order: 120 },
]

const formatMoney = (v) => {
  return Number(v || 0).toLocaleString("th-TH", {
    maximumFractionDigits: 0
  })
}

const formatInt = (v) => Number(v || 0).toLocaleString("th-TH")

const TopCategoriesGraph = ({ params, limit = 6}) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [rows, setRows] = useState([])
  const [metric, setMetric] = useState("revenue")
  
  const query = useMemo(() => {
    const p = params || {}
    const q = { limit }
    
    return q
  }, [params, limit])
  
  useEffect(() => {
    let alive = true
    
    const load = async () => {
      setLoading(true)
      setError("")
      
      try {
        if (alive) {
          setRows(mockTopCategories)
        }
      } catch {
        if (alive) {
          setError("โหลดกราฟหมวดหมู่ไม่สำเร็จ")
          setRows([])
        }
      } finally {
        if (alive) {
          setLoading(false)
        }
      }
    }
    
    load()
    return () => {
      alive = false
    }
  }, [query])
  
  return (
    <div></div>
  )
}

export default TopCategoriesGraph