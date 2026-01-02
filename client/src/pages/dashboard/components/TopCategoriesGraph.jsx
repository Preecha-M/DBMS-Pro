import React, { useState, useEffect, useMemo } from 'react'
import { ResponsiveContainer, PieChart, Pie, Tooltip, Legend, Cell } from "recharts"

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

const COLORS = ["#DE6047", "#AD3939", "#FC8849", "#FFA65E", "#FFC08F", "#ffd1afff"]

const TopCategoriesGraph = ({ params, limit = 6}) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [rows, setRows] = useState([])
  const [metric, setMetric] = useState("revenue")
  
  const query = useMemo(() => {
    const p = params || {}
    const q = { limit }
    
    if (p.from) q.from = p.from
    if (p.to) q.to = p.to
    if (p.branch_id) q.branch_id = p.branch_id
    
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
  
  const data = rows.map((r) => ({
    name: r.category,
    value: metric === "revenue" ? Number(r.total_revenue || 0) : Number(r.total_order || 0)
  }))
  
  const total = data.reduce((sum, d) => sum + (Number(d.value) || 0), 0)
  
  return (
    <div className='rounded-lg border border-gray-100 bg-white p-4 shadow-sm'>
      <div className='flex items-center justify-between gap-3'>
        <div>
          <div className='text-base font-semibold text-gray-900'>Top Categories</div>
          <div className='text-xs text-gray-400'>
            {metric === "revenue" ? "Share by revenue" : "Share by orders"}
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <button
            onClick={() => setMetric("revenue")}
            className={
              metric === "revenue"
                ? "rounded-md px-3 py-2 text-sm bg-gray-900 text-white"
                : "rounded-md px-3 py-2 text-sm bg-gray-100 text-gray-700"
            }
          >
            Revenue
          </button>
          <button
            onClick={() => setMetric("order")}
            className={
              metric === "order"
                ? "rounded-md px-3 py-2 text-sm bg-gray-900 text-white"
                : "rounded-md px-3 py-2 text-sm bg-gray-100 text-gray-700"
            }
          >
            Orders
          </button>
        </div>
      </div>
      
      <div className='mt-2 h-60.5'>
        {loading ? (
          <div className='h-full rounded-lg bg-gray-100 animate-pulse'></div>
        ) : data.length === 0 ? (
          <div>
            {error || "ไม่มีข้อมูล"}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
              >
                {data.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]}/>
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => {
                  const v = Number(value || 0)
                  const pct = total > 0 ? ((v / total) * 100).toFixed(1) : "0.0"
                  const pretty = metric === "revenue" ? `฿ ${formatMoney(v)}` : `${formatInt(v)} orders`
                  return [`${pretty} (${pct}%)`, name]
                }}
              />
              <Legend
                formatter={(value) => <span className='text-xs text-gray-700'>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
      
      {!loading && !error && data.length > 0 && (
        <div className='mt-2 text-xs text-gray-500'>
          Total:{" "}
          <span className='font-medium tex-gray-900'>
            {metric === "revenue" ? `฿ ${formatMoney(total)}` : `${formatInt(total)} orders`}
          </span>
        </div>
      )}
      
      {error && !loading && <div className='mt-2 text-sm text-red-500'>{error}</div>}
    </div>
  )
}

export default TopCategoriesGraph