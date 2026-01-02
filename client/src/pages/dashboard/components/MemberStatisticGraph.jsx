import React, { useEffect, useState, useMemo } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const mockMemberRows = [
  { label: "12-01", new_member: 2, active_member: 14 },
  { label: "12-02", new_member: 1, active_member: 12 },
  { label: "12-03", new_member: 4, active_member: 19 },
  { label: "12-04", new_member: 2, active_member: 16 },
  { label: "12-05", new_member: 5, active_member: 22 },
  { label: "12-06", new_member: 3, active_member: 20 },
  { label: "12-07", new_member: 6, active_member: 26 },
]

const formatInt = (v) => Number(v || 0).toLocaleString("th-TH")

const formatShortDate = (s) => {
  if (!s) return ""
  if (typeof s === "string" && s.length >= 10) return s.slice(5, 10)
  return String(s)
}

const MemberStatisticGraph = ({ params }) => {
  const [loading, setLoading] = useState(true)
  const [error ,setError] = useState("")
  const [metric, setMetric] = useState("new")
  const [rows, setRows] = useState([])
  
  const query = useMemo(() => {
    const p = params || {}
    const q = {}
    
    if (p.from) q.from = p.from
    if (p.to) q.to = p.to
    if (p.group_by) q.group_by = p.group_by
    
    return q
  }, [params])
  
  useEffect(() => {
    let alive = true
    
    const load = async () => {
      setLoading(true)
      setError("")
      try {
        if (alive) {
          setRows(mockMemberRows)
        }
      } catch {
        if (alive) {
          setError("โหลดกราฟสมาชิกไม่สำเร็จ")
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
  
  const activeKey = metric === "new" ? "new_member" : "active_member"
  
  const canShowActive = rows.some((r) => Number(r.active_member) || 0)
  
  return (
    <div className='rounded-lg border border-gray-100 bg-white p-4 shadow-sm'>
      <div className='flex items-center justify-between gap-3'>
        <div>
          <div className='text-base font-semibold text-gray-900'>Member Statistics</div>
          <div className='text-xs text-gray-400'>
            {metric === "new" ? "New members over time" : "Active members over time"}
          </div>
        </div>
        
        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={() => setMetric("new")}
            className={
              metric === "new"
                ? "rounded-md px-3 py-2 text-sm bg-gray-900 text-white"
                : "rounded-md px-3 py-2 text-sm bg-gray-100 text-gray-700"
            }
          >
            New
          </button>
          <button
            type='button'
            disabled={!canShowActive}
            onClick={() => setMetric("active")}
            className={
              !canShowActive
                ? "rounded-md px-3 py-2 text-sm bg-gray-100 text-gray-300 cursor-not-allowed"
                : metric === "active"
                ? "rounded-md px-3 py-2 text-sm bg-gray-900 text-white"
                : "rounded-md px-3 py-2 text-sm bg-gray-100 text-gray-700"
            }
            title={!canShowActive ? "ยังไม่มีข้อมูล Active Member จาก API" : "ดู Active Member"}
          >
            Active
          </button>
        </div>
      </div>
      
      <div className='mt-4 h-72'>
        {loading ? (
          <div className='h-full rounded-lg bg-gray-100 animate-pulse'></div>
        ) : rows.length === 0 ? (
          <div className='flex h-full items-center justify-center text-sm text-gray-400'>
            {error || "ไม่มีข้อมูล"}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 10, right: 12, left: 0, bottom: 0}}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12 }}
                tickFormatter={formatShortDate}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={formatInt}
              />
              <Tooltip
                formatter={(value) => [
                  formatInt(value),
                  metric === "new" ? "New members" : "Active Members"
                ]}
              />
              <Line
                type="monotone"
                dataKey={activeKey}
                stroke="green"
                strokeWidth={3}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
      
      { error && <div className='mt-3 text-sm text-red-500'>{error}</div> }
      {!loading && !error && !canShowActive ? (
        <div className='mt-2 text-xs text-gray-400'>
          *โหมด Active จะเปิดเองเมื่อ API ส่งค่า <code>active_member</code> มา
        </div>
      ) : null}
    </div>
  )
}

export default MemberStatisticGraph