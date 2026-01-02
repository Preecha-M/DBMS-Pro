import React, { useEffect, useState, useMemo } from 'react'
import {
  CartesianGrid,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Line,
  BarChart
} from "recharts"

const mockSaleRows = [
  { label: "12-01", total_revenue: 12500, total_order: 42 },
  { label: "12-02", total_revenue: 9800,  total_order: 35 },
  { label: "12-03", total_revenue: 15300, total_order: 51 },
  { label: "12-04", total_revenue: 11200, total_order: 39 },
  { label: "12-05", total_revenue: 16800, total_order: 58 },
  { label: "12-06", total_revenue: 14200, total_order: 46 },
  { label: "12-07", total_revenue: 17600, total_order: 61 },
]

const formatMoney = (v) => {
  const n = Number(v || 0)
  return n.toLocaleString("th-TH", { maximumFractionDigits: 0 })
}

const formatInt = (v) => {
  const n = Number(v || 0)
  return n.toLocaleString("th-TH")
}

const formatShortDate = (s) => {
  if (!s) return ""
  if (typeof s === "string" && s.length >= 10) return s.slice(5, 10)
  return String(s)
}

const SaleStatisticGraph = ({ params }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [metric, setMetric] = useState("revenue")
  const [rows, setRows] = useState([])
  
  const query = useMemo(() => {
    const p = params || {}
    const q = {}
    
    if (p.from) q.from = p.from
    if (p.to) q.to = p.to
    if (p.branch_id) q.branch_id = p.branch_id
    
    return q
  }, [params])
  
  useEffect(() => {
    let alive = true
    
    const load = async () => {
      setLoading(true)
      setError("")
      try {
        if (alive) {
          setLoading(true)
          setRows(mockSaleRows)
        }
      } catch {
        if (alive) {
          setError("โหลดกราฟยอดขายไม่สำเร็จ!")
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
  
  const activeKey = metric === "revenue" ? "total_revenue" : "total_order"
  
  return (
    <div className='rounded-lg border border-gray-100 bg-white p-4 shadow-sm'>
      <div className='flex item-center justify-between gap-3'>
        <div>
          <div className='text-base font-semibold text-gray-900'>Sale Statistics</div>
          <div className='text-xs text-gray-400'>
            {metric === "revenue" ? "Revenue over time" : "Orders over time"}
          </div>
        </div>
        
        <div className='flex items-center gap-2'>
          <button
            type="button"
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
            type="button"
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
      
      <div className='mt-4 h-72'>
        {loading ? (
          <div className='h-full rounded-lg bg-gray-100 animate-pulse'></div>
        ) : rows.length === 0 ? (
          <div className='flex h-full items-center justify-center text-lg text-gray-400'>
            {error || "ไม่มีข้อมูล"}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={rows}
              margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
              >
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis
                dataKey="label"
                tickFormatter={formatShortDate}
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontsize: 12 }}
                tickFormatter={(v) => (metric === "revenue" ? formatMoney(v) : formatInt(v))}
              />
              <Tooltip
                formatter={(value) =>
                  metric === "revenue"
                    ? [`฿ ${formatMoney(value)}`, "Revenue"]
                    : [formatInt(value), "Orders"]
                }
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Line
                type="monotone"
                dataKey={activeKey}
                stroke='orange'
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
      
      { error && <div className='mt-3 text-sm text-red-500'>{error}</div> }
    </div>
  )
}

export default SaleStatisticGraph