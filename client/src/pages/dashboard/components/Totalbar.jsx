import React, { useEffect, useState } from 'react'

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

const Totalbar = () => {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({
    total_revenue: 0,
    total_order: 0,
    total_member: 0
  })
  
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        setSummary({
          total_revenue: 0,
          total_order: 0,
          total_member: 0
        })
      } catch {
        setSummary({ total_revenue: 0, total_order: 0, total_member: 0 })
      } finally {
        setLoading(false)
      }
    }
    
    load()
  }, [])
  
  if (loading) {
    return (
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
        <div className='h-[92px] rounded-lg bg-gray-100 animate-pulse'/>
        <div className='h-[92px] rounded-lg bg-gray-100 animate-pulse'/>
        <div className='h-[92px] rounded-lg bg-gray-100 animate-pulse'/>
      </div>
    )
  }
  
  return (
    <div className='grid grid-cols-1 sm:grid-cols-3 gap-6'>
      <StatCard title="Total Revenue" value={`฿ ${formatMoney(summary.total_revenue)}`} sub="example"/>
      <StatCard title="Total Order" value={formatInt(summary.total_order)} sub="example"/>
      <StatCard title="Total Member" value={formatInt(summary.total_member)}/>
    </div>
  )
}

export default Totalbar