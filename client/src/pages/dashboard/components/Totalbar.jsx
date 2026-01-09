import React, { useEffect, useMemo, useState } from 'react'
import api from "../../../db/api"

const formatMoney = (v) => {
  const n = Number(v || 0)
  return n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const formatInt = (v) => {
  const n = Number(v || 0)
  return n.toLocaleString("th-TH")
}

const StatCard = ({ title, value, sub }) => {
  return (
    <div className='rounded-lg border border-gray-100 bg-white p-4 shadow-sm'>
      <div className='text-m font-semibold'>{title}</div>
      <div className='mt-2 text-3xl font-semibold text-gray-900'>{value}</div>
      {sub ? <div className='mt-1 text-xs text-gray-400'>{sub}</div> : null}
    </div>
  )
}

const Totalbar = ({ params }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [summary, setSummary] = useState({
    total_revenue: 0,
    total_order: 0,
    total_member: 0
  })
  
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
        const res = await api.get("/dashboard/summary?from=2025-10-01")
        const data = res?.data || {}
        if (alive) {
          setSummary({
            total_revenue: data.total_revenue ?? 0,
            total_order: data.total_order ?? 0,
            total_member: data.total_member ?? 0
          })
        }
      } catch {
        if (alive) {
          setError("โหลดสรุปข้อมูลไม่สำเร็จ")
          setSummary({ total_revenue: 0, total_order: 0, total_member: 0 })
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
  
  if (loading) {
    return (
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-6'>
        <div className='h-[122px] rounded-lg bg-gray-100 animate-pulse'/>
        <div className='h-[122px] rounded-lg bg-gray-100 animate-pulse'/>
        <div className='h-[122px] rounded-lg bg-gray-100 animate-pulse'/>
      </div>
    )
  }
  
  return (
    <div className='grid grid-cols-1 sm:grid-cols-3 gap-6'>
      <StatCard title="Total Revenue" value={`฿ ${formatMoney(summary.total_revenue)}`} sub="example"/>
      <StatCard title="Total Order" value={formatInt(summary.total_order)} sub="example"/>
      <StatCard title="Total Member" value={formatInt(summary.total_member)}/>
      {error ? <div className='sm:col-span-3 text-sm text-red-500'>{error}</div> : null}
    </div>
  )
}

export default Totalbar